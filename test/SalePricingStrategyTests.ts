
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { SalePricingStrategy } from '../types'
import { W3 } from 'soltsice';

chai.should();
chai.use(require('chai-as-promised'))
W3.Default = new W3();


contract('SalePricingStrategy', (accounts) => {

    const deployParams = {
        from : accounts[0],
        gas: 10000000,
        gasPrice: 10000000000,
        value: 0
    }

    const RATES =  [3, 2, 1]
    const LIMITS = [100, 200, 300]
    const WEI = 7

    let strategy: SalePricingStrategy

    before(async () => {
        strategy = await SalePricingStrategy.New(deployParams, {
            _rates: RATES,
            _limits: LIMITS
        })
    })

    it("#1 should be a pricing strategy", async () => {
        (await strategy.isPricingStrategy()).should.be.true
    })

    it("#2 should calculate amount correctly, when tokensSold = 0", async () => {
        const tokensSold = 0
        const expected = WEI * RATES[0]
        const result = await strategy.calculateTokenAmount(WEI, tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#3 should calculate amount correctly inside slot", async () => {
        const tokensSold = 50
        const expected = WEI * RATES[0]
        const result = await strategy.calculateTokenAmount(WEI, tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#4 should calculate amount correctly on slot border", async () => {
        const delta = 3
        const tokensSold = LIMITS[0] - delta
        const expected = delta
        const result = await strategy.calculateTokenAmount(delta / RATES[0], tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#5 should calculate amount correctly in the beginning of new slot", async () => {
        const tokensSold = LIMITS[0]
        const expected = WEI * RATES[1]
        const result = await strategy.calculateTokenAmount(WEI, tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#6 should calculate amount correctly in last slot border", async () => {
        const wei = 1
        const tokensSold = LIMITS[2] - wei * RATES[2]
        const expected = wei * RATES[2]
        const result = await strategy.calculateTokenAmount(wei, tokensSold)
        result.toNumber().should.equal(expected)
    })

    it("#7 should throw, if all slots ended", async () => {
        const tokensSold = LIMITS[2]
        const result = strategy.calculateTokenAmount(WEI, tokensSold)
        return result.should.be.rejected
    })

    it("#8 should throw, if all slots exceeded", async () => {
        const wei = 10
        const tokensSold = LIMITS[2] - 1
        const result = strategy.calculateTokenAmount(wei, tokensSold)
        return result.should.be.rejected
    })

    it("#9 should should calculate amount correctly, if tokens go through slots", async () => {
        const weiRaised = 80
        const wei = 90

        const w1 = (LIMITS[0] - weiRaised)
        const w2 = wei - w1
 
        const expected = w1 * RATES[0] + w2 * RATES[1]
        
        const result = await strategy.calculateTokenAmount(wei, weiRaised)

        result.toNumber().should.equal(Math.ceil(expected))
    })

    // currentRate and currentIndex tests

    it("#10 should calculate currentRate correctly", async () => {
        const tokensSold =     [0, 30, LIMITS[0], LIMITS[1]-1]
        const expectedTokens = [RATES[0], RATES[0], RATES[1], RATES[1]]
        const expectedIndex =  [0, 0, 1, 1]

        for (let i = 0; i < tokensSold.length; i++) {
            const [resTokens, resIndex] = await strategy.currentRate(tokensSold[i])
            resTokens.toNumber().should.equal(expectedTokens[i], `index=${i}`)
            resIndex.toNumber().should.equal(expectedIndex[i], `index=${i}`)
        }
    })
});