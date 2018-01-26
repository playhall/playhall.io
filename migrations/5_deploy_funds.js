const BigNumber = require("bignumber.js")
const Sale = artifacts.require("Sale")
const Fund = artifacts.require("Fund")
const VestedFund = artifacts.require("VestedFund")
const ReserveFund = artifacts.require("ReserveFund")
const Token = artifacts.require("PlayHallToken")
const FinalizeAgent = artifacts.require("FinalizeAgent")

module.exports = function(deployer, network, accounts) {
  if(network == "live"){
  } else {
  }
  
  deployer.deploy(VestedFund, Token.address)
  .then(() => deployer.deploy(Fund, Token.address))
  .then(() => deployer.deploy(ReserveFund, Token.address))
  .then(() => deployer.deploy(
    FinalizeAgent,
    Token.address,
    Sale.address,
    50,
    45,
    5,
    VestedFund.address,
    Fund.address,
    ReserveFund.address
  ))
  .then(() => Sale.deployed())
  .then((sale) => sale.setFinalizeAgent(FinalizeAgent.address))
}
