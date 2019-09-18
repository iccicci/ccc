.. _node-module:

==============
Node.js module
==============

Usage
=====

.. code:: javascript

    var ccc = require('cccompiler');
    var res = ccc(filename, options);

    console.log(res.contracts.contractName.preprocessed);

Where ``filename`` is the name of the file to compile, ``options`` are described in
:ref:`compileoptions` and return value is :ref:`outjson`.
