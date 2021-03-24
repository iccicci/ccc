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
    it("int8 a = 8 + {;", () => eq(err(), "ccc:error:src:4:14:unexpected end of expression"));
    it("messages count", () => deq(messages, []));
  });

  describe("global arrays", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a[8];\nint8 b[int8] storage;\n};\n", cmp));

    it("int8 a[8];", () => deq(variables.a, { type: int8, name: "a", dim: [{ constant: true, hex: "0x8" }] }));
    it("int8 b[int8] storage;", () => deq(variables.b, { type: int8, name: "b", storage: true, dim: [{ isType: true, type: "int8" }] }));
    it("messages count", () => deq(messages, []));
  });

  describe("initializations", () => {
    before(src("contract {\nexport storage uint8 z;\nint8 a = 8;\nint8 b = 8 + 8;\n};\n", cmp));

    it("int8 a = 8;", () => deq(variables.a, { type: int8, name: "a", val: "0x8" }));
    it("int8 b = 8 + 8;", () => deq(variables.b, { type: int8, name: "b", val: "0x10" }));
    it("messages count", () => deq(messages, []));
  });
});
