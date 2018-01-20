pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/MintableToken.sol";

contract PlayHallToken is MintableToken {
    string constant public name = "PlayHall Token";
    string constant public symbol = "PHT";
    uint constant public decimals = 18;
}