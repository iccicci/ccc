"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");

const int8 = Types.int8;

process.env.CCC_TEST = 1;

describe("typedef", () => {
  const cmp = () => (this.ccc = ccc("src"));
  const err = () => this.ccc.messages.shift();

  describe("typedef errors 1", () => {
    before(src("typedef auto a;\ntypedef int8 b, ;\ntypedef int8 c export;\ntypedef int8 /;\n", cmp));

    it("typedef auto a;", () => assert.equal(err(), "ccc:error:src:1:9:type auto not allowed for typedef"));
    it("typedef int8 b, ;", () => assert.equal(err(), "ccc:error:src:2:17:unexpected token when identifier expected: ';'"));
    it("typedef int8 c export;", () => assert.equal(err(), "ccc:error:src:3:16:unexpected token when ',' or ';' expected: 'export'"));
    it("typedef int8 /;", () => assert.equal(err(), "ccc:error:src:4:14:unexpected token when identifier expected: '/'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("typedef errors 2", () => {
    before(src("typedef;\ntypedef ;\ntypedef +;\ntypedef typedef a;\ntypedef test a;\n", cmp));

    it("typedef;", () => assert.equal(err(), "ccc:error:src:1:8:unexpected token when type expected: ';'"));
    it("typedef ;", () => assert.equal(err(), "ccc:error:src:2:9:unexpected token when type expected: ';'"));
    it("typedef +;", () => assert.equal(err(), "ccc:error:src:3:9:unexpected token when type expected: '+'"));
    it("typedef typedef a;", () => assert.equal(err(), "ccc:error:src:4:9:unexpected reserved token when type expected: 'typedef'"));
    it("typedef test a;", () => assert.equal(err(), "ccc:error:src:5:9:unknown type name: 'test'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("typedef", () => {
    before(src("typedef test a;\ntypedef int8 *a, &d;\ntypedef int16 a;\ntypedef int8 b c;\n", cmp));

    it("typedef test a;", () => assert.equal(err(), "ccc:error:src:1:9:unknown type name: 'test'"));
    it("typedef int8 *a, &d; (1)", () => assert.deepStrictEqual(scope.types.a, { deref: int8, pointer: true, size: 32, type: "int8*", short: "pi1" }));
    it("typedef int8 *a, &d; (2)", () => assert.deepStrictEqual(scope.types.d, { deref: int8, reference: true, size: 32, type: "int8&", short: "ri1" }));
    it("typedef int16 a;", () => assert.equal(err(), "ccc:error:src:3:15:unexpected type when identifier expected: 'a'"));
    it("typedef int8 b c;", () => assert.equal(err(), "ccc:error:src:4:16:unexpected token when ',' or ';' expected: 'c'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });
});
