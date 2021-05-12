"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

const int8 = Types.int8;
const voidt = Types.void;

process.env.CCC_TEST = 1;

describe("variables", () => {
  const cmp = () => {
    this.ccc = ccc("src");
    this.scope = scope.contracts.default.scope;
  };
  const err = () => this.ccc.messages.shift();

  describe("syntax errors", () => {
    before(src("contract {\nexport storage uint8 z;\nvoid a;\ntest a;\nint8 *memory;\nint8 +;\nint8 b c;\nint8 d\n", cmp));

    it("void a;", () => eq(err(), "ccc:error:src:3:7:variables can't be of type void"));
    it("test a;", () => eq(err(), "ccc:error:src:4:1:undefined symbol: 'test'"));
    it("int8 *memory;", () => eq(err(), "ccc:error:src:5:7:unexpected reserved token when identifier expected: 'memory'"));
    it("int8 +;", () => eq(err(), "ccc:error:src:6:6:unexpected token when identifier expected: '+'"));
    it("int8 b c;", () => eq(err(), "ccc:error:src:7:8:unexpected token when ',' or ';' expected: 'c'"));
    it("int8 d (1)", () => eq(err(), "ccc:error:src:9:1:unexpected end of file when ';' expected"));
    it("int8 d (2)", () => eq(err(), "ccc:error:src:9:1:unexpected end of file when declaration or '}' expected"));
    it("int8 d (3)", () => eq(err(), "ccc:error:src:9:1:unexpected end of file when ';' expected"));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("delarations", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a, d export storage;\nint8 a;\nvoid *b, &c;\nexport int8 e;\n};", cmp));

    it("int8 a, d export storage; (1)", () => deq(this.scope.variables.a, { lvalue: true, type: int8, mmap: 0, name: "a" }));
    it("int8 a, d export storage; (2)", () => deq(this.scope.variables.d, { lvalue: true, type: int8, name: "d", export: true, smap: 1, storage: true }));
    it("int8 a;", () => eq(err(), "ccc:error:src:4:6:redefined identifier: 'a'"));
    it("void *b, &c; (1)", () => deq(this.scope.variables.b, { lvalue: true, type: { deref: voidt, pointer: true, short: "pv", size: 32, type: "void*" }, mmap: 32, name: "b" }));
    it("void *b, &c; (2)", () => deq(this.scope.variables.c, { lvalue: true, type: { deref: voidt, reference: true, short: "rv", size: 32, type: "void&" }, mmap: 64, name: "c" }));
    it("export int8 e;", () => eq(err(), "ccc:error:src:6:1:only storage variables can be exported"));
    it("messages count", () => deq(this.ccc.messages, []));
  });
});
