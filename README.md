# Grip

Simplified result/error handling for JavaScript.
Grip always returns a consistent call result ready to be handled.
It makes the control flow similar to that of Golang, but doesn't force you to make additional null checks or create transitional variables to hold error results.

Instead of returning an nullish Error, Grip always returns a Status object:

```javascript
const [value, status] = grip(callable)
if (status.Fail()) {
  // handle any error
}
if (status.Of(MySpecificError)) {
  // handle specific error
}
```

The call result is better than tuple:

```javascript
const result = grip(callable)
if (result.Fail()) {
  // handle any error
}
if (result.Of(MySpecificError)) {
  // handle specific error
}

console.log(result.value) // result[0]
```

Grip also works with Promises, functions that return promises, generators and async generators.

## Install

```bash
bun add github:nesterow/grip # or pnpm
```

## Usage

The `grip` function accepts a function or a promise and returns a result with return value and status.
The result can be hadled as either an object or a tuple.

```javascript
import { grip } from '@nesterow/grip';
```

## Handle result as an object:

The result can be handled as an object: `{value, status, Ok(), Fail(), Of(type)}`

```javascript
const res = await grip(
  fetch('https://api.example.com')
);

if (res.Fail()) {
    // handle error
    return;
}

const json = await grip(
  res.value.json()
);

if (json.Of(SyntaxError)) {
    // handle parse error
    return;
}

```

## Handle result as a tuple:

The result can also be received as a tuple if you want to handle errors in Go'ish style:

```javascript
const [res, fetchStatus] = await grip(
  fetch('https://api.example.com')
);
if (fetchStatus.Fail()) {
    // handle  error
    return;
}

const [json, parseStatus] = await grip(
  res.json()
);
if (parseStatus.Of(SyntaxError)) {
    // handle parse error
    return;
}
```

## Handle functions:

Grip can also handle functions:

```javascript
const [result, status] = grip(() => "ok");
// result = "ok"

const [result1, status1] = grip(() => {
  if (1) throw new Error("error")
});
// result1 = null
// status.Of(Error) = true
```

## Handle generators

Generators can be handled using the `Iter()` method:

```javascript
const res = grip(async function* () {
  for (let i = 0; i < 3; i++) {
    if (i == 2) throw new Error("2");
    yield i;
  }
});
for await (let [value, status] of res.Iter()) {
  if (status.Of(Error)) {
    // handle error properly
    break;
  }
  // typeof value === "number"
  console.log(value)
}
```

## License
MIT
