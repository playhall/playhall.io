
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PresalePricingStrategy } from '../types'
import { W3 } from 'soltsice';

chai.should();
W3.Default = new W3();


contract('PresalePricingStrategy', (accounts) => {

    const deployParams = {
        from : accounts[0],
        gas: 10000000,
        gasPrice: 10000000000,
        value: 0
    }

    const RATE = 2

    let strategy: PresalePricingStrategy

    before(async () =>{
        strategy = await PresalePricingStrategy.New(deployParams, {_rate: RATE})
    })

    it("should be a pricing strategy", async () => {
        (await strategy.isPricingStrategy()).should.be.true
    })

    it("should calculate rate correctly", async () => {
        const weiAmount = 11
        let result = await strategy.calculateTokenAmount(weiAmount, 0)

        result.toNumber().should.equal(weiAmount * RATE)
    })

});