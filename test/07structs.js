"use strict";

const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const Types = require("../lib/types");

const address = Types.address;
const int32 = Types.int32;
const int8 = Types.int8;
const uint40 = Types.uint40;

process.env.CCC_TEST = 1;

describe("structs", () => {
	const cmp = () => {
		this.ccc = ccc("src");
		this.scope = scope;
	};
	const err = () => this.ccc.messages.shift();

	describe("struct errors 1", () => {
		before(src("contract {\nexport storage uint8 z;\nint8 a;\nstruct a { int8 a; };\nstruct {};\nstruct { int8 a; uint16 a; };\nstruct { int8 a; uint16 b[a + 2]; };\n};\n", cmp));
		before(() => (scope = this.scope.types["contract default"].scope));

		it("int8 a;", () => assert.deepStrictEqual(scope.variables.a, { type: int8, name: "a" }));
		it("struct a { uint16 a; };", () =>
			assert.deepStrictEqual(scope.types["struct a"], { attrs: [{ type: int8, name: "a", offset: 0 }], defined: true, short: "S1a", size: 32, struct: true, type: "struct a" }));
		it("struct {};", () => assert.equal(err(), "ccc:warning:src:5:9:empty struct declaration"));
		it("struct { int8 a; uint16 a; };", () => assert.equal(err(), "ccc:error:src:6:25:redefined attribute: 'a'"));
		it("struct { int8 a, uint16 b[a + 2]; };", () => assert.equal(err(), "ccc:error:src:7:27:attribute arrays can't have dynamic dimentions"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("struct errors 2", () => {
		before(src("struct +;\nstruct a +;\nstruct b { uint16 a; int32 b[4][3]; address c; };\nstruct\n", cmp));

		it("struct +;", () => assert.equal(err(), "ccc:error:src:1:8:unexpected token when identifier or '{' expected: '+'"));
		it("struct a +; (1)", () => assert.equal(err(), "ccc:error:src:2:10:unexpected token when identifier expected: '+'"));
		it("struct b { uint16 a; int32 b[4][3]; address c; };", () =>
			assert.deepStrictEqual(this.scope.types["struct b"], {
				attrs: [
					{ type: Types.uint16, name: "a", offset: 0 },
					{ dim: [{ constant: true, hex: "0x4" }, { constant: true, hex: "0x3" }], type: int32, name: "b", offset: 1 },
					{ type: address, name: "c", offset: 13 }
				],
				defined: true,
				short:   "S1b",
				size:    448,
				struct:  true,
				type:    "struct b"
			}));
		it("struct (1)", () => assert.equal(err(), "ccc:error:src:5:1:unexpected end of file when identifier or '{' expected"));
		it("struct (2)", () => assert.equal(err(), "ccc:error:src:5:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("struct errors 3", () => {
		before(src("struct export { int8 a; };\nstruct a { int8 a; };\nstruct a { int8 a; };\nstruct { int8 a = 8; uint16 b; };\nstruct c {\n", cmp));

		it("struct export { int8 a; };", () => assert.equal(err(), "ccc:error:src:1:8:unexpected reserved token when identifier or '{' expected: 'export'"));
		it("struct a { int8 a; }; struct a { int8 a; };", () => assert.equal(err(), "ccc:error:src:3:10:struct already defined: 'a'"));
		it("struct { int8 a = 8; uint16 b; };", () => assert.equal(err(), "ccc:error:src:4:17:unexpected token when ';' expected: '='"));
		it("struct c { (1)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when type or '}' expected"));
		it("struct c { (2)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("struct errors 4", () => {
		before(src("struct a { auto a; };\nstruct { int8 a };\nstruct c {;\nstruct d { int8 a; typedef b; };\nstruct { register int8 a; int8 b; };\nstruct { int8 a register; int8 b; };\n", cmp));

		it("struct a { auto a; }; (1)", () => assert.equal(err(), "ccc:error:src:1:12:type auto not allowed for attributes"));
		it("struct a { auto a; }; (2)", () => assert.equal(err(), "ccc:warning:src:1:20:empty struct declaration"));
		it("struct { int8 a };", () => assert.equal(err(), "ccc:error:src:2:17:unexpected token when ';' expected: '}'"));
		it("struct c {; (1)", () => assert.equal(err(), "ccc:warning:src:3:11:empty struct declaration"));
		it("struct c {; (2)", () => assert.equal(err(), "ccc:error:src:3:11:unexpected token when type or '}' expected: ';'"));
		it("struct d { int8 a; typedef b; };", () => assert.equal(err(), "ccc:error:src:4:20:unexpected reserved token when type expected: 'typedef'"));
		it("struct { register int8 a; int8 b; };", () => assert.equal(err(), "ccc:error:src:5:10:unexpected reserved token when type expected: 'register'"));
		it("struct { int8 a register; int8 b; };", () => assert.equal(err(), "ccc:error:src:6:17:unexpected token when ';' expected: 'register'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("packet errors 1", () => {
		before(src("contract {\nexport storage uint8 z;\nint8 a;\npacket a { int8 a; };\npacket {};\npacket { int160 a; int160 b; } b;\npacket { int8 a; uint16 a; };\n};\n", cmp));
		before(() => (scope = this.scope.types["contract default"].scope));

		it("int8 a;", () => assert.deepStrictEqual(scope.variables.a, { type: int8, name: "a" }));
		it("packet a { int8 a; };", () =>
			assert.deepStrictEqual(scope.types["packet a"], { attrs: [{ type: int8, name: "a", offset: 0 }], defined: true, packet: true, short: "P1a", size: 1, type: "packet a" }));
		it("packet {};", () => assert.equal(err(), "ccc:warning:src:5:9:empty packet declaration"));
		it("packet { int160 a; int160 b; } b;", () => assert.equal(err(), "ccc:error:src:6:30:packet size exceeds 32 bytes length"));
		it("packet { int8 a; uint16 a; };", () => assert.equal(err(), "ccc:error:src:7:25:redefined attribute: 'a'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("packet errors 2", () => {
		before(src("packet +;\npacket a +;\npacket b { uint16 a; int32 b[4]; };\npacket\n", cmp));

		it("packet +;", () => assert.equal(err(), "ccc:error:src:1:8:unexpected token when identifier or '{' expected: '+'"));
		it("packet a +; (1)", () => assert.equal(err(), "ccc:error:src:2:10:unexpected token when identifier expected: '+'"));
		it("packet b { uint16 a; int32 b[4]; };", () => assert.equal(err(), "ccc:error:src:3:29:unexpected token when ';' expected: '['"));
		it("packet (1)", () => assert.equal(err(), "ccc:error:src:5:1:unexpected end of file when identifier or '{' expected"));
		it("packet (2)", () => assert.equal(err(), "ccc:error:src:5:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("packet errors 3", () => {
		before(src("packet export { int8 a; };\npacket a { int8 a; };\npacket a { int8 a; };\npacket { int8 a = 8; uint16 b; };\npacket c {\n", cmp));

		it("packet export { int8 a; };", () => assert.equal(err(), "ccc:error:src:1:8:unexpected reserved token when identifier or '{' expected: 'export'"));
		it("packet a { int8 a; }; packet a { int8 a; };", () => assert.equal(err(), "ccc:error:src:3:10:packet already defined: 'a'"));
		it("packet { int8 a = 8; uint16 b; };", () => assert.equal(err(), "ccc:error:src:4:17:unexpected token when ';' expected: '='"));
		it("packet c { (1)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when type or '}' expected"));
		it("packet c { (2)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("packet errors 4", () => {
		before(src("packet a { auto a; };\npacket { int8 a };\npacket c {;\npacket d { int8 a; typedef b; };\npacket { register int8 a; int8 b; };\npacket { int8 a register; int8 b; };\n", cmp));

		it("packet a { auto a; }; (1)", () => assert.equal(err(), "ccc:error:src:1:12:type auto not allowed for attributes"));
		it("packet a { auto a; }; (2)", () => assert.equal(err(), "ccc:warning:src:1:20:empty packet declaration"));
		it("packet { int8 a };", () => assert.equal(err(), "ccc:error:src:2:17:unexpected token when ';' expected: '}'"));
		it("packet c {; (1)", () => assert.equal(err(), "ccc:warning:src:3:11:empty packet declaration"));
		it("packet c {; (2)", () => assert.equal(err(), "ccc:error:src:3:11:unexpected token when type or '}' expected: ';'"));
		it("packet d { int8 a; typedef b; };", () => assert.equal(err(), "ccc:error:src:4:20:unexpected reserved token when type expected: 'typedef'"));
		it("packet { register int8 a; int8 b; };", () => assert.equal(err(), "ccc:error:src:5:10:unexpected reserved token when type expected: 'register'"));
		it("packet { int8 a register; int8 b; };", () => assert.equal(err(), "ccc:error:src:6:17:unexpected token when ';' expected: 'register'"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("struct as attribute", () => {
		before(src("struct a { int8 a; struct { address a; address b; } b[3][2]; uint40 c; };\n", cmp));

		it("struct a { int8 a; struct { address a; address b; } b[3][2]; uint40 c; }; (1)", () =>
			assert.deepStrictEqual(this.scope.types["struct a"], {
				attrs: [
					{ name: "a", offset: 0, type: int8 },
					{
						name:   "b",
						offset: 1,
						type:   {
							attrs:   [{ name: "a", offset: 0, type: address }, { name: "b", offset: 1, type: address }],
							defined: true,
							short:   "S2aa",
							size:    64,
							struct:  true,
							type:    "struct { address; address; }"
						},
						dim: [{ constant: true, hex: "0x3" }, { constant: true, hex: "0x2" }]
					},
					{ name: "c", offset: 13, type: uint40 }
				],
				defined: true,
				short:   "S1a",
				size:    448,
				struct:  true,
				type:    "struct a"
			}));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("packet as attribute", () => {
		before(src("packet a { int8 a; packet { uint8 a; int32 b; } b; uint40 c; };\n", cmp));

		it("packet a { int8 a; packet { uint8 a; int32 b; } b; uint40 c; }; (1)", () =>
			assert.deepStrictEqual(this.scope.types["packet a"], {
				attrs: [
					{ name: "a", offset: 0, type: int8 },
					{
						name:   "b",
						offset: 1,
						type:   {
							attrs:   [{ name: "a", offset: 0, type: Types.uint8 }, { name: "b", offset: 1, type: int32 }],
							defined: true,
							packet:  true,
							short:   "P2u1i4",
							size:    5,
							type:    "packet { uint8; int32; }"
						}
					},
					{ name: "c", offset: 6, type: uint40 }
				],
				defined: true,
				packet:  true,
				short:   "P1a",
				size:    11,
				type:    "packet a"
			}));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("simply declared structs", () => {
		before(src("contract {\nexport storage uint8 z;\nstruct a;\nstruct a b;\nstruct b c;\nstruct a *d;\nstruct b { int8 a; }; struct b e;\n};\n", cmp));
		before(() => (scope = this.scope.types["contract default"].scope));

		const structb = { attrs: [{ name: "a", offset: 0, type: int8 }], defined: true, short: "S1b", size: 32, struct: true, type: "struct b" };

		it("struct a;", () => assert.deepStrictEqual(scope.types["struct a"], { short: "S1a", type: "struct a", undefined: true }));
		it("struct a b;", () => assert.equal(err(), "ccc:error:src:4:11:not defined type: 'struct a'"));
		it("struct b c;", () => assert.equal(err(), "ccc:error:src:5:11:not defined type: 'struct b'"));
		it("struct a *d;", () =>
			assert.deepStrictEqual(scope.variables.d, { name: "d", type: { deref: { short: "S1a", type: "struct a", undefined: true }, pointer: true, short: "pS1a", size: 32, type: "struct a*" } }));
		it("struct b { int8 a; };", () => assert.deepStrictEqual(scope.types["struct b"], structb));
		it("struct b e;", () => assert.deepStrictEqual(scope.variables.e, { name: "e", type: structb }));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});

	describe("contract declaration", () => {
		before(src("contract;\ncontract { contract a b; };\ncontract a {};\ncontract { contract a c storage export; };\ncontract d {\n", cmp));
		before(() => {
			scope = this.scope.types["contract default"].scope;

			delete this.scope.types["contract a"].scope;
			delete this.scope.types["contract default"].scope;
		});

		const contracta = { contract: true, defined: true, short: "C1a", type: "contract a" };
		it("contract;", () => assert.equal(err(), "ccc:error:src:1:9:unexpected token when identifier or '{' expected: ';'"));
		it("contract { contract a b; }; (1)", () => assert.equal(err(), "ccc:error:src:2:24:not defined type: 'contract a'"));
		it("contract { contract a b; }; (2)", () => assert.equal(err(), "ccc:warning:src:2:26:empty contract declaration"));
		it("contract { contract a b; }; (3)", () => assert.deepStrictEqual(this.scope.types["contract default"], { contract: true, defined: true, short: "C7default", type: "contract default" }));
		it("contract a {}; (1)", () => assert.equal(err(), "ccc:warning:src:3:13:empty contract declaration"));
		it("contract a {}; (2)", () => assert.deepStrictEqual(this.scope.types["contract a"], contracta));
		it("contract { contract a c storage export; }; (1)", () => assert.deepStrictEqual(scope.variables.c, { export: true, name: "c", storage: true, type: contracta }));
		it("contract { contract a c storage export; }; (2)", () => assert.equal(err(), "ccc:error:src:4:10:redefined type: 'contract default'"));
		it("contract d { (1)", () => assert.equal(err(), "ccc:warning:src:6:1:empty contract declaration"));
		it("contract d { (2)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when declaration or '}' expected"));
		it("contract d { (3)", () => assert.equal(err(), "ccc:error:src:6:1:unexpected end of file when ';' expected"));
		it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
	});
});
