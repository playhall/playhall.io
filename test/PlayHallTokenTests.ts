
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken } from '../types'
import { W3 } from 'soltsice';
import { Utils } from './Utils'

chai.should();
W3.Default = new W3();

contract('PlayHallToken', (accounts) => {

    const OWNER = accounts[0];
    const UNKNOWN = accounts[1];
    const MINTER = accounts[2];
    const MINTER2 = accounts[3];
    const BENEFICIARY = accounts[4];
    const BENEFICIARY2 = accounts[5];
    const BENEFICIARY3 = accounts[6];
    let token: PlayHallToken;

    before(async () => {
        token = await PlayHallToken.New(W3.TC.txParamsDefaultDeploy(OWNER));
        await token.setMinter(MINTER, W3.TC.txParamsDefaultSend(OWNER))
    })

    it("#1 should have correct parameters", async () => {
        const symbol = await token.symbol()
        const name = await token.name()
        const decimals = new BigNumber(await token.decimals())
        
        symbol.should.equal('PHT')
        name.should.equal('PlayHall Token')
        decimals.toNumber().should.equal(18)
    })

    it("#2 should not allow mint tokens from non-minter account", async () => {
        await token.mint(BENEFICIARY, 100, true, Utils.txParams(UNKNOWN))
            .should.be.rejected
    })

    it("#3 should allow mint tokens from minter account", async () => {
        let tokensAmount = 100;
        await token.mint(BENEFICIARY, tokensAmount, true, Utils.txParams(MINTER))
        let balance = await token.balanceOf(BENEFICIARY);
        balance.toNumber().should.be.equal(tokensAmount);
    })

    it("#4 should not allow to set minter from non-minter address", async () => {
        await token.setMinter(UNKNOWN, Utils.txParams(UNKNOWN))
            .should.be.rejected;
    })

    it("#5 should allow minter to set another minter", async () => {
        await token.setMinter(MINTER2, Utils.txParams(MINTER))
            .should.be.fulfilled;
        let actualMinter = await token.minter();
        actualMinter.should.be.equal(MINTER2);    
    })

    it("#6 should not allow to remove from freezeList from non-owner address", async () => {
        await token.removeFromFreezedList(BENEFICIARY, Utils.txParams(UNKNOWN))
            .should.be.rejected;
        let isFreeze = await token.freezedList(BENEFICIARY);
        isFreeze.should.be.equal(true);    
    })
    
    it("#7 should allow owner to remove from freezeList", async () => {
        await token.removeFromFreezedList(BENEFICIARY, Utils.txParams(OWNER))
            .should.be.fulfilled;
        let isFreeze = await token.freezedList(BENEFICIARY);
        isFreeze.should.be.equal(false);       
    })

    it("#8 should not allow to transfer tokens before activate", async () => {
        let tokensAmount = 100;
        await token.mint(BENEFICIARY2, tokensAmount, false, Utils.txParams(MINTER2));
        await token.transfer(UNKNOWN, tokensAmount, Utils.txParams(BENEFICIARY2))
            .should.be.rejected;
    })

    it("#9 should activate token by owner", async () => {
        await token.activate(W3.TC.txParamsDefaultDeploy(OWNER));
        let isActivated = await token.isActivated();
        isActivated.should.be.equal(true);
    })

    it("#10 should allow to transfer tokens after activate", async () => {
        let tokensAmount = 100;
        await token.transfer(UNKNOWN, tokensAmount, Utils.txParams(BENEFICIARY2))
            .should.be.fulfilled;
    })

    it("#11 should not allow to transfer tokens after buying", async () => {
        let tokensAmount = 100;
        await token.mint(BENEFICIARY3, tokensAmount, true, Utils.txParams(MINTER2));
        let isFreeze = await token.freezedList(BENEFICIARY3);
        isFreeze.should.be.equal(true);    
        await token.transfer(UNKNOWN, tokensAmount, Utils.txParams(BENEFICIARY3))
            .should.be.rejected;
    })

    it("#12 should not allow mint tokens after finish minting", async () => {
        let tokensAmount = 100;
        await token.finishMinting(Utils.txParams(MINTER2))
        await token.mint(accounts[4], tokensAmount, true, Utils.txParams(MINTER2))
            .should.be.rejected
    })
    
});