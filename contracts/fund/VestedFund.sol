pragma solidity ^0.4.17;

import "./TokenVestingERC223.sol";
import "./FundBase.sol";


contract VestedFund is FundBase {

    function VestedFund(ERC20Basic _token) public FundBase(_token) {
        
    }

    mapping (address => TokenVesting[]) public vestedPayments;

    event VestedPaymentCreated(address beneficiary, TokenVesting paymentFund, uint paymentIndex, uint amount);
    event VestedPaymentRevoked(address beneficiary, TokenVesting paymentFund, uint paymentIndex);

    function makeVestedPayment(
        address _beneficiary,
        uint _amount,
        uint _start,
        uint _cliff,
        uint _duration,
        bool _revocable
    ) external onlyOwner 
    {
        var paymentFund = new TokenVestingERC223(_beneficiary, _start, _cliff, _duration, _revocable);
        token.safeTransfer(paymentFund, _amount);
        vestedPayments[_beneficiary].push(paymentFund);
        
        VestedPaymentCreated(_beneficiary, paymentFund, vestedPayments[_beneficiary].length-1, _amount);
    }

    function revokeVestedPayment(address _beneficiary, uint _paymentIndex) external onlyOwner {
        var paymentFund = vestedPayments[_beneficiary][_paymentIndex];
        paymentFund.revoke(token);
        
        VestedPaymentRevoked(_beneficiary, paymentFund, _paymentIndex);
    }
}