"use strict";

const assert = require("assert");
const ccc = require("..");
const src = require("./src");

describe("modifiers", () => {
	const cmp = () => (this.ccc = ccc("src"));
	const err = () => this.ccc.messages.shift();

	describe("modifiers errors", () => {
		before(src("register register;\nmemory int8 a export;\nregister test a;\nregister for a;\nexport\n", cmp));

		it("register register; (1)", () => assert.equal(err(), "ccc:warning:src:1:10:repeated modifier: 'register'"));
		it("register register; (2)", () => assert.equal(err(), "ccc:error:src:1:18:unexpected token when type expected: ';'"));
		it("memory int8 a export;", () => assert.equal(err(), "ccc:error:src:2:15:modifier 'export' conflicts with modifier 'memory'"));
		it("register test a;", () => assert.equal(err(), "ccc:error:src:3:10:unknown type name: 'test'"));
		it("register for a;", () => assert.equal(err(), "ccc:error:src:4:10:unexpected reserved token when type expected: 'for'"));
		it("export", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});
});
