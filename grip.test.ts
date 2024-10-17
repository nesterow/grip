import { test, expect } from "bun:test";
import { grip } from "./grip";

test("Promise", async () => {
  const [result, status] = await grip(Promise.resolve("ok"));
  expect(result).toBe("ok");
  expect(status.Ok()).toBe(true);
});

test("Promise.reject", async () => {
  const [result, status] = await grip(() =>
    Promise.reject(new Error("not ok")),
  );
  expect(status.Ok()).toBe(false);
  expect(status.message).toBe("not ok");
  expect(result === null).toBe(true);
});

test("() => Promise", async () => {
  const [result, status] = await grip(() => Promise.resolve("ok"));
  expect(result).toBe("ok");
  expect(status.Ok()).toBe(true);
});

test("() => value", () => {
  const [result, status] = grip(() => "ok");
  expect(result).toBe("ok");
  expect(status.Ok()).toBe(true);
});

test("() => throw", async () => {
  const [_, status] = grip(() => {
    if (1) throw "not ok";
  });
  expect(status.Ok()).toBe(false);
  expect(status.message).toBe("not ok");
});

test("Result { 0, 1, value, Ok(), Fail() }", async () => {
  const result = grip(() => {
    if (1) throw "not ok";
  });
  expect(result.Ok()).toBe(false);
  expect(result.value === null).toBe(true);
  expect(result.status.message).toBe("not ok");
});

test("fetch err", async () => {
  const [result, status] = await grip(fetch("https://localhost:30012"));
  expect(status.Ok()).toBe(false);
  expect(result === null).toBe(true);
  expect(status.Of(Error)).toBe(true);
});

test("fetch json", async () => {
  const [result, fetchStatus] = await grip(() =>
    fetch("https://google.com/404"),
  );
  expect(fetchStatus.Ok()).toBe(true);
  expect(result.ok).toBe(false);
  const [json, jsonStatus] = await grip(result.json());
  expect(jsonStatus.Ok()).toBe(false);
  expect(jsonStatus.Of(SyntaxError)).toBe(true);
  expect(json === null).toBe(true);
});

test("function*", async () => {
  const res = grip(function* () {
    for (let i = 0; i < 3; i++) {
      if (i == 2) throw new Error("2");
      yield i;
    }
  });
  expect(res.Ok()).toBe(true);
  for (let [value, status] of res.Iter()) {
    if (status.Of(Error)) {
      break;
    }
    expect(value).toBeTypeOf("number");
  }
});

test("async function*", async () => {
  const res = grip(async function* () {
    for (let i = 0; i < 3; i++) {
      if (i == 2) throw new Error("2");
      yield i;
    }
  });
  expect(res.Ok()).toBe(true);
  for await (let [value, status] of res.Iter()) {
    if (status.Of(Error)) {
      break;
    }
    expect(value).toBeTypeOf("number");
  }
});
