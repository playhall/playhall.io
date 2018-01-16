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

        var (rate, index1) = currentRate(tokensSold);
        tokenAmount = weiAmount.mul(rate);

        var index2 = currentIndex(tokensSold.add(tokenAmount));
        if (index1 != index2) {
            uint currentSlotTokens = limits[index1].sub(tokensSold);
            uint remainingWei = weiAmount.sub(currentSlotTokens.div(rates[index1]));
            tokenAmount = currentSlotTokens.add(calculateTokenAmount(remainingWei, limits[index1]));
        }
    }

    function currentRate(uint tokensSold) public view returns (uint rate, uint8 index) {
        rate = rates[0];
        index = 0;

        while (tokensSold >= limits[index]) {
            rate = rates[++index];
        }
    }

    function currentIndex(uint tokensSold) public view returns (uint8 index) {
        index = 0;
        while (index < limits.length && tokensSold >= limits[index]) {
            ++index;
        }
    }

}