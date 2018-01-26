pragma solidity ^0.4.17;

import "../token/PlayHallToken.sol";
import "../SaleBase.sol";
import "../IPricingStrategy.sol";


/**
 * @title Presale
 * @dev Presale is a contract for managing a token crowdsale.
 * Presales have a start and end timestamps, where buyers can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Presale is SaleBase {
    function Presale(
        uint _startTime,
        uint _endTime,
        IPricingStrategy _pricingStrategy,
        PlayHallToken _token,
        address _wallet,
        uint _weiMaximumGoal,
        uint _weiMinimumGoal,
        uint _weiMinimumAmount,
        address _admin
    ) public SaleBase(
        _startTime,
        _endTime,
        _pricingStrategy,
        _token,
        _wallet,
        _weiMaximumGoal,
        _weiMinimumGoal,
        _weiMinimumAmount,
        _admin) 
    {

    }

    function changeTokenOwner(address newOwner) external onlyOwner {
        require(newOwner != 0x0);
        token.transferOwnership(newOwner);
    }
}
