# Grip

Simplified result/error handling for JavaScript.
Grip always returns a consistent call result ready to be handled.
It makes the control flow similar to that of Golang, but doesn't force you to make additional null checks or create transitional variables to hold error results.

## Install

```bash
bun add github:nesterow/grip
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
const fetchResult = await grip(
  fetch('https://api.example.com')
);

if (fetchResult.Fail()) {
    handleErrorProperly();
    return;
}

const jsonResult = await grip(
  res.value.json()
);

if (jsonResult.Of(SyntaxError)) {
    handleJsonParseError();
    return;
}

```

## Handle result as a tuple:

The result can also be received as a tuple if you want to handle errors in Go'ish style:

```javascript
const [response, fetchStatus] = await grip(
  fetch('https://api.example.com')
);
if (fetchStatus.Fail()) {
    handleErrorProperly();
    return;
}

const [json, parseStatus] = await grip(
  response.json()
);
if (parseStatus.Of(SyntaxError)) {
    handleJsonParseError();
    return;
}
```

## License
MIT
