
import { BigNumber } from 'bignumber.js';
import * as chai from 'chai';
import { PlayHallToken } from '../types';
import { SaleBase } from '../types';
import { PresalePricingStrategy } from '../types';
import { Utils } from './Utils';

import { W3 } from 'soltsice';

chai.use(require('chai-bignumber')());
chai.use(require('chai-as-promised'));
chai.should();

W3.Default = new W3();

contract('SaleBase', (accounts) => {

    const DAY = 60*60*24;
    const ETHER_MAX_GOAL = 5;
    const RATE = new BigNumber(Math.round((1 / 12000) * 10**18));
    const WEI_MAX_GOAL = new BigNumber(ETHER_MAX_GOAL * 10**18);
    const WEI_MIN_GOAL = 0;
    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const BUYERS = [accounts[2], accounts[3]];
    const ADMIN = accounts[5]; 
    let START_TIME, END_TIME: number;

    const deployingParams = {
        from : accounts[0],
        gas: 10000000,
        gasPrice: 10000000000,
        value: 0
    }

    let saleBase: SaleBase;
    let token: PlayHallToken;
    let pricingStrategy: PresalePricingStrategy;

    let deploySaleBase = async (deltaStart, deltaEnd) => {
        token = await PlayHallToken.New(deployingParams);
        pricingStrategy = await PresalePricingStrategy.New(deployingParams, {
            _rate: RATE
        });
        const now = await Utils.getLastBlockTime();
        saleBase = await SaleBase.New(deployingParams, {
            _startTime: now + deltaStart,
            _endTime: now + deltaEnd,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL,
            _admin: ADMIN
        })
        await token.transferOwnership(saleBase.address, Utils.txParams(OWNER));
        return saleBase;
    }

    before(async()=>{        
        token = await PlayHallToken.New(deployingParams);

        pricingStrategy = await PresalePricingStrategy.New(deployingParams, {
            _rate: RATE
        });

        START_TIME = (await Utils.getLastBlockTime()) + 40*DAY;
        END_TIME = START_TIME + 10*DAY;

        saleBase = await SaleBase.New(deployingParams, {
            _startTime: START_TIME,
            _endTime: END_TIME,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL,
            _admin: ADMIN
        });
        
        await token.transferOwnership(saleBase.address, Utils.txParams(OWNER, 0));
    })

    it("#1 should have correct parameters", async () => {
        const startTime = await saleBase.startTime();
        const endTime = await saleBase.endTime();
        const wallet = await saleBase.wallet();
        const admin = await saleBase.admin();

        startTime.toNumber().should.equal(START_TIME);
        endTime.toNumber().should.equal(END_TIME);
        wallet.should.equal(WALLET);
        admin.should.be.equal(ADMIN);
    });

    it('#2 should set owner correctly', async () => {
        const res = await saleBase.owner();
        res.should.equal(OWNER);
    });

    it('#3 should not allow to buy before start', async () => {
        return saleBase.sendTransaction(Utils.txParams(BUYERS[0], 1))
            .should.be.rejected;
    });

    it('#4 should allow all buyers to buy after start', async () => {
        const now = await Utils.getLastBlockTime();
        const startTime = (await saleBase.startTime()).toNumber();
        await Utils.increaseTime(startTime - now + 30, accounts[0]);

        const value = 500;
        const balance1 = new BigNumber(await W3.Default.eth.getBalance(WALLET));

        await saleBase.sendTransaction(Utils.txParams(BUYERS[1], value));
        
        const tokens = new BigNumber(await token.balanceOf(BUYERS[1]));
        const balance2 = new BigNumber(await W3.Default.eth.getBalance(WALLET));

        tokens.toNumber().should.equal(RATE.mul(value).toNumber());
        balance2.toNumber().should.equal(balance1.plus(value).toNumber());
    });

    it('#5 should not allow to buy more then hard cap', async () => {
        const weiCap = await saleBase.weiMaximumGoal();
        const weiRaised = await saleBase.weiRaised();
        await saleBase.sendTransaction(Utils.txParams(accounts[2], weiCap.minus(weiRaised)));
        return saleBase.sendTransaction(Utils.txParams(accounts[2], 1)).should.be.rejected;
    });

    it('#6 should now allow to buy after endTime', async () => {
        saleBase = await deploySaleBase(10,11);
        const now = await Utils.getLastBlockTime();
        const endTime = (await saleBase.endTime()).toNumber();
        await Utils.increaseTime(endTime - now + 30, accounts[0]);

        return saleBase.sendTransaction(Utils.txParams(accounts[2], 1))
            .should.be.rejected;
    });

    it("#7 should not allow to change admin from non-owner address", async() => {
        saleBase = await deploySaleBase(10*DAY, 15*DAY);
        await saleBase.setAdmin(accounts[2], Utils.txParams(accounts[2]))
            .should.be.rejected;
    });

    it("#8 should allow to set admin adress to 0x0", async()=>{
        const expectedAddress = "0x0000000000000000000000000000000000000000";
        await saleBase.setAdmin("0x0", Utils.txParams(OWNER));
        let admin = await saleBase.admin();
        admin.should.be.equal(expectedAddress);
    });

    it("#9 should  allow to change admin from owner address", async() => {
        const admin = accounts[4];
        await saleBase.setAdmin(admin, Utils.txParams(OWNER));
        const newAdmin = await saleBase.admin();
        newAdmin.should.be.equal(admin);
    });

    it("#10 should allow register payment from admin address", async() => {
        let now = await Utils.getLastBlockTime();
        let startTime = await saleBase.startTime();
        Utils.increaseTime(startTime.toNumber() - now + 30, OWNER);
        let admin = await saleBase.admin();
        
        let beneficiary = accounts[5];
        let tokenAmount = 200;
        let weiAmount = 100;
        await saleBase.registerPayment(beneficiary, tokenAmount, weiAmount, Utils.txParams(admin));
        let buyersCount = (await saleBase.buyerCount()).toNumber();
        let buyerTokenBalance = await token.balanceOf(beneficiary);
        let weiRaised = await saleBase.weiRaised();

        buyersCount.should.be.equal(1);
        buyerTokenBalance.toNumber().should.be.equal(tokenAmount);
        weiRaised.toNumber().should.be.equal(weiAmount);
    });

    it("#11 should not allow register payment from non-admin or non-onwer address", async()=>{  
        let beneficiary = accounts[5];
        let tokenAmount = 200;
        let weiAmount = 100;
        await saleBase.registerPayment(
            beneficiary, 
            tokenAmount, 
            weiAmount, 
            Utils.txParams(beneficiary)
        ).should.be.rejected;
    });


    it("#12 should allow register payment from owner address", async() => {
        let beneficiary = accounts[5];
        let tokenAmount = 200;
        let weiAmount = 100;
        await saleBase.registerPayment(beneficiary, tokenAmount, weiAmount, Utils.txParams(OWNER));
        let buyersCount = (await saleBase.buyerCount()).toNumber();
        let buyerTokenBalance = await token.balanceOf(beneficiary);
        let weiRaised = await saleBase.weiRaised();

        buyersCount.should.be.equal(1);
        buyerTokenBalance.toNumber().should.be.equal(2*tokenAmount);
        weiRaised.toNumber().should.be.equal(2*weiAmount);
    });

    it("#13 should not allow register payment with zero value", async()=>{  
        let beneficiary = accounts[5];
        let tokenAmount = 200;
        let weiAmount = 0;
        await saleBase.registerPayment(
            beneficiary, 
            tokenAmount, 
            weiAmount, 
            Utils.txParams(OWNER)
        ).should.be.rejected;
    });

    it("#14 should not allow register payments from non-onwer or non-admin address", async()=>{  
        let beneficiaries = [accounts[5], accounts[6]];
        let tokenAmounts = [200, 100];
        let weiAmounts = [100, 50];
        await saleBase.registerPayments(
            beneficiaries, 
            tokenAmounts, 
            weiAmounts, 
            Utils.txParams(accounts[5])
        ).should.be.rejected;
    });
    
    it("#15 should allow register payments from owner or admin address", async()=>{  
        let beneficiaries = [accounts[5], accounts[6]];
        let tokenAmounts = [200, 100];
        let weiAmounts = [100, 50];
        let admin = await saleBase.admin();
        await saleBase.registerPayments(
            beneficiaries, 
            tokenAmounts, 
            weiAmounts, 
            Utils.txParams(admin)
        ).should.be.fulfilled;
        await saleBase.registerPayments(
            beneficiaries, 
            tokenAmounts, 
            weiAmounts, 
            Utils.txParams(OWNER)
        ).should.be.fulfilled;
    });

    it("#16 should have correct buyers amount of tokens & wei", async()=>{
        let buyers = [accounts[5], accounts[6]];
        let tokenAmounts = [400, 200];
        let weiAmounts = [200, 100];
        let expectedWeiRaised = weiAmounts[0] + weiAmounts[1] + 200;
        let expectedTokensSold = tokenAmounts[0] + tokenAmounts[1] + 400;
        let expectedBuyersBalances = [
            tokenAmounts[0] + 400,
            tokenAmounts[1]
        ];
        
        let actualWeiRaised = await saleBase.weiRaised();
        let actualTokenSold = await saleBase.tokensSold();
        let actualBuyersBalances = [
            await token.balanceOf(buyers[0]),
            await token.balanceOf(buyers[1]),
        ];
        actualWeiRaised.toNumber().should.be.equal(expectedWeiRaised);
        actualTokenSold.toNumber().should.be.equal(expectedTokensSold);
        actualBuyersBalances[0].toNumber().should.be.equal(expectedBuyersBalances[0]);
        actualBuyersBalances[1].toNumber().should.be.equal(expectedBuyersBalances[1]);
    });
    
});