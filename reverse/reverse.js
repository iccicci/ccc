/* eslint-disable no-console */
"use strict";

const cp = require("child_process");
const solc = cp.spawn("solc", ["--combined-json", "abi,bin", "-"], { stdio: "pipe" });

solc.stdin.end(
  [
    "//SPDX-License-Identifier: UNLICENSED",
    "pragma solidity ^0.8.4;",
    "contract x {",
    " constructor() {}",
    "",
    " bytes8 str;",
    "",
    " function g(uint32 a) public pure returns(uint32 ret) {",
    "  ret = a + 23;",
    " }",
    "",
    " function f(bytes8 a, int8 b) public returns(bytes10 ret) {",
    "  if(b != 0)",
    "   str = a;",
    "",
    "  ret = a;",
    " }",
    "",
    " function r(int8 a) public returns(bytes8 ret) {",
    "  if(a != 0)",
    '   str = "";',
    "",
    "  ret = str;",
    " }",
    "}"
  ].join("\n")
);

const Web3 = require("web3");

var closed = 0;
var solcerr = "";
var solcout = "";

const close = () => {
  if(++closed !== 2) return;
  if(solcerr) return console.log(`COMPILE ERRORS\n\n${solcerr}\n\n`);

  const bc = cp.spawn("./node_modules/.bin/ganache-cli");
  const { contracts } = JSON.parse(solcout);
  const { abi, bin } = contracts["<stdin>:x"];

  console.log("Contract ABI:    ", JSON.stringify(abi));

  bc.stdout.on("data", data => {
    if(data.toString().indexOf("Listening") !== -1) {
      const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

      web3.eth.getAccounts((err, res) => {
        if(err) return console.log("Getting accounts", err);

        console.log("Opcodes:          https://ethervm.io/#opcodes");
        console.log("Debugger:         http://remix.ethereum.org");
        console.log("Client   address:", res[0]);

        const from = res[0];
        const tx = new web3.eth.Contract(abi).deploy({ arguments: [], data: bin }).send({ from, gas: 4700000, gasPrice: "30000000000" });

        tx.on("receipt", receipt => {
          console.log("Deploy   tx:     ", receipt.transactionHash);
          console.log("Contract address:", receipt.contractAddress);

          const contract = new web3.eth.Contract(abi, receipt.contractAddress);

          contract.methods.g(23).call({}, (err, res) => {
            if(err) return console.log("Calling g():", err);

            console.log("g()      result: ", res);
          });

          contract.methods
            .f(web3.utils.utf8ToHex(". ccc! ."), 1)
            .send({ from, gas: 4700000, gasPrice: "30000000000" })
            .on("transactionHash", tx => {
              console.log("f()      tx:     ", tx);

              contract.methods.f(web3.utils.utf8ToHex(". ccc! ."), 0).call({}, (err, res) => {
                if(err) return console.log("Calling f():", err);

                console.log("f()      result: ", res);
              });

              contract.methods
                .f(web3.utils.utf8ToHex("ccc .-= "), 1)
                .send({ from, gas: 4700000, gasPrice: "30000000000" })
                .on("transactionHash", tx => {
                  console.log("f()      tx:     ", tx);

                  contract.methods.r(0).call({}, (err, res) => {
                    if(err) return console.log("Calling r():", err);

                    console.log("r()      result: ", res);
                  });

                  contract.methods
                    .r(0)
                    .send({ from, gas: 4700000, gasPrice: "30000000000" })
                    .on("transactionHash", tx => console.log("r()      tx:     ", tx));
                });
            });
        });
      });
    }
  });
};

solc.stderr.on("data", data => (solcerr += data));
solc.stderr.on("end", close);
solc.stdout.on("data", data => (solcout += data));
solc.stdout.on("end", close);

/*
const assert = require("assert");
const bc = require("./bc");
const ccc = require("..");
const desc = process.env.SKIP_SLOW_TESTS ? xdescribe : describe;
const src = require("./src");

describe("assembler", () => {
	const asm = () => (this.ccc = ccc("src", { assemble: true }));
	const err = () => this.ccc.messages.shift();

	desc("run", function() {
		this.timeout(8000);

		before(
			bc((web3, accounts, done) => {
				tx.on("error", err => {
					console.log("Deploying contract", err);

					return done();
				});

				tx.on("receipt", receipt => {
					const contract = new web3.eth.Contract(abi, receipt.contractAddress);

					contract.methods.g(23).call({}, (err, res) => {
						if(err) {
							console.log("Calling 'g(23)'", err);

							return done();
						}

						this.res = res.ret;
						done();
					});
				});
			})
		);

		it("g(23) = 46", () => assert.equal(this.res, "46"));
	});
});
*/
