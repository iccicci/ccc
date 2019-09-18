.code
0x00 // sp

.data
jump_to_main:
.code
main
jump
.data
contract:
.code

0x00
calldataload
0xe0
shr // sp signature
dup1
0x6438a68d
eq
g_
jumpi
invalid

g_:
pop // sp
g_return // sp g_return
dup2 // sp g_return &*sp
dup3
32
add // sp_opig g_return &*sp_orig sp
32
4
dup3
calldatacopy
32
add // sp_opig g_return &*sp_orig new_sp
swap1 // sp_opig g_return new_sp &*sp_orig
g
jump
g_return: // sp
32
swap1
return

g: // pc sp &ret
swap1 // pc &ret sp
32
swap1
sub
mload // pc &ret a
23
add // pc &ret a+23
swap1 // pc a+23 &ret
mstore // pc
jump

main: // sp
main
0
0
codecopy
contract // sp contract
jump_to_main // sp contract jump_to_main
loop:
0x5B
dup2
mstore8
1
add // sp contract jump_to_main+1
dup2
dup2
eq
iszero
loop
jumpi
main
0
return
