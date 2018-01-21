
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken, Fund } from '../../types'
import { W3 } from 'soltsice';
import { Utils } from '../Utils'

chai.should()
W3.Default = new W3()

contract('FundTests', (accounts) => {

    const OWNER = accounts[0]
    const BENEFICIARY = accounts[1]
    const AMOUNT = 1000

    let token: PlayHallToken
    let fund: Fund

    before(async () => {
        token = await PlayHallToken.New(W3.TC.txParamsDefaultDeploy(OWNER))
        fund = await Fund.New(W3.TC.txParamsDefaultDeploy(OWNER), { _token: token.address})
        await token.mint(fund.address, AMOUNT, Utils.txParams(OWNER))
    })

    it("should make payments correctly", async () => {
        const fundBalance1 = await token.balanceOf(fund.address)
        const beneficiaryBalance1 = await token.balanceOf(BENEFICIARY)

        await fund.makePayment(BENEFICIARY, AMOUNT, Utils.txParams(OWNER))

        const fundBalance2 = await token.balanceOf(fund.address)
        const beneficiaryBalance2 = await token.balanceOf(BENEFICIARY)

        fundBalance2.minus(fundBalance1).toNumber().should.equal(-AMOUNT)
        beneficiaryBalance2.minus(beneficiaryBalance1).toNumber().should.equal(AMOUNT)
    })

});