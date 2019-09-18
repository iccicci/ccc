"use strict";

const Assembler = require("../lib/assembler");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");

describe("consumer", () => {
	const asm = () => (this.ccc = ccc("src", { assemble: true }));
	const err = () => this.ccc.messages.shift();

	describe("parsing errors", () => {
		before(src("lab€l\n\n   \"endless string\\n\\", asm));

		it("unexpected symbol character", () => assert.equal(err(), "ccc:error:src:1:4:unexpected character at: '€l'"));
		it("eol in string", () => assert.equal(err(), "ccc:error:src:3:22:unexpected end of line in string"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("empty file", () => {
		before(src("", asm));

		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("development error", () => {
		let pull;

		before(
			src(".code\ndefined\nundefined\ndefined:\n23\n", () => {
				pull = Assembler.prototype.pull;
				Assembler.prototype.pull = 0;

				return asm();
			})
		);

		after(() => (Assembler.prototype.pull = pull));

		it("development error", () => assert.ok(err().match(/ccc:error:DevelopmentError: TypeError: this.pull is not a function/)));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("MSDOS eol", () => {
		before(src(".code\n\r10\n\r", asm));

		it("bin", () => assert.equal(this.ccc.contracts.default.bin, "600A"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});
});
