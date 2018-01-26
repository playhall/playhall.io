const Presale = artifacts.require("Presale")
const PricingStrategy = artifacts.require("PresalePricingStrategy")
const Token = artifacts.require("PlayHallToken")

module.exports = function(deployer, network, accounts) {
  let startTime, endTime, rate, weiMaximumGoal, weiMinimumGoal, weiMinimumAmount, wallet, admin

  rate = 12000
  weiMinimumGoal = 0
  if(network == "live"){
    startTime = 0
    endTime = 0
    weiMaximumGoal = web3.toWei(5000, "ether")
    weiMinimumAmount = web3.toWei(0.01, "ether")
    wallet = "0x0"
    admin = "0x0"
  } else {
    const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
    startTime = now + 100
    endTime = startTime + 100
    weiMaximumGoal = 100
    weiMinimumAmount = 1
    wallet = accounts[1]
    admin = accounts[2]
  }

  deployer.deploy(PricingStrategy, rate)
  .then(() => deployer.deploy(
    Presale,
    startTime,
    endTime, 
    PricingStrategy.address,
    Token.address,
    wallet,
    weiMaximumGoal,
    weiMinimumGoal,
    weiMinimumAmount,
    admin
  ))
  .then(() => Token.deployed())
  .then((token) => token.transferOwnership(Presale.address))
};
