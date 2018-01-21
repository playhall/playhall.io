pragma solidity ^0.4.17;

import "./FundBase.sol";


contract Fund is FundBase {

    function Fund(ERC20Basic _token) public FundBase(_token) {
        
    }

    function makePayment(address _beneficiary, uint _amount) external onlyOwner {
        token.safeTransfer(_beneficiary, _amount);
    }
}