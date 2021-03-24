"use strict";

const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

describe("modifiers", () => {
  let messages;
  const cmp = () => ({ messages } = ccc("src", { keep: true }));
  const err = () => messages.shift();

  describe("modifiers errors", () => {
    before(src("register register;\nmemory int8 a export;\nregister test a;\nregister for a;\nexport\n", cmp));

    it("register register; (1)", () => eq(err(), "ccc:warning:src:1:10:repeated modifier: 'register'"));
    it("register register; (2)", () => eq(err(), "ccc:error:src:1:18:unexpected token when type expected: ';'"));
    it("memory int8 a export;", () => eq(err(), "ccc:error:src:2:15:modifier 'export' conflicts with modifier 'memory'"));
    it("register test a;", () => eq(err(), "ccc:error:src:3:10:unknown type name: 'test'"));
    it("register for a;", () => eq(err(), "ccc:error:src:4:10:unexpected reserved token when type expected: 'for'"));
    it("export", () => eq(err(), "ccc:error:src:6:1:unexpected end of file when ';' expected"));
    it("messages count", () => deq(messages, []));
  });
});
