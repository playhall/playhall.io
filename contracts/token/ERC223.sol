pragma solidity ^0.4.17;

contract ERC223 {
    function transfer(address to, uint value, bytes data) public returns (bool);
    function transferFrom(address _from, address _to, uint256 _value, bytes _data) public returns (bool);
    
    event Transfer(address indexed from, address indexed to, uint value, bytes indexed data);
}