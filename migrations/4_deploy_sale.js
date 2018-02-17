const BigNumber = require("bignumber.js")
const Sale = artifacts.require("Sale")
const Presale = artifacts.require("Presale")
const PricingStrategy = artifacts.require("SalePricingStrategy")
const Token = artifacts.require("PlayHallToken")

module.exports = function(deployer, network, accounts) {
  let startTime, 
      endTime,
      rates,
      limits,
      weiMaximumGoal,
      weiMinimumGoal,
      weiMinimumAmount,
      wallet,
      admin,
      weiRaised,
      tokensSold

  rates = [11000, 10500, 10000]
  limits = [121000000, 157500000, 190000000]
  weiRaised = 0
  tokensSold = 0
  if(network == "live") {
    startTime = 0
    endTime = 0
    weiMaximumGoal = web3.toWei(50000, "ether")
    weiMinimumGoal = web3.toWei(1500, "ether")
    weiMinimumAmount = web3.toWei(0.01, "ether")
    wallet = "0x0"
    admin = "0x0"
  } else if(network == "kovan") {
    startTime = 1517637600
    endTime = 1517670000
    weiMaximumGoal = web3.toWei(5, "ether")
    weiMinimumGoal = web3.toWei(0.15, "ether")
    weiMinimumAmount = web3.toWei(0.01, "ether")
    wallet = "0x00cd2c836a985fEC84Cf96aBBb4740f665d36045"
    admin = "0x0851Ee225Df973850ebcE3188A7CAa38BF698572"
    rates = rates.map(x => x * 10000)
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
    admin,
    weiRaised,
    tokensSold
  ))
  //.then(() => Presale.deployed())
  //.then((presale) => presale.changeTokenMinter(Sale.address))
};
