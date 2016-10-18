import { Logger, DEFAULT_LOGGER } from "../src/logger";

console.log(DEFAULT_LOGGER);

describe("Logger", () => {
	describe("new (name, config)", () => {
		it("should default `name` to value defined by `DEFAULT_LOGGER`", () => {
			// let l = new Logger();
			// expect(l.name).to.be.equal(DEFAULT_LOGGER);
		});

		it("should throw an error trying to create a Logger with existing name");
	});

	describe(".config", () => {
		it("should be set to the full configuration used for the instance");
		it("should be read-only");
	});

	describe("#get(name)", () => {
		it("should return existing logger with given `name`");
		it("should accept strings for `name`");
		it("should accept symbols for `name`");
		it("should default to returning logger with `name` of `Symbol('default')`");
		it("should return new logger if none exists with given `name`");
	});
});
