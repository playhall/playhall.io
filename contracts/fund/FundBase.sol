pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/ownership/Contactable.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "../token/TokenReciever.sol";


contract FundBase is Contactable, TokenReciever {
    using SafeERC20 for ERC20Basic;
    
    ERC20Basic public token;

    function FundBase(ERC20Basic _token) public {
        token = _token;
    }
}