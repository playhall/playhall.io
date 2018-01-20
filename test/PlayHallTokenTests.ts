
import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import { PlayHallToken } from '../types'
import { W3 } from 'soltsice';
import { Utils } from './Utils'

chai.should();
W3.Default = new W3();

contract('PlayHallToken', (accounts) => {

    const OWNER = accounts[0];
    let token: PlayHallToken;

    it("#1 should have correct parameters", async () => {

        token = await PlayHallToken.New({
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

    it("#2 should not allow mint tokens from non-owner account", async () => {
        await token.mint(accounts[4], 100, Utils.txParams(accounts[1]))
            .should.be.rejected
    })

    it("#3 should allow mint tokens from owner account", async () => {
        let tokensAmount = 100;
        await token.mint(accounts[4], tokensAmount, Utils.txParams(OWNER))
        let balance = await token.balanceOf(accounts[4]);
        balance.toNumber().should.be.equal(tokensAmount);
    })

    it("#4 should not allow mint tokens after finish minting", async () => {
        let tokensAmount = 100;
        await token.finishMinting(Utils.txParams(OWNER))
        await token.mint(accounts[4], tokensAmount, Utils.txParams(OWNER))
            .should.be.rejected
    })

    
});