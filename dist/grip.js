// grip.ts
function grip(action) {
  if (action instanceof Promise) {
    return promise(action);
  }
  try {
    const result = action();
    if (result instanceof Promise) {
      return promise(result);
    }
    return new Result(result, new Ok);
  } catch (err) {
    return new Result(null, Err.fromCatch(err));
  }
}

class Err extends Error {
  Ok() {
    return false;
  }
  Fail() {
    return true;
  }
  Of(cls) {
    return this.cause instanceof cls || this instanceof cls;
  }
  static fromCatch(error) {
    const e = new Err(typeof error === "string" ? error : error.message);
    e.cause = error;
    e.stack = error.stack;
    return e;
  }
}

class Ok {
  Ok() {
    return true;
  }
  Fail() {
    return false;
  }
  Of(cls) {
    return this instanceof cls;
  }
  toString() {
    return "Ok";
  }
}

class Result extends Array {
  0;
  1;
  constructor(result, status) {
    super(2);
    this[0] = result;
    this[1] = status;
  }
  get value() {
    return this[0];
  }
  get status() {
    return this[1];
  }
  Ok() {
    return this[1].Ok();
  }
  Fail() {
    return this[1].Fail();
  }
  Of(impl) {
    return this[1].Of(impl);
  }
}
var promise = (result) => {
  return result.then((res) => new Result(res, new Ok)).catch((err) => new Result(null, Err.fromCatch(err)));
};
export {
  grip,
  Ok,
  Err
};
