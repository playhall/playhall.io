pragma solidity ^0.4.17;

import "./Fund.sol";
import "./VestedFund.sol";


contract ReserveFund is Fund, VestedFund {
    
    function ReserveFund(ERC20Basic _token) Fund(_token) VestedFund(_token) {
        
    }
}