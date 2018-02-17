pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/token/TokenVesting.sol";
import "../token/TokenReciever.sol";

contract TokenVestingERC223 is TokenVesting, TokenReciever {
    function TokenVestingERC223(
        address _beneficiary,
        uint _start,
        uint _cliff,
        uint _duration,
        bool _revocable)
        public TokenVesting(
            _beneficiary,
            _start,
            _cliff,
            _duration,
            _revocable
        )
    {
        
    }
}