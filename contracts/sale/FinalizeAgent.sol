pragma solidity ^0.4.17;

import "./IFinalizeAgent.sol";
import "../PlayHallToken.sol";
import "../SaleBase.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";

contract FinalizeAgent is IFinalizeAgent {
    using SafeMath for uint;
    
    PlayHallToken public token;
    SaleBase public crowdsale;

    uint public teamPercent;
    uint public bountyPercent;
    uint public reservePercent;

    address public teamFund;
    address public bountyFund;
    address public reserveFund;
    
    function FinalizeAgent (
        PlayHallToken _token, 
        SaleBase _crowdsale,
        uint _teamPercent,
        uint _bountyPercent,
        uint _reservePercent,
        address _teamFund,
        address _bountyFund,
        address _reserveFund
    ) 
    {
        require(address(_token) != 0);
        require(address(_crowdsale) != 0);
        require(address(_teamFund) != 0);
        require(address(_bountyFund) != 0);
        require(address(_reserveFund) != 0);
        token = _token;
        crowdsale = _crowdsale;
        teamPercent = _teamPercent;
        bountyPercent = _bountyPercent;
        reservePercent = _reservePercent;
        teamFund = _teamFund;
        bountyFund = _bountyFund;
        reserveFund = _reserveFund;
    }

    function isFinalizeAgent() public constant returns(bool) {
        return true;
    }

    function finalizeCrowdsale() external {
        require(msg.sender == address(crowdsale));
        
        uint tokensForFunds = token.balanceOf(this);
        uint tokensPercent = tokensForFunds.div(100);
        uint tokensForTeam = tokensPercent.mul(teamPercent);
        uint tokensForBounty = tokensPercent.mul(bountyPercent);
        uint tokensForReserve = tokensForFunds - (tokensForTeam + tokensForBounty);

        token.transfer(teamFund, tokensForTeam);
        token.transfer(bountyFund, tokensForBounty);
        token.transfer(reserveFund, tokensForReserve);
    }
}