# Nippy/Config

Simple class and helpers for handling service configurations easily, supporting
environmental variables and configs.

```ts
import { Config } from "@nippy/config";
const config = new Config();

console.log(config.get("server.port"));
```

## Installation

`$ npm install --save @nippy/config`
