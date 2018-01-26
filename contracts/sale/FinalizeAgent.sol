pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/token/SafeERC20.sol";
import "./IFinalizeAgent.sol";
import "../SaleBase.sol";


contract FinalizeAgent is IFinalizeAgent {
    using SafeMath for uint;
    using SafeERC20 for ERC20Basic;
    
    ERC20Basic public token;
    SaleBase public crowdsale;

    uint public teamPercent;
    uint public bountyPercent;
    uint public reservePercent;

    address public teamFund;
    address public bountyFund;
    address public reserveFund;
    
    function FinalizeAgent (
        ERC20Basic _token, 
        SaleBase _crowdsale,
        uint _teamPercent,
        uint _bountyPercent,
        uint _reservePercent,
        address _teamFund,
        address _bountyFund,
        address _reserveFund
    ) public
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
        uint tokensForTeam = tokensForFunds.mul(teamPercent).div(100);
        uint tokensForBounty = tokensForFunds.mul(bountyPercent).div(100);
        uint tokensForReserve = tokensForFunds.sub(tokensForTeam).sub(tokensForBounty);

        token.safeTransfer(teamFund, tokensForTeam);
        token.safeTransfer(bountyFund, tokensForBounty);
        token.safeTransfer(reserveFund, tokensForReserve);
    }
}