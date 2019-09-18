"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");

const address = Types.address;
const int8 = Types.int8;
const int16 = Types.int16;
const int32 = Types.int32;
const uint8 = Types.uint8;

const puint8 = { deref: uint8, pointer: true, short: "pu1", size: 32, type: "uint8*" };
const ppuint8 = { deref: puint8, pointer: true, size: 32, short: "ppu1", type: "uint8**" };

describe("types", () => {
	const cmp = () => {
		this.ccc = ccc("src");
		this.scope = scope.contracts.default.scope;
	};
	const err = () => this.ccc.messages.shift();

	describe("variables with modifiers", () => {
		before(src("contract {\nexport storage uint8 z;\nexport storage bytes20 a;\nstorage uint24 b export;\nuint16 * & c;\nuint8 *d, **e memory;\nstorage int32 f export, g;\n};\n", cmp));

		it("export storage bytes20 a;", () => assert.deepStrictEqual(this.scope.variables.a, { type: Types.bytes20, name: "a", export: true, storage: true }));
		it("storage uint24 b export;", () => assert.deepStrictEqual(this.scope.variables.b, { type: Types.uint24, name: "b", export: true, storage: true }));
		it("uint16 * & c;", () =>
			assert.deepStrictEqual(this.scope.variables.c, {
				type: { deref: { deref: Types.uint16, pointer: true, short: "pu2", size: 32, type: "uint16*" }, reference: true, short: "rpu2", size: 32, type: "uint16*&" },
				name: "c"
			}));
		it("uint8 *d, **e memory; (1)", () => assert.deepStrictEqual(this.scope.variables.d, { type: puint8, name: "d" }));
		it("uint8 *d, **e memory; (2)", () =>
			assert.deepStrictEqual(this.scope.variables.e, { type: { deref: puint8, pointer: true, short: "ppu1", size: 32, type: "uint8**" }, name: "e", memory: true }));
		it("storage int32 f export, g; (1)", () => assert.deepStrictEqual(this.scope.variables.f, { type: int32, name: "f", storage: true, export: true }));
		it("storage int32 f export, g; (2)", () => assert.deepStrictEqual(this.scope.variables.g, { type: int32, name: "g", storage: true }));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("variables, typedef, packets and functions with modifiers", () => {
		before(
			src(
				[
					"contract {",
					"typedef uint8 *a;",
					"typedef a *b;",
					"b *c;",
					"packet d { uint8 a; } &e memory;",
					"packet d f storage export;",
					"storage packet d g;",
					"memory packet { uint8 a; address b; int16 c; } h;",
					"typedef packet { address a; int8 b; } &i;",
					"i *j;",
					"typedef packet d j;",
					"j * k(i e register, packet d &f, register b c);",
					"j * k(i e register, packet d &f, register b c) {}",
					"};",
					"//",
					""
				].join("\n"),
				cmp
			)
		);

		const packetd = { attrs: [{ name: "a", offset: 0, type: uint8 }], defined: true, packet: true, short: "P1d", size: 1, type: "packet d" };
		const rpacketd = { deref: packetd, reference: true, short: "rP1d", size: 32, type: "packet d&" };
		const packetP2ai1 = {
			attrs:   [{ name: "a", offset: 0, type: address }, { name: "b", offset: 20, type: int8 }],
			defined: true,
			packet:  true,
			short:   "P2ai1",
			size:    21,
			type:    "packet { address; int8; }"
		};
		const rpacketP2ai1 = { deref: packetP2ai1, reference: true, short: "rP2ai1", size: 32, type: "packet { address; int8; }&" };
		const P3u1ai2 = {
			attrs:   [{ name: "a", offset: 0, type: uint8 }, { name: "b", offset: 1, type: address }, { name: "c", offset: 21, type: int16 }],
			defined: true,
			packet:  true,
			short:   "P3u1ai2",
			size:    23,
			type:    "packet { uint8; address; int16; }"
		};

		it("typedef uint8 *a;", () => assert.deepStrictEqual(this.scope.types.a, puint8));
		it("typedef a *b;", () => assert.deepStrictEqual(this.scope.types.b, ppuint8));
		it("b *c;", () => assert.deepStrictEqual(this.scope.variables.c, { type: { deref: ppuint8, pointer: true, short: "pppu1", size: 32, type: "uint8***" }, name: "c" }));
		it("packet d { uint8 a; } &e memory; (1)", () => assert.deepStrictEqual(this.scope.types["packet d"], packetd));
		it("packet d { uint8 a; } &e memory; (2)", () => assert.deepStrictEqual(this.scope.variables.e, { type: rpacketd, name: "e", memory: true }));
		it("packet d f storage;", () => assert.deepStrictEqual(this.scope.variables.f, { type: packetd, name: "f", storage: true, export: true }));
		it("storage packet d g;", () => assert.deepStrictEqual(this.scope.variables.g, { type: packetd, name: "g", storage: true }));
		it("memory packet { uint8 a; address b; int16 c; } h; (1)", () => assert.deepStrictEqual(this.scope.types["packet { uint8; address; int16; }"], P3u1ai2));
		it("memory packet { uint8 a; address b; int16 c; } h; (2)", () => assert.deepStrictEqual(this.scope.variables.h, { type: P3u1ai2, name: "h", memory: true }));
		it("typedef packet { address a; int8 b; } &i; (1)", () => assert.deepStrictEqual(this.scope.types.i, rpacketP2ai1));
		it("typedef packet { address a; int8 b; } &i; (2)", () => assert.deepStrictEqual(this.scope.types["packet { address; int8; }"], packetP2ai1));
		it("i *j;", () => assert.equal(err(), "ccc:error:src:10:3:invalid type: 'packet { address; int8; }&*'"));
		it("j * k(i e register, packet d &f, register b c);", () => {
			this.s = this.scope.functions.F1k_rP2ai1rP1d_ppu1.scope;
			delete this.scope.functions.F1k_rP2ai1rP1d_ppu1.scope;
			assert.deepStrictEqual(this.scope.functions.F1k_rP2ai1rP1d_ppu1, {
				defined:   true,
				type:      { deref: packetd, pointer: true, short: "pP1d", size: 32, type: "packet d*" },
				name:      "k",
				signature: "F1k_rP2ai1rP1d_ppu1",
				first:     { column: 1, filename: "src", nr: 13, symbol: true, token: "j" },
				extended:  "packet d* k(register packet { address; int8; }& e, packet d& f, register uint8** c)"
			});
		});

		it("j * k(i e register, packet d &f, register b c) {} (1)", () => assert.deepStrictEqual(this.s.variables.e, { type: rpacketP2ai1, name: "e", register: true }));
		it("j * k(i e register, packet d &f, register b c) {} (2)", () => assert.deepStrictEqual(this.s.variables.f, { type: rpacketd, name: "f" }));
		it("j * k(i e register, packet d &f, register b c) {} (3)", () => assert.deepStrictEqual(this.s.variables.c, { type: ppuint8, name: "c", register: true }));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("typelist", () => {
		before(
			src(
				"contract {\nexport storage uint8 z;\n(int8 a;\n(int8, uint16) a;\n(int8, uint16) a();\npacket b { (a; };\ntypedef (uint8, int8*) c;\n(uint8**, int8*) d;\nc e();\n(int8*+,int8) f;\n};\n",
				cmp
			)
		);

		const L2u1pi1 = { list: true, short: "L2u1pi1", size: 64, type: "(uint8, int8*)" };
		it("(int8 a;", () => assert.equal(err(), "ccc:error:src:3:7:unexpected token when ',' or ')' expected: 'a'"));
		it("(int8, uint16) a;", () => assert.equal(err(), "ccc:error:src:4:17:typelist allowed only for functions"));
		it("(int8, uint16) a();", () => {
			delete this.scope.functions.F1a.scope;
			assert.deepStrictEqual(this.scope.functions.F1a, {
				extended:  "(int8, uint16) a()",
				name:      "a",
				signature: "F1a",
				type:      { list: true, short: "L2i1u2", size: 64, type: "(int8, uint16)" },
				first:     { column: 1, filename: "src", nr: 5, operator: true, token: "(" }
			});
		});
		it("packet b { (a; }; (1)", () => assert.equal(err(), "ccc:error:src:6:12:unexpected token when type expected: '('"));
		it("packet b { (a; }; (2)", () => assert.equal(err(), "ccc:warning:src:6:16:empty packet declaration"));
		it("typedef (uint8, int8*) c;", () => assert.deepStrictEqual(this.scope.types.c, L2u1pi1));
		it("(uint8**, int8*) d;", () => assert.equal(err(), "ccc:error:src:8:19:typelist allowed only for functions"));
		it("c e();", () => {
			delete this.scope.functions.F1e.scope;
			assert.deepStrictEqual(this.scope.functions.F1e, {
				extended:  "(uint8, int8*) e()",
				name:      "e",
				signature: "F1e",
				type:      L2u1pi1,
				first:     { column: 1, filename: "src", nr: 9, symbol: true, token: "c" }
			});
		});
		it("(int8*+,int8) f;", () => assert.equal(err(), "ccc:error:src:10:7:unexpected token when ',' or ')' expected: '+'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});
});
