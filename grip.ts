interface Status {
  message?: string;
  cause?: any;
  Ok(): boolean;
  ok(): boolean;
  Fail(): boolean;
  fail(): boolean;
  Of(cls: any): boolean;
  of(cls: any): boolean;
}

/**
 * Error result
 */
export class Err extends Error {
  Ok() {
    return false;
  }
  ok() {
    return this.Ok();
  }
  Fail() {
    return true;
  }
  fail() {
    return this.Fail();
  }
  Of(cls: any) {
    return this.cause instanceof cls || this instanceof cls;
  }
  of(cls: any) {
    return this.Of(cls);
  }
  static fromCatch(error: any) {
    const e = new Err(typeof error === "string" ? error : error.message);
    e.cause = error;
    e.stack = error.stack;
    return e;
  }
}

/**
 * Successful result
 */
export class Ok {
  Ok() {
    return true;
  }
  ok() {
    return this.Ok();
  }
  Fail() {
    return false;
  }
  fail() {
    return this.Fail();
  }
  Of(cls: any) {
    return this instanceof cls;
  }
  of(cls: any) {
    return this.Of(cls);
  }
  toString() {
    return "Ok";
  }
}

interface IResult<T> {
  0: T;
  1: Status;
  value: T;
  status: Status;
  Of(cls: any): boolean;
  Ok(): boolean;
  Fail(): boolean;
}

class Result<T> extends Array<T | Status> implements IResult<T> {
  0: T;
  1: Status;
  constructor(result: T, status: Status) {
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
    return (this[1] as Status).Ok();
  }
  ok() {
    return this.Ok();
  }
  Fail() {
    return (this[1] as Status).Fail();
  }
  fail() {
    return this.Fail();
  }
  Of(cls: any) {
    return (this[1] as Status).Of(cls);
  }
  of(cls: any) {
    return this.Of(cls);
  }
  Iter() {
    const value = this.value;
    const that = this;
    if (
      typeof value !== "object" &&
      !(
        typeof (value as any)[Symbol.iterator] === "function" ||
        typeof (value as any)[Symbol.asyncIterator] === "function"
      )
    ) {
      return {
        async *[Symbol.asyncIterator]() {
          yield new Result(that.value, that.status) as SafeResult<T>;
        },
        *[Symbol.iterator]() {
          yield new Result(that.value, that.status) as SafeResult<T>;
        },
      };
    }
    return {
      async *[Symbol.asyncIterator]() {
        yield* asyncIterator<T>(value as AsyncGenerator);
      },
      *[Symbol.iterator]() {
        yield* iterator<T>(value as Generator);
      },
    };
  }
  iter() {
    return this.Iter();
  }
}

type Unwrap<T> =
  T extends AsyncGenerator<infer U>
    ? U
    : T extends Generator<infer U>
      ? U
      : T extends Promise<infer U>
        ? U
        : T extends (...args: any) => Promise<infer U>
          ? U
          : T extends (...args: any) => infer U
            ? U
            : T;

type SafeResult<T> =
  T extends Promise<any>
    ? Promise<Result<Unwrap<T>>>
    : T extends () => Promise<any>
      ? Promise<Result<Unwrap<T>>>
      : Result<Unwrap<T>>;

/**
 * Grip wraps functions, promises or generators and returns it as a result.
 * The result can be handled as an object { value, status }, or as a tuple [value, object].
 * The result and status interfaces have the methods `ok(), fail(), of(Error)` to check the status:
 *
 * ```javascript
 * const json = grip(response.body.joson())
 * if (json.of(SyntaxError)) {
 *  // handle parse error
 * }
 * // handle json.value
 * ```
 */
export function grip<T>(action: T): SafeResult<T> {
  if (action instanceof Promise) {
    return promise<T>(action) as SafeResult<T>;
  }
  try {
    const result = (action as any)();
    if (result instanceof Promise) {
      return promise<T>(result) as SafeResult<T>;
    }
    return new Result<T>(result, new Ok()) as SafeResult<T>;
  } catch (err: any) {
    return new Result<T>(
      null as never,
      Err.fromCatch(err),
    ) as SafeResult<never>;
  }
}

const promise = async <T>(result: Promise<T>) => {
  try {
    return new Result(await result, new Ok());
  } catch (err) {
    return new Result<never>(null as never, Err.fromCatch(err));
  }
};

const iterator = function* <T>(iter: Generator) {
  try {
    let data = iter.next();
    while (!data.done) {
      yield new Result<T>(data.value as T, new Ok()) as SafeResult<T>;
      data = iter.next();
    }
  } catch (e) {
    yield new Result<T>(null as never, Err.fromCatch(e)) as SafeResult<never>;
  }
};

const asyncIterator = async function* <T>(iter: AsyncGenerator) {
  try {
    let data = await iter.next();
    while (!data.done) {
      yield new Result<T>(data.value as T, new Ok()) as SafeResult<T>;
      data = await iter.next();
    }
  } catch (e) {
    yield new Result<T>(null as T, Err.fromCatch(e)) as SafeResult<never>;
  }
};
