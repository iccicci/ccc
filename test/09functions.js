"use strict";

const Types = require("../lib/types");
const assert = require("assert");
const ccc = require("..");
const src = require("./src");
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

const int8 = Types.int8;
const uint8 = Types.uint8;
const voidt = Types.void;

process.env.CCC_TEST = 1;

describe("functions", () => {
  const cmp = () => {
    this.ccc = ccc("src");
    if(scope.contracts.default) this.scope = scope.contracts.default.scope;
  };
  const err = () => this.ccc.messages.shift();

  describe("syntax errors", () => {
    before(src("contract {\nint8 a(int8 a),;\nint8 a(int8 a;\nvoid a(,int8 a);\nvoid a(auto a);\nvoid a(int8;\nvoid b(packet {);\n", cmp));

    it("int8 a(int8 a),;", () => eq(err(), "ccc:error:src:2:16:unexpected token when identifier expected: ';'"));
    it("int8 a(int8 a;", () => eq(err(), "ccc:error:src:3:14:unexpected token when ',' or ')' expected: ';'"));
    it("void a(,int8 a);", () => eq(err(), "ccc:error:src:4:8:unexpected token when type expected: ','"));
    it("void a(auto a);", () => eq(err(), "ccc:error:src:5:8:type auto not allowed for parameters"));
    it("void a(int8;", () => eq(err(), "ccc:error:src:6:12:unexpected token when identifier expected: ';'"));
    it("void b(packet {); (1)", () => eq(err(), "ccc:error:src:7:16:unexpected token when type expected: ')'"));
    it("void b(packet {); (2)", () => eq(err(), "ccc:error:src:8:1:unexpected end of file when type or '}' expected"));
    it("void b(packet {); (3)", () => eq(err(), "ccc:error:src:8:1:unexpected end of file when ';' expected"));
    it("not closed contract (1)", () => eq(err(), "ccc:warning:src:8:1:empty contract declaration"));
    it("not closed contract (2)", () => eq(err(), "ccc:error:src:8:1:unexpected end of file when declaration or '}' expected"));
    it("not closed contract (3)", () => eq(err(), "ccc:error:src:8:1:unexpected end of file when ';' expected"));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("repeated declarations & definitions", () => {
    before(src("contract {\nexport storage uint8 z;\nvoid a();\nvoid a() pure;\nuint8 b();\nint16 b() {}\nuint8 c();\nuint8 c() stackless {}\nvoid d() {}\nvoid d() {}\n};\n", cmp));

    it("void a(); void a() pure;", () => eq(err(), "ccc:error:src:4:1:new declaration of 'void a() export pure' previously declared at line 3"));
    it("uint8 b(); int16 b() {}", () => eq(err(), "ccc:error:src:6:1:new declaration of 'int16 b()' previously declared as 'uint8 b()' at line 5"));
    it("uint8 c(); uint8 c() stackless {}", () => eq(err(), "ccc:error:src:8:1:new declaration of 'uint8 c() stackless' previously declared as 'uint8 c()' at line 7"));
    it("void d() {} void d() {}", () => eq(err(), "ccc:error:src:10:1:new definition of 'void d()' previously defined at line 9"));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("signature", () => {
    before(src("contract {\nexport storage uint8 z;\ntypedef packet { uint16 a; address b; } pck;\nuint8 a(register pck &a);\n};\n", cmp));

    const packetP2u2a = {
      attrs: [
        { name: "a", offset: 0, type: Types.uint16 },
        { name: "b", offset: 2, type: Types.address }
      ],
      defined: true,
      packet:  true,
      short:   "P2u2a",
      size:    22,
      type:    "packet { uint16; address; }"
    };

    it("typedef packet { uint16 a; address b; } pck;", () => deq(this.scope.types.pck, packetP2u2a));
    it("uint8 a(register pck &a); (1)", () => {
      const func = this.scope.functions.F1a_rP2u2a;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        type:      uint8,
        name:      "a",
        signature: "F1a_rP2u2a",
        extended:  "uint8 a(register packet { uint16; address; }& a)",
        first:     { column: 1, filename: "src", nr: 4, symbol: true, token: "uint8" }
      });
    });
    it("uint8 a(register pck &a); (2)", () =>
      deq(scope.variables.a, { lvalue: true, type: { deref: packetP2u2a, reference: true, short: "rP2u2a", size: 32, type: "packet { uint16; address; }&" }, name: "a", register: true }));

    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("uint8 a();", () => {
    before(src("contract {\nexport storage uint8 z;\nuint8 a();\n};\n", cmp));

    it("uint8 a();", () => {
      const func = this.scope.functions.F1a;
      delete func.scope;
      deq(func, {
        type:      uint8,
        name:      "a",
        signature: "F1a",
        extended:  "uint8 a()",
        first:     { column: 1, filename: "src", nr: 3, symbol: true, token: "uint8" }
      });
    });

    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("void a(uint8 a, register int16 &b) pure export;", () => {
    before(src("contract {\nexport storage uint8 z;\nvoid a(uint8 a, register int16 &b) pure export;\n};\n", cmp));

    it("void a(uint8 a, register int16 &b) pure export; (1)", () => {
      const func = this.scope.functions.F1au1_ri2;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        type:      voidt,
        name:      "a",
        pure:      true,
        export:    true,
        signature: "F1au1_ri2",
        extended:  "void a(uint8 a, register int16& b) export pure",
        first:     { column: 1, filename: "src", nr: 3, symbol: true, token: "void" }
      });
    });

    it("void a(uint8 a, register int16 &b) pure export; (2)", () => deq(scope.variables.a, { lvalue: true, type: uint8, name: "a" }));
    it("void a(uint8 a, register int16 &b) pure export; (3)", () =>
      deq(scope.variables.b, { lvalue: true, type: { deref: Types.int16, reference: true, short: "ri2", size: 32, type: "int16&" }, name: "b", register: true }));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("uint8 a(uint32 a register);", () => {
    before(src("contract {\nexport storage uint8 z;\nuint8 a(uint32 a register);\n};\n", cmp));

    it("uint8 a(uint32 a register); (1)", () => {
      const func = this.scope.functions.F1a_u4;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        type:      uint8,
        name:      "a",
        signature: "F1a_u4",
        extended:  "uint8 a(register uint32 a)",
        first:     { column: 1, filename: "src", nr: 3, symbol: true, token: "uint8" }
      });
    });

    it("uint8 a(uint32 a register); (2)", () => deq(scope.variables.a, { lvalue: true, type: Types.uint32, name: "a", register: true }));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("view void a(register int16 &b) export;", () => {
    before(src("contract {\nexport storage uint8 z;\nview void a(register int16 &b) export;\n};\n", cmp));

    it("view void a(register int16 &b) export; (1)", () => {
      const func = this.scope.functions.F1a_ri2;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        type:      voidt,
        name:      "a",
        signature: "F1a_ri2",
        view:      true,
        export:    true,
        extended:  "void a(register int16& b) export view",
        first:     { column: 1, filename: "src", nr: 3, symbol: true, token: "view" }
      });
    });

    it("view void a(register int16 &b) export; (2)", () =>
      deq(scope.variables.b, { lvalue: true, type: { deref: Types.int16, reference: true, short: "ri2", size: 32, type: "int16&" }, name: "b", register: true }));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("view void a(int8 a); void a(int8 a) {}", () => {
    before(src("contract {\nexport storage uint8 z;\nview void a(int8 a);\nvoid a(int8 a) {}\n};\n", cmp));

    it("view void a(int8 a);", () => {
      const func = this.scope.functions.F1ai1;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        defined:   true,
        type:      voidt,
        name:      "a",
        signature: "F1ai1",
        export:    true,
        view:      true,
        extended:  "void a(int8 a) export view",
        first:     { column: 1, filename: "src", nr: 4, symbol: true, token: "void" }
      });
    });

    it("void a(int8 a) {}", () => deq(scope.variables.a, { lvalue: true, type: int8, name: "a" }));
    it("messages count", () => deq(this.ccc.messages, []));
  });

  describe("stackless void a(int8 a); void a(int8 a) stackless {}", () => {
    before(src("contract {\nexport storage uint8 z;\nstackless void a(int8 a);\nvoid a(int8 a) stackless {}\n};\n", cmp));

    it("stackless void a(int8 a);", () => {
      const func = this.scope.functions.F1ai1;

      scope = func.scope;
      delete func.scope;
      deq(func, {
        defined:   true,
        type:      voidt,
        name:      "a",
        signature: "F1ai1",
        stackless: true,
        extended:  "void a(int8 a) stackless",
        first:     { column: 1, filename: "src", nr: 4, symbol: true, token: "void" }
      });
    });

    it("void a(int8 a) stackless {}", () => deq(scope.variables.a, { lvalue: true, type: int8, name: "a" }));
    it("messages count", () => deq(this.ccc.messages, []));
  });
});
