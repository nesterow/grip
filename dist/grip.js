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
  Of(cls) {
    return this[1].Of(cls);
  }
  Iter() {
    const value = this.value;
    const that = this;
    if (typeof value !== "object" && !(typeof value[Symbol.iterator] === "function" || typeof value[Symbol.asyncIterator] === "function")) {
      return {
        async* [Symbol.asyncIterator]() {
          yield new Result(that.value, that.status);
        },
        *[Symbol.iterator]() {
          yield new Result(that.value, that.status);
        }
      };
    }
    return {
      async* [Symbol.asyncIterator]() {
        yield* asyncIterator(value);
      },
      *[Symbol.iterator]() {
        yield* iterator(value);
      }
    };
  }
}
var promise = (result) => {
  return result.then((res) => new Result(res, new Ok)).catch((err) => new Result(null, Err.fromCatch(err)));
};
var iterator = function* (iter) {
  try {
    let data = iter.next();
    while (!data.done) {
      yield new Result(data.value, new Ok);
      data = iter.next();
    }
  } catch (e) {
    yield new Result(null, Err.fromCatch(e));
  }
};
var asyncIterator = async function* (iter) {
  try {
    let data = await iter.next();
    while (!data.done) {
      yield new Result(data.value, new Ok);
      data = await iter.next();
    }
  } catch (e) {
    yield new Result(null, Err.fromCatch(e));
  }
};
export {
  grip,
  Ok,
  Err
};
