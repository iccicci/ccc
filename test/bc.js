"use strict";

const cp = require("child_process");
const Web3 = require("web3");

module.exports = test => done => {
	const bc = cp.spawn("./node_modules/.bin/ganache-cli");

	bc.on("exit", done);
	bc.on("error", err => {
		console.log("Launching blockchain", err);
		done();
	});

	bc.stdout.on("data", data => {
		if(data.toString().indexOf("Listening") !== -1) {
			const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

			web3.eth.getAccounts((err, res) => {
				if(err) {
					console.log("Getting accounts", err);

					return bc.kill();
				}

				test(web3, res, bc.kill.bind(bc));
			});
		}
	});
};
