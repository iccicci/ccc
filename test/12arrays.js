"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

const int8 = Types.int8;

describe("arrays and initializations", () => {
  let messages, variables;
  const cmp = () => {
    ({ messages } = ccc("src", { keep: true }));
    // eslint-disable-next-line no-undef
    ({ variables } = scope.contracts.default.scope);
  };
  const err = () => messages.shift();

  describe("syntax errors", () => {
    before(
      src("contract {\nexport storage uint8 z;\nint8 a[;\nint8 a[int8*][8];\nint8 a[int8*][8] storage;\nint8 a[struct {int8 a;}] storage;\nint8 a[int8*-+] storage;\nint8 a[] storage;\nint8 a[\n", cmp)
    );

    it("int8 a[;", () => eq(err(), "ccc:error:src:3:8:unexpected end of expression"));
    it("int8 a[int8*][8];", () => eq(err(), "ccc:error:src:4:8:type dimentions allowed only for storage arrays"));
    it("int8 a[int8*][8] storage; (1)", () => eq(err(), "ccc:error:src:5:8:pointers are not valid type dimentions for storage arrays"));
    it("int8 a[int8*][8] storage; (2)", () => eq(err(), "ccc:error:src:5:15:only type dimentions allowed for storage arrays"));
    it("int8 a[struct {int8 a;}] storage;", () => eq(err(), "ccc:error:src:6:8:structs are not valid type dimentions for storage arrays"));
    it("int8 a[int8*-+] storage;", () => eq(err(), "ccc:error:src:7:13:unexpected token when ']' expected: '-'"));
    it("int8 a[] storage;", () => eq(err(), "ccc:error:src:8:8:unexpected token in expression: ']'"));
    it("int8 a[ (1)", () => eq(err(), "ccc:error:src:10:1:unexpected end of file when ';' expected"));
    it("int8 a[ (2)", () => eq(err(), "ccc:error:src:10:1:unexpected end of file when declaration or '}' expected"));
    it("int8 a[ (3)", () => eq(err(), "ccc:error:src:10:1:unexpected end of file when ';' expected"));
    it("messages count", () => deq(messages, []));
  });

  describe("unsupported features", () => {
    before(src('contract {\nexport storage uint8 z;\nuint8 a;\nint8 b[a];\nint8 b[8] = 8;\nint8 b["8"];\n};\n', cmp));

    it("int8 b[a];", () => eq(err(), "ccc:error:src:4:8:contract arrays can't have dynamic dimentions"));
    it("int8 b[8] = 8;", () => eq(err(), "ccc:error:src:5:11:arrays can't be initialized"));
    it('int8 b["8"];', () => eq(err(), "ccc:error:src:6:8:array dimention must be of type uintN"));
    it("messages count", () => deq(messages, []));
  });

  describe("initialization errors", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a =;\nint8 a = 8 + {;\n};\n", cmp));

    it("int8 a =;", () => eq(err(), "ccc:error:src:3:9:unexpected end of expression"));
    it("int8 a = 8 + {; (1)", () => eq(err(), "ccc:error:src:4:14:unexpected end of expression"));
    it("int8 a = 8 + {; (2)", () => eq(err(), "ccc:error:src:4:14:unexpected token when declaration or '}' expected: '{'"));
    it("int8 a = 8 + {; (3)", () => eq(err(), "ccc:error:src:5:1:unexpected token in expression: '}'"));
    it("messages count", () => deq(messages, []));
  });

  describe("global arrays", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a[8];\nint8 b[int8] storage;\nint8 c;\n};\n", cmp));

    it("int8 a[8];", () => deq(variables.a, { mmap: 0, name: "a", type: { deref: int8, pointer: true, short: "A4i1x8", size: 256, type: "int8[0x8]" } }));
    it("int8 b[int8] storage;", () => deq(variables.b, { smap: 1, name: "b", storage: true, type: { deref: int8, pointer: true, short: "A4i1i1", type: "int8[int8]" } }));
    it("int8 c;", () => deq(variables.c, { lvalue: true, type: int8, mmap: 256, name: "c" }));
    it("messages count", () => deq(messages, []));
  });

  describe("initializations", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a = 8;\nint8 b = 8 + 8;\n};\n", cmp));

    it("int8 a = 8;", () => deq(variables.a, { lvalue: true, mmap: 0, name: "a", type: int8, val: "0x8" }));
    it("int8 b = 8 + 8;", () => deq(variables.b, { lvalue: true, mmap: 32, name: "b", type: int8, val: "0x10" }));
    it("messages count", () => deq(messages, []));
  });
});
