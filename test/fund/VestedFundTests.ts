
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken, VestedFund, TokenVesting } from '../../types'
import { W3 } from 'soltsice';
import { Utils } from '../Utils'

chai.should()
W3.Default = new W3()

contract('VestedFundTests', (accounts) => {

    const DAY = 60*60*24;
    const OWNER = accounts[0]
    const BENEFICIARY = accounts[1]
    const AMOUNT = 1000
    const CLIFF = DAY
    const DURATION = 5 * DAY

    let token: PlayHallToken
    let fund: VestedFund

    before(async () => {
        token = await PlayHallToken.New(W3.TC.txParamsDefaultDeploy(OWNER))
        await token.activate(W3.TC.txParamsDefaultDeploy(OWNER))
        fund = await VestedFund.New(W3.TC.txParamsDefaultDeploy(OWNER), { _token: token.address})
        await token.mint(fund.address, 2 * AMOUNT, true, Utils.txParams(OWNER))
    })

    it("#1 should allow to create vested payments correctly", async () => {
        const start = await Utils.getLastBlockTime() + 10 * DAY
        const fundBalance1 = await token.balanceOf(fund.address)

        await token.removeFromFreezedList(fund.address, Utils.txParams(OWNER))
        await fund.makeVestedPayment(BENEFICIARY, AMOUNT, start, CLIFF, DURATION, true, Utils.txParams(OWNER))

        const fundBalance2 = await token.balanceOf(fund.address)
        const paymentFund = await TokenVesting.At(await fund.vestedPayments(BENEFICIARY, 0))
        
        const resBeneficiary = await paymentFund.beneficiary()
        const resCliff = await paymentFund.cliff()
        const resDuration = await paymentFund.duration()
        const resStart = await paymentFund.start()
        const resBalance = await token.balanceOf(paymentFund.address)
        
        resBeneficiary.should.equal(BENEFICIARY)
        resCliff.toNumber().should.equal(start + CLIFF)
        resDuration.toNumber().should.equal(DURATION)
        resStart.toNumber().should.equal(start)
        resBalance.toNumber().should.equal(AMOUNT)
        fundBalance2.minus(fundBalance1).toNumber().should.equal(-AMOUNT)
    })

    it("#2 should allow to release payments correctly", async () => {
        const paymentFund = await TokenVesting.At(await fund.vestedPayments(BENEFICIARY, 0))
        const start = await paymentFund.start()
        const now = await Utils.getLastBlockTime()
        
        await Utils.increaseTime(start.toNumber() - now + DURATION + DAY, OWNER)

        const fundBalance1 = await token.balanceOf(paymentFund.address)
        const beneficiaryBalance1 = await token.balanceOf(BENEFICIARY)

        await paymentFund.release(token.address, Utils.txParams(BENEFICIARY))

        const fundBalance2 = await token.balanceOf(paymentFund.address)
        const beneficiaryBalance2 = await token.balanceOf(BENEFICIARY)

        fundBalance2.minus(fundBalance1).toNumber().should.equal(-AMOUNT)
        beneficiaryBalance2.minus(beneficiaryBalance1).toNumber().should.equal(AMOUNT)
    })

    it("#3 should allow to revoke payments correctly", async () => {
        const start = await Utils.getLastBlockTime() + 10 * DAY
        const fundBalance1 = await token.balanceOf(fund.address)
        
        await fund.makeVestedPayment(BENEFICIARY, AMOUNT, start, CLIFF, DURATION, true, Utils.txParams(OWNER))
        await fund.revokeVestedPayment(BENEFICIARY, 1, Utils.txParams(OWNER))

        const fundBalance2 = await token.balanceOf(fund.address)

        fundBalance1.toNumber().should.equal(fundBalance2.toNumber())
    })
});