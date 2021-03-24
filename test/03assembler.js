"use strict";

const assert = require("assert");
const bc = require("./bc");
const ccc = require("..");
const desc = process.env.SKIP_SLOW_TESTS ? xdescribe : describe;
const src = require("./src");

describe("assembler", () => {
  const asm = () => (this.ccc = ccc("src", { assemble: true }));
  const err = () => this.ccc.messages.shift();

  describe("assembly errors", () => {
    before(src(".code\n<<=\nadd mul\n:label\n. space\n.\nspace\n}\n/*\n", asm));

    it("really wrong line", () => assert.equal(err(), "ccc:error:src:2:1:syntax error: unexpected token: '<<='"));
    it("two opcodes in same line", () => assert.equal(err(), "ccc:error:src:3:5:syntax error: unexpected token: 'mul'"));
    it("line starting with colon", () => assert.equal(err(), "ccc:error:src:4:1:syntax error: unexpected token: ':'"));
    it("unexpected space after dot", () => assert.equal(err(), "ccc:error:src:5:2:unexpeceted white space after '.'"));
    it("unexpected eol after dot", () => assert.equal(err(), "ccc:error:src:6:2:unexpeceted end of line after '.'"));
    it("unexpected block end", () => assert.equal(err(), "ccc:error:src:8:1:syntax error: unexpected token: '}'"));
    it("eof in multiline comment", () => assert.equal(err(), "ccc:error:src:10:1:unexpected end of file in multiline comment"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("exceeding data", () => {
    before(
      src(
        ".code\n" +
          "0x1234567890123456789012345678901234567890123456789012345678901234\n" +
          "0x12345678901234567890123456789012345678901234567890123456789012345\n" +
          "123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890\n" +
          '"                                      "\n',
        asm
      )
    );

    it("exceeding hex", () => assert.equal(err(), "ccc:error:src:3:1:hex number exceedes 32 bytes world length: 0x12345678901234567890123456789012345678901234567890123456789012345"));
    it("exceeding decimal", () =>
      assert.equal(err(), "ccc:error:src:4:1:decimal number exceedes 32 bytes world length: 123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890"));
    it("exceeding string", () => assert.equal(err(), 'ccc:error:src:5:1:string exceedes 32 bytes world length: "                                      "'));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("labels errors", () => {
    before(src("push23:\nlabel:\nlabel:\n", asm));

    it("unresolved label", () => assert.equal(err(), "ccc:error:src:1:1:a valid opcode can't be used as a label"));
    it("unresolved label", () => assert.equal(err(), "ccc:error:src:3:1:label already defined at line 2: 'label'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("unresolved label", () => {
    before(src(".code\ndefined\nundefined\ndefined:\n23\n", asm));

    it("unresolved label", () => assert.equal(err(), "ccc:error:src:3:1:unresolved label: 'undefined'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("block labels", () => {
    before(src("a:\nb_length:\na {\n{\nadd{\nb {\n", asm));

    it("redefined label", () => assert.equal(err(), "ccc:error:src:3:1:label already defined at line 1: 'a'"));
    it("wrong '{'", () => assert.equal(err(), "ccc:error:src:4:1:syntax error: unexpected token: '{'"));
    it("opcode can't be block", () => assert.equal(err(), "ccc:error:src:5:1:a valid opcode can't be used as a block name"));
    it("redefined label (length)", () => assert.equal(err(), "ccc:error:src:6:1:label already defined at line 2: 'b_length'"));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  describe("resolver", () => {
    before(() => {
      this.ccc = ccc("test/resolver.asm", { assemble: true, opcode: true });
    });

    it("opcode", () =>
      assert.deepStrictEqual(this.ccc.contracts.default.opcodes, [
        "PUSH2",
        "0x215",
        "PUSH2",
        "0x103",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x1234567890123456789012345678901234567890123456789012345678901234",
        "0x0",
        "0x20",
        "0x40",
        "JUMPDEST",
        "PUSH1",
        "0x0",
        "PUSH1",
        "0x26",
        "PUSH1",
        "0x46",
        "PUSH2",
        "0x106",
        "PUSH1",
        "0x0",
        "JUMPDEST",
        "PUSH1",
        "0x0",
        "PUSH4",
        "0x74657374",
        "0x106",
        "0x103",
        "0x209",
        "0x74657374"
      ]));
    it("messages count", () => assert.deepStrictEqual(this.ccc.messages, []));
  });

  desc("run solidity", function() {
    let ret;

    this.timeout(10000);

    before(
      bc((web3, accounts, done) => {
        // contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } }

        const abi = [
          { constant: true, inputs: [{ name: "a", type: "uint32" }], name: "g", outputs: [{ name: "ret", type: "uint32" }], payable: false, stateMutability: "pure", type: "function" },
          { inputs: [], payable: false, stateMutability: "nonpayable", type: "constructor" }
        ];
        const res = ccc("test/run_solidity.asm", { assemble: true });

        // eslint-disable-next-line no-console
        if(res.messages.length) return console.log("compile messages", res.messages, done());

        const tx = new web3.eth.Contract(abi).deploy({ arguments: [], data: res.contracts.default.bin }).send({ from: accounts[0], gas: 4700000, gasPrice: "30000000000" });

        tx.on("error", err => {
          // eslint-disable-next-line no-console
          console.log("Deploying contract", err);

          return done();
        });

        tx.on("receipt", receipt => {
          const contract = new web3.eth.Contract(abi, receipt.contractAddress);

          contract.methods.g(23).call({}, (err, res) => {
            if(err) {
              // eslint-disable-next-line no-console
              console.log("Calling 'g(23)'", err);

              return done();
            }

            ret = res;
            done();
          });
        });
      })
    );

    it("g(23) = 46", () => assert.equal(ret, "46"));
  });

  desc("run ccc", function() {
    let ret;

    this.timeout(10000);

    before(
      bc((web3, accounts, done) => {
        // contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } }

        const abi = [
          { constant: true, inputs: [{ name: "a", type: "uint32" }], name: "g", outputs: [{ name: "ret", type: "uint32" }], payable: false, stateMutability: "pure", type: "function" },
          { inputs: [], payable: false, stateMutability: "nonpayable", type: "constructor" }
        ];
        const res = ccc("test/run_ccc.asm", { assemble: true });

        // eslint-disable-next-line no-console
        if(res.messages.length) return console.log("compile messages", res.messages, done());

        const tx = new web3.eth.Contract(abi).deploy({ arguments: [], data: res.contracts.default.bin }).send({ from: accounts[0], gas: 4700000, gasPrice: "30000000000" });

        tx.on("error", err => {
          // eslint-disable-next-line no-console
          console.log("Deploying contract", err);

          return done();
        });

        tx.on("receipt", receipt => {
          const contract = new web3.eth.Contract(abi, receipt.contractAddress);

          contract.methods.g(23).call({}, (err, res) => {
            if(err) {
              // eslint-disable-next-line no-console
              console.log("Calling 'g(23)'", err);

              return done();
            }

            ret = res;
            done();
          });
        });
      })
    );

    it("g(23) = 46", () => assert.equal(ret, "46"));
  });
});
