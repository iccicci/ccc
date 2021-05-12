"use strict";

const Types = require("./types");
const { bn, toHex } = require("./bn");

const shorts = { $: "c", "&": "r", "*": "p", "@": "l", contract: "C", packet: "P", struct: "S", union: "U" };

class Scope {
  constructor(next, contract) {
    this.contract = contract;
    this.contracts = {};
    this.functions = {};
    this.global = next ? false : true;
    this.mmap = 0;
    this.params = [];
    this.smap = [];
    this.statements = [];
    this.types = {};
    this.variables = {};

    if(next) this.next = next;
  }

  addContract(contract) {
    const res = this.addStruct("contract", contract);
    const { name } = contract;

    delete res.attrs;
    delete res.size;

    this.contracts[name] = res;
  }

  addFunction(name, func) {
    const { extended, first, scope, signature, type } = func;
    const f = { extended, first, name, scope, signature, type };

    ["export", "defined", "pure", "stackless", "view"].map(m => {
      if(func[m]) f[m] = func[m];
    });

    this.functions[signature] = f;
  }

  addStatement(statement) {
    this.statements.push(statement);
  }

  addStruct(what, struct, declaration) {
    let { name, scope } = struct;
    let attrs = [];
    let stype = "";
    let offset = 0;
    let short = "";

    if(declaration) {
      stype = what + " " + name;

      return (this.types[stype] = { short: shorts[what] + name.length + name, type: stype, undefined: true });
    }

    scope.params.map(att => {
      const { dim, name, type } = att;
      const attr = { name, offset, type };
      const size = what === "packet" ? type.size : Math.ceil(type.size / 32);
      let elements = 1;

      if(dim) {
        attr.dim = dim;
        dim.map(d => (elements *= parseInt(d.hex, 16)));
      }

      attrs.push(attr);

      offset += size * elements;
      stype += type.type + "; ";
      short += type.short;
    });

    short = shorts[what] + (name ? name.length + name : attrs.length + short);
    stype = what + " " + (name ? name : `{ ${stype}}`);

    const size = offset * (what === "packet" ? 1 : 32);
    const res = { attrs, defined: true, short, size, type: stype };

    res[what] = true;

    return (this.types[stype] = res);
  }

  addType(name, type) {
    const base = Types[type];

    if(base) return (this.types[name] = base);

    if(this.types[name]) return;
    if(this.types[type]) return (this.types[name] = this.types[type]);

    const last = type[type.length - 1];
    const res = { size: 32, type };

    if(last === "&" || last === "@") res.reference = true;
    if(last === "*" || last === "%") res.pointer = true;
    if(last === ")") {
      const types = type.substring(1, type.length - 1).split(", ");
      const retype = e => {
        if(Types[e]) return Types[e].short;

        return this.types[e].short;
      };

      res.list = true;
      res.size = types.length * 32;
      res.type = type;
      res.short = "L" + types.length + types.map(retype).join("");
    }

    if(res.pointer || res.reference) {
      const deref = type.substring(0, type.length - 1);
      const prev = this.getType(deref);

      if(! prev) this.addType(deref, deref);

      res.deref = prev ? prev : this.getType(deref);
      res.short = shorts[last] + res.deref.short;
    }

    this.types[name] = this.types[type] = res;
  }

  addVar(name, variable) {
    const { attr, dim, param, val, type } = variable;
    const v = { name, type };

    ["export", "memory", "offset", "register", "storage"].map(m => {
      if(variable[m]) v[m] = variable[m];
    });

    if(dim.length) {
      v.dim = dim.map(d => {
        const { constant, hex, isType, type } = d;

        return isType ? { isType, type } : { constant, hex };
      });
    } else v.lvalue = true;

    if(this.contract) {
      if(v.storage) {
        v.smap = this.smap.length;
        this.smap.push(v);
      } else {
        let { size } = v.type;

        if(size < 32) size = 32;

        if(v.dim) {
          size = bn(toHex(size));
          for(let i = 0; i < v.dim.length; ++i) size = size.mul(bn(v.dim[i].hex));
          size = size.toNumber();
        }

        v.mmap = this.mmap;
        this.mmap += size;
      }
    }

    if(val !== undefined) v.val = val;

    this.variables[name] = v;
    if(attr || param) this.params.push(v);
  }

  getFunction(name, last) {
    const ret = this.functions[name];

    return ret ? ret : last ? null : this.next ? this.next.getFunction(name) : null;
  }

  getType(name, last) {
    if(Types[name]) return Types[name];

    const ret = this.types[name];

    return ret ? ret : last ? null : this.next ? this.next.getType(name) : null;
  }

  getVariable(name, last) {
    const ret = this.variables[name];

    return ret ? ret : last ? null : this.next ? this.next.getVariable(name) : null;
  }
}

module.exports = Scope;
