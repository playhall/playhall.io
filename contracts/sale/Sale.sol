pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "../SaleBase.sol";
import "../IPricingStrategy.sol";
import "./IFinalizeAgent.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


/**
 * @title Presale
 * @dev Presale is a contract for managing a token crowdsale.
 * Presales have a start and end timestamps, where investors can make
 * token purchases and the crowdsale will assign them tokens based
 * on a token per ETH rate. Funds collected are forwarded to a wallet
 * as they arrive.
 */
contract Sale is SaleBase {
    using SafeMath for uint;

    bool public finalized = false;

    IFinalizeAgent public finalizeAgent;

    address public teamFund;
    address public bountyFund;
    address public reserveFund;
    uint public fundsPercent;

    uint public time;
    function Sale(
        uint _startTime,
        uint _endTime,
        IPricingStrategy _pricingStrategy,
        MintableToken _token,
        address _wallet,
        uint _weiMaximumGoal,
        uint _weiMinimumGoal,
        uint _fundsPercent
    ) SaleBase(_startTime, _endTime, _pricingStrategy, _token, _wallet, _weiMaximumGoal, _weiMinimumGoal) 
    {
        fundsPercent = _fundsPercent;
    }

    function finalize() external onlyOwner {
        // Already finalized
        require(!finalized);

        uint tokensForFunds = (token.totalSupply().div(60)).mul(fundsPercent);
        token.mint(finalizeAgent, tokensForFunds);
        token.finishMinting();

        // Finalizing is optional. We only call it if we are given a finalizing agent.
        finalizeAgent.finalizeCrowdsale();

        finalized = true;
    }
    
    function setFinalizeAgent(IFinalizeAgent addr) public onlyOwner {
        // Don't allow setting bad agent
        require(addr.isFinalizeAgent());

        finalizeAgent = addr;
    }

}
