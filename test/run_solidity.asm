.code
/* "<stdin>":0:109  contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } } */
0x80
0x40
mstore
/* "<stdin>":13:36  constructor() public {} */
callvalue
/* "--CODEGEN--":8:17   */
dup1
/* "--CODEGEN--":5:7   */
iszero
tag_1
jumpi
/* "--CODEGEN--":30:31   */
0x00
/* "--CODEGEN--":27:28   */
dup1
/* "--CODEGEN--":20:32   */
revert
/* "--CODEGEN--":5:7   */
tag_1:
/* "<stdin>":13:36  constructor() public {} */
pop
/* "<stdin>":0:109  contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } } */
sub_0_length
dup1
sub_0
0x00
codecopy
0x00
return
stop

sub_0 {
.code
/* "<stdin>":0:109  contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } } */
0x80
0x40
mstore
callvalue
/* "--CODEGEN--":8:17   */
dup1
/* "--CODEGEN--":5:7   */
iszero
tag_1
jumpi
/* "--CODEGEN--":30:31   */
0x00
/* "--CODEGEN--":27:28   */
dup1
/* "--CODEGEN--":20:32   */
revert
/* "--CODEGEN--":5:7   */
tag_1:
/* "<stdin>":0:109  contract x { constructor() public {} function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } } */
pop
0x04
calldatasize
lt
tag_2
jumpi
0x00
calldataload
0xe0
shr
dup1
0x6438a68d
eq
tag_3
jumpi
tag_2:
0x00
dup1
revert
/* "<stdin>":37:107  function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } */
tag_3:
tag_4
0x04
dup1
calldatasize
sub
/* "--CODEGEN--":13:15   */
0x20
/* "--CODEGEN--":8:11   */
dup2
/* "--CODEGEN--":5:16   */
lt
/* "--CODEGEN--":2:4   */
iszero
tag_5
jumpi
/* "--CODEGEN--":29:30   */
0x00
/* "--CODEGEN--":26:27   */
dup1
/* "--CODEGEN--":19:31   */
revert
/* "--CODEGEN--":2:4   */
tag_5:
/* "<stdin>":37:107  function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } */
dup2
add
swap1
dup1
dup1
calldataload
0xffffffff
and
swap1
0x20
add
swap1
swap3
swap2
swap1
pop
pop
pop
tag_6
jump	// in
tag_4:
0x40
mload
dup1
dup3
0xffffffff
and
0xffffffff
and
dup2
mstore
0x20
add
swap2
pop
pop
0x40
mload
dup1
swap2
sub
swap1
return
tag_6:
/* "<stdin>":78:88  uint32 ret */
0x00
/* "<stdin>":102:104  23 */
0x17
/* "<stdin>":98:99  a */
dup3
/* "<stdin>":98:104  a + 23 */
add
/* "<stdin>":92:104  ret = a + 23 */
swap1
pop
/* "<stdin>":37:107  function g(uint32 a) public pure returns(uint32 ret) { ret = a + 23; } */
swap2
swap1
pop
jump	// out

.data
0xa165627a7a723058207da7f0f721bbd655182ffcd973e77115f0edd9ee0d07fb2557c66193cfe8a1f30029
}
