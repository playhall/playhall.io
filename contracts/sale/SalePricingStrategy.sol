pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/math/SafeMath.sol";
import "../IPricingStrategy.sol";


contract SalePricingStrategy is IPricingStrategy {

    using SafeMath for uint;

    uint[] public rates;
    uint[] public limits;

    function SalePricingStrategy(
        uint[] _rates,
        uint[] _limits
    ) public
    {
        require(_rates.length == _limits.length);
        rates = _rates;
        limits = _limits;
    }

    /** Interface declaration. */
    function isPricingStrategy() public view returns (bool) {
        return true;
    }

    /** Calculate the current price for buy in amount. */
    function calculateTokenAmount(uint weiAmount, uint tokensSold) public view returns (uint tokenAmount) {
        if (weiAmount == 0) {
            return 0;
        }

        var (rate, index) = currentRate(tokensSold);
        tokenAmount = weiAmount.mul(rate);

        // if we crossed slot border, recalculate remaining tokens according to next slot price
        if (tokensSold.add(tokenAmount) > limits[index]) {
            uint currentSlotTokens = limits[index].sub(tokensSold);
            uint remainingWei = weiAmount.sub(currentSlotTokens.div(rates[index]));
            tokenAmount = currentSlotTokens.add(calculateTokenAmount(remainingWei, limits[index]));
        }
    }

    function currentRate(uint tokensSold) public view returns (uint rate, uint8 index) {
        rate = rates[0];
        index = 0;

        while (tokensSold >= limits[index]) {
            rate = rates[++index];
        }
    }
}