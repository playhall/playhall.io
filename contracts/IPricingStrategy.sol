pragma solidity ^0.4.17;

interface IPricingStrategy {

    function isPricingStrategy() public view returns (bool);

    /** Calculate the current price for buy in amount. */
    function calculateTokenAmount(uint weiAmount, uint tokensSold) public view returns (uint tokenAmount);

}