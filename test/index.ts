export { expect } from "chai";

const _global = <any>(typeof window === "undefined" ? global : window);

export var describe: Function = _global.describe;
export var it: Function = _global.it;
export var before: Function = _global.before;
export var beforeEach: Function = _global.beforeEach;

process.env.NODE_ENV = "test";
