
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken } from '../types'
import { W3 } from 'soltsice';
import { Utils } from './Utils'

chai.should();
W3.Default = new W3();

contract('PlayHallToken', (accounts) => {

    const OWNER = accounts[0];
    const ADMIN = accounts[2];
    let token: PlayHallToken;

    it("#1 should have correct parameters", async () => {
        token = await PlayHallToken.New(W3.TC.txParamsDefaultDeploy(accounts[0]), {_admin: ADMIN});
        await token.activate(W3.TC.txParamsDefaultDeploy(ADMIN))
        
        const symbol = await token.symbol()
        const name = await token.name()
        const decimals = new BigNumber(await token.decimals())
        
        symbol.should.equal('PHT')
        name.should.equal('PlayHall Token')
        decimals.toNumber().should.equal(18)
    })

    it("#2 should not allow mint tokens from non-owner account", async () => {
        await token.mint(accounts[4], 100, true, Utils.txParams(accounts[1]))
            .should.be.rejected
    })

    it("#3 should allow mint tokens from owner account", async () => {
        let tokensAmount = 100;
        await token.mint(accounts[4], tokensAmount, true, Utils.txParams(OWNER))
        let balance = await token.balanceOf(accounts[4]);
        balance.toNumber().should.be.equal(tokensAmount);
    })

    it("#4 should not allow to set admin from non-admin address", async () => {
        await token.setAdmin(accounts[2], Utils.txParams(accounts[3]))
            .should.be.rejected;
    })

    it("#5 should set admin corectly", async () => {
        await token.setAdmin(ADMIN, Utils.txParams(ADMIN))
            .should.be.fulfilled;
        let actualAdmin = await token.admin();
        actualAdmin.should.be.equal(ADMIN);    
    })

    it("#6 should not allow to add to freezeList from non-admin address", async () => {
        await token.addToFreezedList(accounts[2], Utils.txParams(accounts[3]))
            .should.be.rejected;
    })
    
    it("#7 should allow to add to freezeList from admin address", async () => {
        let admin = accounts[2]
        await token.addToFreezedList(accounts[8], Utils.txParams(ADMIN))
            .should.be.fulfilled;
        let isFreeze = await token.freezedList(accounts[8]);
        isFreeze.should.be.equal(true);
    })

    it("#8 should not allow to remove from freezeList from non-admin address", async () => {
        await token.removeFromFreezedList(accounts[8], Utils.txParams(accounts[3]))
            .should.be.rejected;
        let isFreeze = await token.freezedList(accounts[8]);
        isFreeze.should.be.equal(true);    
    })
    
    it("#9 should allow to remove from freezeList from non-owner & non-admin address", async () => {
        await token.removeFromFreezedList(accounts[8], Utils.txParams(ADMIN))
            .should.be.fulfilled;
        let isFreeze = await token.freezedList(accounts[8]);
        isFreeze.should.be.equal(false);       
    })

    it("#9 should not allow to transfer tokens after buying", async () => {
        let tokensAmount = 100;
        await token.mint(accounts[3], tokensAmount, true, Utils.txParams(OWNER));
        let isFreeze = await token.freezedList(accounts[3]);
        isFreeze.should.be.equal(true);    
        token.transfer(accounts[2], tokensAmount, Utils.txParams(accounts[3]))
            .should.be.rejected;
    })

    it("#10 should allow to transfer tokens after buying", async () => {
        let tokensAmount = 100;
        await token.mint(accounts[5], tokensAmount, false, Utils.txParams(OWNER));
        let isFreeze = await token.freezedList(accounts[5]);
        isFreeze.should.be.equal(false);    
        token.transfer(accounts[2], tokensAmount, Utils.txParams(accounts[5]))
            .should.be.fulfilled;
    })

    it("#11 should not allow mint tokens after finish minting", async () => {
        let tokensAmount = 100;
        await token.finishMinting(Utils.txParams(OWNER))
        await token.mint(accounts[4], tokensAmount, true, Utils.txParams(OWNER))
            .should.be.rejected
    })

    
});