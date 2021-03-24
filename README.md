# ccc

CC's C - EVM compiler

[![Build Status][travis-badge]][travis-url]
[![Code Climate][code-badge]][code-url]
[![Test Coverage][cover-badge]][code-url]
[![Donate][donate-badge]][donate-url]

[![NPM version][npm-badge]][npm-url]
[![NPM downloads][npm-downloads-badge]][npm-url]
[![Stars][stars-badge]][github-url]

[![Dependencies][dep-badge]][dep-url]
[![Dev Dependencies][dev-dep-badge]][dev-dep-url]
[![Dependents][deps-badge]][npm-url]

[code-badge]: https://codeclimate.com/github/iccicci/ccc/badges/gpa.svg
[code-url]: https://codeclimate.com/github/iccicci/ccc
[cover-badge]: https://codeclimate.com/github/iccicci/ccc/badges/coverage.svg
[dep-badge]: https://david-dm.org/iccicci/ccc.svg
[dep-url]: https://david-dm.org/iccicci/ccc
[deps-badge]: https://badgen.net/npm/dependents/ccc?icon=npm
[dev-dep-badge]: https://david-dm.org/iccicci/ccc/dev-status.svg
[dev-dep-url]: https://david-dm.org/iccicci/ccc?type=dev
[donate-badge]: https://badgen.net/badge/donate/bitcoin?icon=bitcoin
[donate-url]: https://blockchain.info/address/12p1p5q7sK75tPyuesZmssiMYr4TKzpSCN
[github-url]: https://github.com/iccicci/ccc
[npm-downloads-badge]: https://badgen.net/npm/dw/ccc?icon=npm
[npm-badge]: https://badgen.net/npm/v/ccc?color=green&icon=npm
[npm-url]: https://www.npmjs.com/package/ccc
[stars-badge]: https://badgen.net/github/stars/iccicci/ccc?icon=github
[travis-badge]: https://badgen.net/travis/iccicci/ccc?icon=travis
[travis-url]: https://travis-ci.org/iccicci/ccc?branch=master
[types-badge]: https://badgen.net/npm/types/ccc?color=green&icon=typescript

# UNDER DEVELOPMENT

## Installation

With [npm](https://www.npmjs.com/package/cccompiler):

```sh
$ sudo npm install -g cccompiler
```

## Source code

Source repository is on [github](https://github.com/iccicci/ccc).

## Usage

### From shell

```sh
$ ccc [options] file
```

### As module

```javascript
var ccc = require("cccompiler");
var res = ccc(filename, options);
```

## Documentation

For more details please check the [documentation](http://ccc.readthedocs.io/en/latest/).
