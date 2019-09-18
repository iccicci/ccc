.. _compilation:

==============
Compilation
==============

The compilation process takes in input only one file (many other files can be included through the
``#include`` *prepocessor directive*) and gives in output a *JSON Object* (called :ref:`outjson`)
containing all requested information that can be provided. The entire process is composed by a set
of *phases*, executed in a sequence and everyone of which produces an output for each **contract**
compiled. Starting *phase* can be eventually specified by :ref:`compileoptions`. If during the
execution of a *phase* an **error** is generated, the process stops at the end of that *phase* and
no output for that *phase* is provided (obviously no output for subsequent *phases* is provided
neither).

Compilation phases
==================

Here is the list of all *phases*, in the order they are executed. The input of the first executed
*phase* is the content of the file provided in input to the whole process, while for all subsequent
*phases* the output of previously executed *phase* is used as input.

Preprocess
----------

Runs the **CCC preprocessor**. Both *input format* and *output format* are **CCC**.

Compile
-------

Runs the **CCC compiler**. This *phase* produces two outputs: the :ref:`abi` and the **assembly**
representation of the compiled contract(s) which is eventually used as input for next *phase*. The
expected *input format* is **CCC**.

Assemble
--------

Runs the **CCC assembler** which provides the **opcode** representation of the contract(s). Both
*input format* and *output format* are **assembly**.

Opcode
------

Translates the **assembly** in the **opcodes**: Basically it resolves the *assembly labels* in
their realtive or absolute address.

Translate
---------

Literally translates the **opcodes** in the hexadecimal representation of the **bytecode** of the
contract(s), ready to be deployed on *blockchain*.

.. _outjson:

Output JSON Object
==================

This is a *JSON Object* with four keys. Follows an example.

.. code:: javascript

    {
        "contracts": {
            "FirstContract": {
                "abi": [...],
                "assembly": [...],
                "bin": [...],
                "preprocessed": [...],
                "opcodes": [...]
            },
            ...
        },
        "errors": [],
        "messages": [],
        "warnings": []
    }

contracts
---------

This is a *JSON Object* where the *keys* are the names of all compiled contracts and the *values*
are the output of all *phase* run during the compilation process.

errors
------

The array of all encoutered *errors*, eventually the empty array ``[]``.

messages
--------

The array of all generated *messages*, eventually the empty array ``[]``. This is merely the merge
of all *errors* and *warnings*.

warnings
--------

The array of all encoutered *warnings*, eventually the empty array ``[]``.

.. _compileoptions:

Compilation options
===================

Some options may conflict due to the fact some one of them specify the *input format* of the file
or they define conflicting starting and ending *phase*.

assemble
--------

``Boolean`` - If ``true`` specifies that *input format* is in **assembly** and starting *phase* is
**Assemble**.

assembly
--------

``Boolean`` - If ``true`` includes the generated **assembly** in the output, specifies that *input
format* is in **CCC** and starting *phase* is **Compile**.

define
------

``Object`` - Specifies a set of predefined ``#define`` *macros*. Each *key* is the name of the
*macro* and relative *value* is the value of the *macro*. The *values* **must** be of type
``String``, eventually the empty string ``""``.

opcode
------

``Boolean`` - If ``true`` includes the generated **opcode** in the output.

preprocess
----------

``Boolean`` - If ``true`` includes the **preprocessor** result in the output, specifies that *input
format* is in **CCC**.
