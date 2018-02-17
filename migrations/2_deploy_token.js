const Token = artifacts.require("./token/PlayHallToken")

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Token)
};
