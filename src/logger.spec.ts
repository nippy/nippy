import { expect } from "chai";

import { Logger, DEFAULT_LOGGER, DEFAULT_LOGGER_CONFIG } from "./logger";

describe("Logger", () => {
	let main = new Logger();
	let str = new Logger("string");
	let SYMBOL = Symbol();
	let sym = new Logger(SYMBOL);

	describe("new (name, config)", () => {
		it("should default `name` to value defined by `DEFAULT_LOGGER`", () => {
			expect(main.name).to.be.equal(DEFAULT_LOGGER);
		});

		it("should throw an error trying to create a Logger with existing name", () => {
			let fn = () => new Logger();
			expect(fn).to.throw(/logger with name "(.*)" already exists/);
		});
	});

	describe(".config", () => {
		it("should be set to the full configuration used for the instance", () => {
			let c = Logger.get().config;
			let d = DEFAULT_LOGGER_CONFIG;

			expect(c.logPath).to.be.equal(d.logPath);
			expect(c.exitOnError).to.be.equal(d.exitOnError);
			expect(c.handleExceptions).to.be.equal(d.handleExceptions);

			for (let t of c.transports || []) {
				for (let p in d[t.name]) {
					expect(t[p]).to.be.equal(d[t.name][p]);
				}
			}
		});
	});

	describe("#get(name)", () => {
		it("should return existing logger with given `name`", () => {
			expect(Logger.get(DEFAULT_LOGGER)).to.be.equal(main);
		});

		it("should accept strings for `name`", () => {
			expect(Logger.get("string")).to.be.equal(str);
		});

		it("should accept symbols for `name`", () => {
			expect(Logger.get(SYMBOL)).to.be.equal(sym);
		});

		it("should default to returning logger with `name` of `Symbol('default')`", () => {
			expect(Logger.get()).to.be.equal(main);
		});

		it("should return new logger if none exists with given `name`", () => {
			let n = Logger.get("new");
			expect(n).to.be.instanceof(Logger);
			expect(n.name).to.be.equal("new");
		});
	});
});
