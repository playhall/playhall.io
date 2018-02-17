pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";
import "zeppelin-solidity/contracts/ownership/Contactable.sol";
import "./IPricingStrategy.sol";
import "./token/PlayHallToken.sol";


contract SaleBase is Pausable, Contactable {
    using SafeMath for uint;
  
    // The token being sold
    PlayHallToken public token;
  
    // start and end timestamps where purchases are allowed (both inclusive)
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

    // maximum amount of wei in total, that can be bought
    uint public weiMaximumGoal;

    // if weiMinimumGoal will not be reached till endTime, buyers will be able to refund ETH
    uint public weiMinimumGoal;

    // minimum amount of wel, that can be contributed
    uint public weiMinimumAmount;

    // How many distinct addresses have bought
    uint public buyerCount;

    // how much wei we have returned back to the contract after a failed crowdfund
    uint public loadedRefund;

    // how much wei we have given back to buyers
    uint public weiRefunded;

    // how much ETH each address has bought to this crowdsale
    mapping (address => uint) public boughtAmountOf;

    // whether a buyer already bought some tokens
    mapping (address => bool) public isBuyer;

    // whether a buyer bought tokens through other currencies
    mapping (address => bool) public isExternalBuyer;

    address public admin;

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

    // a refund was processed for an buyer
    event Refund(address buyer, uint weiAmount);
    event RefundLoaded(uint amount);

    function SaleBase(
        uint _startTime,
        uint _endTime,
        IPricingStrategy _pricingStrategy,
        PlayHallToken _token,
        address _wallet,
        uint _weiMaximumGoal,
        uint _weiMinimumGoal,
        uint _weiMinimumAmount,
        address _admin
    ) public
    {
        require(_startTime >= now);
        require(_endTime >= _startTime);
        require(_pricingStrategy.isPricingStrategy());
        require(address(_token) != 0x0);
        require(_wallet != 0x0);
        require(_weiMaximumGoal > 0);
        require(_admin != 0x0);

        startTime = _startTime;
        endTime = _endTime;
        pricingStrategy = _pricingStrategy;
        token = _token;
        wallet = _wallet;
        weiMaximumGoal = _weiMaximumGoal;
        weiMinimumGoal = _weiMinimumGoal;
        weiMinimumAmount = _weiMinimumAmount;
        admin = _admin;
    }


    modifier onlyOwnerOrAdmin() {
        require(msg.sender == owner || msg.sender == admin); 
        _;
    }

    // fallback function can be used to buy tokens
    function () external payable {
        buyTokens(msg.sender);
    }

    // low level token purchase function
    function buyTokens(address beneficiary) public whenNotPaused payable returns (bool) {
        uint weiAmount = msg.value;

        require(beneficiary != 0x0);
        require(weiAmount >= weiMinimumAmount);
        require(validPurchase(msg.value));
    
        // calculate token amount to be created
        uint tokenAmount = pricingStrategy.calculateTokenAmount(weiAmount, weiRaised);
        
        mintTokenToBuyer(beneficiary, tokenAmount, weiAmount);
        
        wallet.transfer(msg.value);

        return true;
    }

    function mintTokenToBuyer(address beneficiary, uint tokenAmount, uint weiAmount) internal {
        if (!isBuyer[beneficiary]) {
            // A new buyer
            buyerCount++;
            isBuyer[beneficiary] = true;
        }

        boughtAmountOf[beneficiary] = boughtAmountOf[beneficiary].add(weiAmount);
        weiRaised = weiRaised.add(weiAmount);
        tokensSold = tokensSold.add(tokenAmount);
    
        token.mint(beneficiary, tokenAmount, true);
        TokenPurchase(msg.sender, beneficiary, weiAmount, tokenAmount);
    }

    // return true if the transaction can buy tokens
    function validPurchase(uint weiAmount) internal constant returns (bool) {
        bool withinPeriod = now >= startTime && now <= endTime;
        bool withinCap = weiRaised.add(weiAmount) <= weiMaximumGoal;

        return withinPeriod && withinCap;
    }

    // return true if crowdsale event has ended
    function hasEnded() public constant returns (bool) {
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
        require(msg.sender == wallet);
        require(msg.value > 0);
        require(!isMinimumGoalReached());
        
        loadedRefund = loadedRefund.add(msg.value);

        RefundLoaded(msg.value);
    }

    /**
    * Buyers can claim refund.
    *
    * Note that any refunds from proxy buyers should be handled separately,
    * and not through this contract.
    */
    function refund() external {
        require(!isMinimumGoalReached() && loadedRefund > 0);
        require(!isExternalBuyer[msg.sender]);
        uint weiValue = boughtAmountOf[msg.sender];
        require(weiValue > 0);
        
        boughtAmountOf[msg.sender] = 0;
        weiRefunded = weiRefunded.add(weiValue);
        msg.sender.transfer(weiValue);

        Refund(msg.sender, weiValue);
    }

    function registerPayment(address beneficiary, uint tokenAmount, uint weiAmount) public onlyOwnerOrAdmin {
        require(validPurchase(weiAmount));
        isExternalBuyer[beneficiary] = true;
        mintTokenToBuyer(beneficiary, tokenAmount, weiAmount);
    }

    function registerPayments(address[] beneficiaries, uint[] tokenAmounts, uint[] weiAmounts) external onlyOwnerOrAdmin {
        require(beneficiaries.length == tokenAmounts.length);
        require(tokenAmounts.length == weiAmounts.length);

        for (uint i = 0; i < beneficiaries.length; i++) {
            registerPayment(beneficiaries[i], tokenAmounts[i], weiAmounts[i]);
        }
    }

    function setAdmin(address adminAddress) external onlyOwner {
        admin = adminAddress;
    }
}