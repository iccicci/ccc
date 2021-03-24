"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

const int8 = Types.int8;

describe("constant expressions", () => {
  let messages;
  let variables;
  const cmp = () => {
    ({ messages } = ccc("src", { keep: true }));
    ({ variables } = scope.contracts.default.scope);
  };
  const tests = [
    ["contract {", null, true],
    ["int8 aa = 8;", { name: "aa", type: int8, val: "0x8" }],
    ["int8 ab = 8 + 8;", { name: "ab", type: int8, val: "0x10" }],
    ["int8 ac = 8 - 2;", { name: "ac", type: int8, val: "0x6" }],
    ["int8 ad = - 2;", { name: "ad", type: int8, val: "-0x2" }],
    ["int8 ae = - - 2;", { name: "ae", type: int8, val: "0x2" }],
    ["int8 af = - - - 2;", { name: "af", type: int8, val: "-0x2" }],
    ["int8 ag = 8 - - - 2;", { name: "ag", type: int8, val: "0x6" }],
    ["int8 ah = 8 - 2 - 2;", { name: "ah", type: int8, val: "0x4" }],
    ["int8 ai = 8 - 2 + 2;", { name: "ai", type: int8, val: "0x8" }],
    ["int8 aj = 8 - 2 - - 2;", { name: "aj", type: int8, val: "0x8" }],
    ["int8 ak = 8 + + + 2;", { name: "ak", type: int8, val: "0xa" }],
    ["int8 al = 8 - (4 - 2);", { name: "al", type: int8, val: "0x6" }],
    ["int8 am = 8 - 3 * 2;", { name: "am", type: int8, val: "0x2" }],
    ["int8 an = 16 / 5;", { name: "an", type: int8, val: "0x3" }],
    ["int8 ao = 16 % 5;", { name: "ao", type: int8, val: "0x1" }],
    ["int8 ap = 1 + 2 - 3 * 4 / 5 % 6;", { name: "ap", type: int8, val: "0x1" }],
    ["int8 aq = 1 * 2 + 3 % 4;", { name: "aq", type: int8, val: "0x5" }],
    ["int8 zz = 0 export storage;", { export: true, name: "zz", storage: true, type: int8, val: "0x0" }],
    ["};", null, true]
  ];

  before(src(tests.map(e => e[0]).join("\n"), cmp));
  tests.map(e => it(e[0], e[2] ? () => eq(true, true) : () => deq(variables[e[1].name], e[1])));
  it("messages count", () => deq(messages, []));
});
