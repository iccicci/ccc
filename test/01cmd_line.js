"use strict";

const assert = require("assert");
const cp = require("child_process");
const desc = process.env.SKIP_SLOW_TESTS ? xdescribe : describe;
const fs = require("fs");
const src = require("./src");
const version = JSON.parse(fs.readFileSync("package.json", "utf8")).version;
const deq = assert.deepStrictEqual;
const eq = assert.strictEqual;

function spawn(argv, done) {
  const arr = process.env.running_under_istanbul ? ["node_modules/.bin/nyc", "-r", "none", "--clean", "false", "ccc.js"] : ["ccc.js"];
  const opt = { stdio: "pipe", timeout: 1500 };

  for(const i in argv) arr.push(argv[i]);

  const child = cp.spawn(process.argv[0], arr, opt);
  var stderr = "";
  var stdout = "";

  child.stderr.on("data", data => (stderr += data));
  child.stdout.on("data", data => (stdout += data));
  child.on("close", code => done(code, stderr, stdout));

  return child;
}

describe("cmd line", function() {
  this.timeout(10000);

  desc("--help", () => {
    before(done => {
      spawn(["-h"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 0));
    it("stderr", () => assert.equal(this.stderr, ""));
    it("stdout", () => assert.equal(this.stdout.indexOf("version and exits"), 516));
  });

  desc("--version", () => {
    before(done => {
      spawn(["--version"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 0));
    it("stderr", () => assert.equal(this.stderr, ""));
    it("stdout", () => assert.equal(this.stdout, `ccc (CC's C - EVM compiler) ${version}\n`));
  });

  desc("unknown option", () => {
    before(done => {
      spawn(["--unknown", "-u"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:fatal error:unknown command line option: '--unknown'\nccc:fatal error:unknown command line option: '-u'\n"));
    it("stdout", () => assert.equal(this.stdout, ""));
  });

  desc("too mutch files", () => {
    before(done => {
      spawn(["file1", "file2"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:fatal error:only one input file: 'file2'\n"));
    it("stdout", () => assert.equal(this.stdout, ""));
  });

  desc("options errors", () => {
    before(done => {
      spawn(["", "-", "-aOp", "-D", "-o"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () =>
      assert.equal(
        this.stderr,
        "ccc:fatal error:unknown command line option: ''\n" +
          "ccc:fatal error:unknown command line option: '-'\n" +
          "ccc:fatal error:missing macro name: '-D'\n" +
          "ccc:fatal error:missing output filename after '-o' option\n"
      ));
    it("stdout", () => assert.equal(this.stdout, ""));
  });

  desc("conflicting options", () => {
    before(done => {
      spawn(["-Aap", "src"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:error:options conflict: 'assemble' and 'assembly'\nccc:error:options conflict: 'assemble' and 'preprocess'\n"));
    it("stdout", () => assert.equal(this.stdout, "{}\n"));
  });

  desc("missing input file", () => {
    before(done => {
      spawn([], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:fatal error:no input file\n"));
    it("stdout", () => assert.equal(this.stdout, ""));
  });

  desc("missing output path", () => {
    before(
      src("\n.code \n\n10\n\n", done => {
        spawn(["-a", "src", "-o", "do/not/exists"], (code, stderr, stdout) => {
          this.code = code;
          this.stderr = stderr;
          this.stdout = stdout;
          done();
        });
      })
    );

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:fatal error:ENOENT: no such file or directory, open 'do/not/exists'\n"));
    it("stdout", () => assert.equal(this.stdout, ""));
  });

  desc("compile errors", () => {
    before(
      src(".error\n", done => {
        spawn(["-a", "src"], (code, stderr, stdout) => {
          this.code = code;
          this.stderr = stderr;
          this.stdout = stdout;
          done();
        });
      })
    );

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:error:src:1:2:unexpeceted token after '.': 'error'\n"));
    it("stdout", () => assert.equal(this.stdout, "{}\n"));
  });

  desc("stdout", () => {
    before(
      src("\n.code \n\n10\n\n", done => {
        spawn(["-aO", "src"], (code, stderr, stdout) => {
          this.code = code;
          this.stderr = stderr;
          this.stdout = stdout;
          done();
        });
      })
    );

    it("exit status", () => assert.equal(this.code, 0));
    it("stderr", () => assert.equal(this.stderr, ""));
    it("stdout", () => assert.deepStrictEqual(JSON.parse(this.stdout), { contracts: { default: { opcodes: ["PUSH1", "0xA"], bin: "600A" } } }));
  });

  desc("output file", () => {
    let ret;

    before(
      src("\n.code \n\n10\n\n", done => {
        spawn(["-aO", "src", "-o", "test.json"], (code, stderr, stdout) => {
          ret = { code, stderr, stdout };
          done();
        });
      })
    );

    it("exit status", () => eq(ret.code, 0));
    it("stderr", () => eq(ret.stderr, ""));
    it("stdout", () => eq(ret.stdout, ""));
    it("output", () => deq(JSON.parse(fs.readFileSync("test.json", "utf8")), { contracts: { default: { opcodes: ["PUSH1", "0xA"], bin: "600A" } } }));
  });

  desc("file not found", () => {
    before(done => {
      spawn(["nofile.ccc"], (code, stderr, stdout) => {
        this.code = code;
        this.stderr = stderr;
        this.stdout = stdout;
        done();
      });
    });

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:error:ENOENT: no such file or directory, open 'nofile.ccc'\n"));
    it("stdout", () => assert.equal(this.stdout, "{}\n"));
  });

  desc("bytecode", () => {
    before(
      src("\n.code \n\n10\n\n", done => {
        spawn(["-a", "src"], (code, stderr, stdout) => {
          this.code = code;
          this.stderr = stderr;
          this.stdout = stdout;
          done();
        });
      })
    );

    it("exit status", () => assert.equal(this.code, 0));
    it("stderr", () => assert.equal(this.stderr, ""));
    it("stdout", () => assert.deepStrictEqual(JSON.parse(this.stdout), { contracts: { default: { bin: "600A" } } }));
  });

  desc("-D", () => {
    before(
      src("#define test test1 test2\n\na test b\nc\n", done => {
        spawn(["-p", "src", "-Dc=test3", "-Da"], (code, stderr, stdout) => {
          this.code = code;
          this.stderr = stderr;
          this.stdout = stdout;
          done();
        });
      })
    );

    it("exit status", () => assert.equal(this.code, 1));
    it("stderr", () => assert.equal(this.stderr, "ccc:error:src:5:1:unexpected end of file when ';' expected\n"));
    it("stdout", () => assert.deepStrictEqual(JSON.parse(this.stdout), { preprocessed: "\n test1 test2 b\ntest3\n" }));
  });
});
