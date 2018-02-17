pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/ERC20.sol";


contract ERC223 is ERC20 {
    function transfer(address _to, uint _value, bytes _data) public returns (bool);
    function transferFrom(address _from, address _to, uint _value, bytes _data) public returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint value, bytes data);
}