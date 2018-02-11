pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../IPricingStrategy.sol";


contract PresalePricingStrategy is IPricingStrategy {

    using SafeMath for uint;

    uint public rate;

    function PresalePricingStrategy(
        uint _rate
    ) public 
    {
        require(_rate >= 0);
        rate = _rate;
    }

    /** Interface declaration. */
    function isPricingStrategy() public view returns (bool) {
        return true;
    }

    /** Calculate the current price for buy in amount. */
    function calculateTokenAmount(uint weiAmount, uint weiRaised) public view returns (uint tokenAmount) {
        return weiAmount.mul(rate);
    }

}