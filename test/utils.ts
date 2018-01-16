import { W3 } from 'soltsice';

W3.Default = new W3();
export class Utils {
    increaseTime(deltaTime) {
        let rpcParams = {
            jsonrpc: '2.0',
            method: 'evm_increaseTime',
            params: [deltaTime],
            id: new Date().getTime()
        };
    
        if(deltaTime > 0){
            console.log("TIME INCREASED +" + deltaTime)
            W3.Default.currentProvider.sendAsync(rpcParams, err => {
                if (err) {
                    console.log(err);
                }
            })
        }     
    };
    txParams(params){
        let objParams = {
            from: params.from,
            value: params.value,
            gas: 6000*1000,
            gasPrice: 50*10**9,
        }
        if (params.to) {
            objParams['to'] = params.to;
        }
        return objParams;
    };
    async getLastBlockTime(){
        let lastBlockNumber = await W3.Default.blockNumber;
        let lastBlock = await W3.Default.eth.getBlock(lastBlockNumber);
        return lastBlock.timestamp;
    }
}