module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network id
    },
    kovan: {
      host: "localhost",
      port: 8545,
      network_id: 42,
      gasPrice: 1000000000,
      from: "0x001D51cDC8f4B378e136642DdB95Dfc4fF6a4B72"
    },
    rinkeby: {
      host: "localhost",
      port: 8545,
      network_id: 4,
      gas: 4712388,
      gasPrice: 30000000000,
      from: "0xb4Ea4cBD466c8991b0B45290F529AF4957c25a53"
    },
    live: {
      host: "localhost",
      port: 8545,
      network_id: 1,
      gasPrice: 10000000000,
      from: "0x0"
    }
  },

  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
