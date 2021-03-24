"use strict";

const fs = require("fs");

class Source {
  constructor(filename) {
    this.filename = filename;
    this.lines = [];
  }

  read() {
    const { filename } = this;
    let source;

    try {
      source = fs.readFileSync(filename, "utf8");
    } catch(e) {
      return e;
    }

    let lines = source.split("\n");

    lines.unshift("");
    this.lines = lines.map((line, nr) => ({ filename, line, nr }));
    this.lines.shift();
  }
}

module.exports = Source;
