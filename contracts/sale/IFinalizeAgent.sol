pragma solidity ^0.4.17;

/**
 * Finalize agent defines what happens at the end of succeseful crowdsale.
 *
 * - Allocate tokens for founders, bounties and community
 * - Make tokens transferable
 * - etc.
 */
interface IFinalizeAgent {

  function isFinalizeAgent() public constant returns(bool);

  /** Called once by crowdsale finalize() if the sale was success. */
  function finalizeCrowdsale() external;

}