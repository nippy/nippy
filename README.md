# Nippy

Fast, opinionated, minimalist micro service framework for [node](1), backed by
[express](2) and select middleware.

```ts
import { Nippy } from "@nippy/core";
const app = new Nippy("My service");

app.get("/", (req, res) => {
  res.send("Hello world");
});

app.listen(3000);
```

## Installation

`$ npm install --save @nippy/core`

## Features

* Logging with [Winston](3) and [Morgan](4)
* Security hardening with [Helmet](5)
* Configurable default middleware
  * Body parser
  * Compression
  * CORS

[1]: https://nodejs.org
[2]: http://expressjs.com/
[3]: Winston
[4]: Morgan
[5]: Helmet
