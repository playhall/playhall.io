pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../token/PlayHallToken.sol";
import "../SaleBase.sol";
import "../IPricingStrategy.sol";
import "./IFinalizeAgent.sol";


/**
 * @title Presale
 * @dev Presale is a contract for managing a token crowdsale.
 * Presales have a start and end timestamps, where buyers can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Sale is SaleBase {
    using SafeMath for uint;

    bool public finalized = false;

    IFinalizeAgent public finalizeAgent;
    
    uint public time;
    function Sale(
        uint _startTime,
        uint _endTime,
        IPricingStrategy _pricingStrategy,
        PlayHallToken _token,
        address _wallet,
        uint _weiMaximumGoal,
        uint _weiMinimumGoal,
        uint _weiMinimumAmount,
        address _admin,
        uint _weiRaised,
        uint _tokensSold
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
        weiRaised = _weiRaised;
        tokensSold = _tokensSold;
    }

    function finalize() external onlyOwner {
        // Already finalized
        require(!finalized);

        uint tokensForFunds = token.totalSupply().mul(2).div(3); // 40% of final supply
        token.mint(finalizeAgent, tokensForFunds, false);
        token.finishMinting();

        finalizeAgent.finalizeCrowdsale();

        finalized = true;
    }
    
    function setFinalizeAgent(IFinalizeAgent _finalizeAgent) public onlyOwner {
        // Don't allow setting bad agent
        require(_finalizeAgent.isFinalizeAgent());

        finalizeAgent = _finalizeAgent;
    }

}
