"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

describe("increments & decrements", () => {
  let messages, variables;
  const cmp = () => {
    ({ messages } = ccc("src", { keep: true }));
    // eslint-disable-next-line no-undef
    ({ variables } = scope.contracts.default.scope);
  };
  const err = () => messages.shift();
  const tests = [
    ["contract {", null, null, true],
    ["int8 aa = 8;", null, { lvalue: true, mmap: 0, name: "aa", type: Types.int8, val: "0x8" }],
    ["&aa++;", "ccc:error:src:3:1:right operand of operator '&' must be an lvalue"],
    ["int8 ab = ++aa++;", "ccc:error:src:4:11:right operand of operator '++' must be an lvalue"],
    ["int8 ab = aa----;", "ccc:error:src:5:15:left operand of operator '--' is not an lvalue"],
    /*
    ["uint8 aa = -8;", "ccc:warning:src:3:10:type sign mismatch in assignment"],
    ["aa += 8;", "ccc:error:src:4:4:operator not yet implemented: '+='"],
    ["aa = 256;", "ccc:warning:src:5:4:type size mismatch in assignment"],
    ["uint8 *ab = &aa;", null, { lvalue: true, mmap: 32, name: "ab", type: { deref: Types.uint8, short: "pu1", pointer: true, size: 32, type: "uint8*" }, val: "0x0" }],
    ["ab = 8;", "ccc:error:src:7:4:types mismatch in assignment"],
    ["ab = &ab;", "ccc:warning:src:8:4:pointer type mismatch in assignment"],
    */
    ["int8 zz export storage;", null, { export: true, lvalue: true, name: "zz", smap: 0, storage: true, type: Types.int8 }],
    ["};", null, null, true]
  ];

  before(src(tests.map(e => e[0]).join("\n"), cmp));
  tests.map(e => it(e[0], () => (e[3] ? eq(true, true) : e[1] ? eq(err(), e[1]) : deq(variables[e[2].name], e[2]))));
  it("messages count", () => deq(messages, []));
});
