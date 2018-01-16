let Token = artifacts.require("./PlayHallToken");

module.exports = function(deployer) {
  deployer.deploy(Token);
};
