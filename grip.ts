interface Status {
  message?: string;
  cause?: any;
  Ok(): boolean;
  Fail(): boolean;
  Of(cls: any): boolean;
}

export class Err extends Error {
  Ok() {
    return false;
  }
  Fail() {
    return true;
  }
  Of(cls: any) {
    return this.cause instanceof cls || this instanceof cls;
  }
  static fromCatch(error: any) {
    const e = new Err(typeof error === "string" ? error : error.message);
    e.cause = error;
    e.stack = error.stack;
    return e;
  }
}

export class Ok {
  Ok() {
    return true;
  }
  Fail() {
    return false;
  }
  Of(cls: any) {
    return this instanceof cls;
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
  Fail() {
    return (this[1] as Status).Fail();
  }
  Of(impl: any) {
    return (this[1] as Status).Of(impl);
  }
}

type Unwrap<T> =
  T extends Promise<infer U>
    ? U
    : T extends (...args: any) => Promise<infer U>
      ? U
      : T extends (...args: any) => infer U
        ? U
        : T;

export type SafeResult<T> =
  T extends Promise<any>
    ? Promise<Result<Unwrap<T>>>
    : T extends () => Promise<any>
      ? Promise<Result<Unwrap<T>>>
      : Result<Unwrap<T>>;

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
    return new Result<T>(null as any, Err.fromCatch(err)) as SafeResult<T>;
  }
}

const promise = <T>(result: Promise<T>) => {
  return result
    .then((res) => new Result(res, new Ok()))
    .catch((err) => new Result(null, Err.fromCatch(err))) as Promise<Result<T>>;
};
