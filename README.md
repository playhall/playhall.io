# How to deploy contracts

1. Run Ethereum node (like Parity or Geth) on localhost and wait until it synchronize with the network. For example for Parity:
```
parity ui --geth --force-ui
```
2. Specify your deployer address in `truffle.js` in `networks.live.from` property
3. Remain only needed migration files in `migrations` folder. For example, for Presale deployment you need to remove 4 and 5 migration files (they will be needed in the future, for ICO deployment)
4. Install [Truffle](truffleframework.com)
5. Run next command:
```
truffle migrate --network=live
```

This command will execute all migrations file one by one in `migrations` folder and deploy necessary contracts into mainnet.