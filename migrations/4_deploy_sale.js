const BigNumber = require("bignumber.js")
const Sale = artifacts.require("Sale")
const Presale = artifacts.require("Presale")
const PricingStrategy = artifacts.require("SalePricingStrategy")
const Token = artifacts.require("PlayHallToken")

module.exports = function(deployer, network, accounts) {
  let startTime, endTime, rats, limits, weiMaximumGoal, weiMinimumGoal, weiMinimumAmount, wallet, admin

  rates = [11000, 10500, 10000]
  limits = [121000000, 157500000, 190000000]
  if(network == "live"){
    startTime = 0
    endTime = 0
    weiMaximumGoal = web3.toWei(50000, "ether")
    weiMinimumGoal = web3.toWei(1500, "ether")
    weiMinimumAmount = web3.toWei(0.01, "ether")
    wallet = "0x0"
    admin = "0x0"
  } else {
    const now = web3.eth.getBlock(web3.eth.blockNumber).timestamp
    startTime = now + 100
    endTime = startTime + 100
    weiMaximumGoal = 100
    weiMinimumGoal = 0
    weiMinimumAmount = 1
    wallet = accounts[1]
    admin = accounts[2]
  }

  // add decimals
  for (let i = 0; i < limits.length; i++) {
    limits[i] = new BigNumber(limits[i]).mul(new BigNumber("1e18"))
    console.log(limits[i].toNumber())
}
  
  deployer.deploy(PricingStrategy, rates, limits)
  .then(() => deployer.deploy(
    Sale,
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
  .then(() => Presale.deployed())
  .then((presale) => presale.changeTokenOwner(Sale.address))
};
