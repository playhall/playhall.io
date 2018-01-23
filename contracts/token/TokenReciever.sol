pragma solidity ^0.4.17;

 /*
 * Contract that is working with ERC223 tokens
 */
 
 contract TokenReciever {
    function tokenFallback(address _from, uint _value, bytes _data) public pure {
    }
}