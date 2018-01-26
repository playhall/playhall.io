const Token = artifacts.require("./token/PlayHallToken")

module.exports = function(deployer) {
  deployer.deploy(Token)
};
