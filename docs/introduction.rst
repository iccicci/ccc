============
Introduction
============

After exploring the available **EVM** compilers offered by the *open source* community, being not able
to find one of them capable to satisfy me, I decided to undertake this challenging project.

Philosophy
==========

Thinking just a while to the **EVM** we all can agree that it is a really *small environment*, that's why
(in my opinion) an **EVM** *dedicated compiler* should offer the less as possible features to comfortably
write *smart contracts* while keeping the generated *opcode* the more thin as possible.

.. _warning:

Warning
=======

I learned everithing I know about **EVM** reading from the internet or through reverse engineering. I
have no way to say if what I read is wrong or outdated, I can't say if there are other ways to do what I
discovered: *do not trust me!* If you find something wrong, outdated, or false for any other reasons,
please do not hesitate to report it `on github`_.

Assumptions
===========

In this documentation there are several *assumptions* as the following example.

.. admonition:: Assumption

   1 + 1 = 3

*Assumptions* can be read in two ways: decontextualized or in the context of **CCC**. If reading one of
them you find it wrong, please consider the previous :ref:`warning`. Regardless of that, in the context of
**CCC** they can be taken as *the truth* due to the fact that **CCC** is written respecting them as *the
truth* should be respected.

.. _on github: https://github.com/iccicci/ccc/issues
