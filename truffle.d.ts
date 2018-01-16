import { PlayHallToken } from './types/'
import Web3 = require('web3')

declare global {
  function contract(name: string, test: ContractTest): void;
  var artifacts: Artifacts;
  var assert: Chai.AssertStatic;
  var web3: Web3
}

declare type ContractTest = (accounts: string[]) => void;

interface Artifacts {
  require(name: "PlayHallToken"): PlayHallToken;
}
