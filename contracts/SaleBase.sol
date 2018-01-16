pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/MintableToken.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/ownership/Contactable.sol";
import "./IPricingStrategy.sol";

contract SaleBase is Pausable, Contactable {
    using SafeMath for uint;
  
    // The token being sold
    MintableToken public token;
  
    // start and end timestamps where investments are allowed (both inclusive)
    uint public startTime;
    uint public endTime;
  
    // address where funds are collected
    address public wallet;
  
    // the contract, which determine how many token units a buyer gets per wei
    IPricingStrategy public pricingStrategy;
  
    // amount of raised money in wei
    uint public weiRaised;

    // amount of tokens that was sold on the crowdsale
    uint public tokensSold;

    // maximum amount of wei in total, that can be invested
    uint public weiMaximumGoal;

    // if weiMinimumGoal will not be reached till endTime, investors will be able to refund ETH
    uint public weiMinimumGoal;

    // How many distinct addresses have invested
    uint public investorCount;

    // how much wei we have returned back to the contract after a failed crowdfund
    uint public loadedRefund;

    // how much wei we have given back to investors
    uint public weiRefunded;

    //How much ETH each address has invested to this crowdsale
    mapping (address => uint) public investedAmountOf;

    /**
     * event for token purchase logging
     * @param purchaser who paid for the tokens
     * @param beneficiary who got the tokens
     * @param value weis paid for purchase
     * @param tokenAmount amount of tokens purchased
     */
    event TokenPurchase(
        address indexed purchaser,
        address indexed beneficiary,
        uint value,
        uint tokenAmount
    );

    // a refund was processed for an investor
    event Refund(address investor, uint weiAmount);

    function SaleBase(
        uint _startTime,
        uint _endTime,
        IPricingStrategy _pricingStrategy,
        MintableToken _token,
        address _wallet,
        uint _weiMaximumGoal,
        uint _weiMinimumGoal
    )  
    {
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_pricingStrategy.isPricingStrategy());
        require(address(_token) != 0x0);
        require(_wallet != 0x0);
        require(_weiMaximumGoal > 0);

        startTime = _startTime;
        endTime = _endTime;
        pricingStrategy = _pricingStrategy;
        token = _token;
        wallet = _wallet;
        weiMaximumGoal = _weiMaximumGoal;
        weiMinimumGoal = _weiMinimumGoal;
}

    // fallback function can be used to buy tokens
    function () external payable {
        buyTokens(msg.sender);
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public whenNotPaused payable returns (bool) {
        require(beneficiary != 0x0);
        require(validPurchase());
    
        uint weiAmount = msg.value;
    
        // calculate token amount to be created
        uint tokenAmount = pricingStrategy.calculateTokenAmount(weiAmount, tokensSold);
    
        // update state
        if (investedAmountOf[beneficiary] == 0) {
            // A new investor
            investorCount++;
        }
        investedAmountOf[beneficiary] = investedAmountOf[beneficiary].add(weiAmount);
        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokenAmount);
    
        token.mint(beneficiary, tokenAmount);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokenAmount);

        wallet.transfer(msg.value);

        return true;
    }

    // return true if the transaction can buy tokens
    function validPurchase() internal constant returns (bool) {
        bool withinPeriod = (now >= startTime) && now <= endTime;
        bool nonZeroPurchase = msg.value != 0;
        bool withinCap = weiRaised.add(msg.value) <= weiMaximumGoal;

        return withinPeriod && nonZeroPurchase && withinCap;
    }

    // return true if crowdsale event has ended
    function hasEnded() external constant returns (bool) {
        bool capReached = weiRaised >= weiMaximumGoal;
        bool afterEndTime = now > endTime;
        
        return capReached || afterEndTime;
    }

    // get the amount of unsold tokens allocated to this contract;
    function getWeiLeft() external constant returns (uint) {
        return weiMaximumGoal - weiRaised;
    }

    // return true if the crowdsale has raised enough money to be a successful.
    function isMinimumGoalReached() public constant returns (bool) {
        return weiRaised >= weiMinimumGoal;
    }
    
    // allows to update tokens rate for owner
    function setPricingStrategy(IPricingStrategy _pricingStrategy) external onlyOwner returns (bool) {
        pricingStrategy = _pricingStrategy;
        return true;
    }

    /**
    * Allow load refunds back on the contract for the refunding.
    *
    * The team can transfer the funds back on the smart contract in the case the minimum goal was not reached..
    */
    function loadRefund() external payable {
        require(msg.value > 0);
        require(!isMinimumGoalReached());
        
        loadedRefund = loadedRefund.add(msg.value);
    }

    /**
    * Investors can claim refund.
    *
    * Note that any refunds from proxy buyers should be handled separately,
    * and not through this contract.
    */
    function refund() external {
        require(!isMinimumGoalReached() && loadedRefund > 0);
        uint256 weiValue = investedAmountOf[msg.sender];
        require(weiValue > 0);
        
        investedAmountOf[msg.sender] = 0;
        weiRefunded = weiRefunded.add(weiValue);
        Refund(msg.sender, weiValue);
        msg.sender.transfer(weiValue);
    }
}