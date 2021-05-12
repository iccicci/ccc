"use strict";

const BN = require("bn.js");
const toHex = require("web3-utils").toHex;

function bn(hex) {
  const minus = hex.substring(0, 1) === "-";
  const ret = new BN(hex.substring(minus ? 3 : 2), 16);

  return minus ? ret.neg() : ret;
}

module.exports = { bn, toHex };
