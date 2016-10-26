import * as path from "path";
import { expect } from "chai";
import { rootFactory } from "../helpers";

let fix = rootFactory(__dirname, "fixtures");

import { Config, config, init } from "./config";

describe("Config", () => {
	describe("class Config", () => {
		describe("new ()", () => {
			it("should use default options");
			it("should try to load default configurations");
			it("should try to load environment configurations");
		});

		describe("new (options: string)", () => {
			it("should use default options, overwriting path with `options`");
		});

		describe("new (options: ConfigOptions)", () => {
			it("should use provided options, merging with defaults");
		});

		describe("new (options: string|ConfigOptions), default_options: ConfigOptions)", () => {
			it("should use cascade options; DEFAULT_OPTIONS, default_options, options");
			it("should map `options` to `{ path: options }` if `options` is string");
		});

		describe(":load_default", () => {});
		describe(":load_env", () => {});
		describe(":env_mapping", () => {});

		describe(".load", () => {
			it("should merge JSON file with given name onto instance");
			it("should throw an error if given file is not found");
		});

		describe(".get", () => {
			let c = new Config(fix());

			it("should throw an error if value is undefined", () => {
				expect(() => c.get("not-known")).to.throw(Error, /no configuration for "not-known" found/);
			});

			it("should return value for given key", () => {
				expect(c.get("foo")).to.be.equal("Bar");
			});

			it("should return deep nested values with dot notation", () => {
				expect(c.get("test.deep")).to.be.equal("Baz");
			});

			it("should not throw error on `false` values", () => {
				expect(c.get("test.false")).to.be.equal(false);
			});
		});

		describe(".set", () => {});

		describe(".toJSON()", () => {
			it("should return all keys and values as a JSON object");
			it("should not return options");
			it("should not return `cwd`");
			it("should not return `env`");
		});
	});

	describe("init()", () => {
		it("should return Config instance for given path", () => {
			let c = init(__dirname);
			expect(c).to.be.instanceof(Config);
			expect(c.options.path).to.be.equal(__dirname);
		});

		it("should return default instance if no path is given", () => {
			let c = init();
			expect(c).to.be.instanceof(Config);
			expect(c.options.path).to.be.equal(path.resolve("config"));
		});
	});

	describe("config()", () => {
		before(() => {
			// Point config path to fixtures and load default.
			let c = init();
			c.options.path = fix();
			c.load("default");
		});

		it("should return value for key on default config", () => {
			expect(config("foo")).to.be.equal("Bar");
		});
	});
});
