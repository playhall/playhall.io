
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken } from '../types'
import { W3 } from 'soltsice';

chai.should();
W3.Default = new W3();

contract('PlayHallToken', (accounts) => {

    it("should have correct parameters", async () => {

        const token = await PlayHallToken.New({
            from : accounts[0],
            gas: 10000000,
            gasPrice: 10000000000,
            value: 0
        });
        
        const symbol = await token.symbol()
        const name = await token.name()
        const decimals = new BigNumber(await token.decimals())
        
        symbol.should.equal('PHT')
        name.should.equal('PlayHall Token')
        decimals.toNumber().should.equal(18)
    })

});