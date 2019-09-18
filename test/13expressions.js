"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");

describe("expression errors", () => {
	const cmp = () => {
		this.ccc = ccc("src", { keep: true });
		this.scope = scope.contracts.default.scope;
	};
	const err = () => this.ccc.messages.shift();
	const tests = [
		["contract {", null, null, true],
		["int8 aa = 8 +;", "ccc:error:src:2:14:unexpected end of expression"],
		["int8 ab = 1 ) + 1;", "ccc:error:src:3:13:unexpected token when ',' or ';' expected: ')'"],
		["int8 ac = 1 + for;", "ccc:error:src:4:15:unexpected reserved token in expression: 'for'"],
		["int8 ad = b;", "ccc:error:src:5:11:undefined symbol: 'b'"],
		["int8 ae = +;", "ccc:error:src:6:12:unexpected end of expression"],
		["address a;", null, { name: "a", type: Types.address }],
		["int8 *p;", null, { name: "p", type: { deref: Types.int8, short: "pi1", pointer: true, size: 32, type: "int8*" } }],
		["int8 af = - + p;", "ccc:error:src:9:11:invalid right operand of type 'int8*' to unary operator '-'"],
		["int8 ag = + \"1\";", "ccc:error:src:10:11:invalid right operand of type 'bytes1' to unary operator '+'"],
		["int8 ah = a + 2;", "ccc:error:src:11:13:invalid left operand of type 'address' to binary operator '+'"],
		["int8 ai = 20 - p;", "ccc:error:src:12:14:invalid right operand of type 'int8*' to binary operator '-'"],
		["int8 aj = (20 - 10;", "ccc:error:src:13:19:unexpected token when ')' expected: ';'"],
		["int8 ak = (20 - 10];", "ccc:error:src:14:19:unexpected token when ')' expected: ']'"],
		["int8 al = p + (p + 2);", "ccc:error:src:15:13:invalid operands of type 'int8*' and 'int8*' to binary operator '+'"],
		["int8 am = p + a;", "ccc:error:src:16:13:invalid right operand of type 'address' to binary operator '+'"],
		["int8 zz export storage;", null, { export: true, name: "zz", storage: true, type: Types.int8 }],
		["};", null, null, true]
	];

	before(src(tests.map(e => e[0]).join("\n"), cmp));
	tests.map(e => it(e[0], () => (e[3] ? assert.equal(true, true) : e[1] ? assert.equal(err(), e[1]) : assert.deepStrictEqual(this.scope.variables[e[2].name], e[2]))));
	it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
});
