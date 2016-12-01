import * as path from "path";
import { expect } from "chai";

import { rootFactory } from "./helpers";

describe("Helpers", () => {
	describe("rootFactory(...root)", () => {
		let root = rootFactory(".");

		it("should throw an error if no `root` arguments are passed", () => {
			expect(() => rootFactory()).to.throw(/can't create root helper without a root path/);
		});

		it("should return a function", () => {
			expect(root).to.be.a("function");
		});

		describe("=> root(...target)", () => {
			it("should return the root path join with no arguments passed", () => {
				expect(root()).to.be.equal(".");
			});

			it("should return all arguments passed as a joined path", () => {
				let foo = rootFactory("foo");
				expect(foo("bar")).to.be.equal(path.join("foo", "bar"));
				expect(foo("bar", "baz")).to.be.equal(path.join("foo", "bar", "baz"));

				let bar = rootFactory("foo", "bar");
				expect(bar("baz")).to.be.equal(path.join("foo", "bar", "baz"));
				expect(bar("baz", "bazz")).to.be.equal(path.join("foo", "bar", "baz", "bazz"));
			});
		});
	});
});
