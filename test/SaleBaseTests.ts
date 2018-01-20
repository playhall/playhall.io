
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
    const INVESTORS = [accounts[2], accounts[3]]; 
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
        const phToken = await PlayHallToken.New(deployingParams);
        const pricingStrategy = await PresalePricingStrategy.New(deployingParams, {
            _rate: RATE
        });
        const now = await Utils.getLastBlockTime();
        const presale = await SaleBase.New(deployingParams, {
            _startTime: now + deltaStart,
            _endTime: now + deltaEnd,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL
        })
        
        return presale;
    }

    before(async()=>{
        START_TIME = await Utils.getLastBlockTime() + 40*DAY;
        END_TIME = START_TIME + 10*DAY;
                
        token = await PlayHallToken.New(deployingParams);

        pricingStrategy = await PresalePricingStrategy.New(deployingParams, {
            _rate: RATE
        });

        saleBase = await SaleBase.New(deployingParams, {
            _startTime: START_TIME,
            _endTime: END_TIME,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL
        });
        
        await token.transferOwnership(saleBase.address, Utils.txParams(OWNER, 0));
    })

    it("#1 should have correct parameters", async () => {
        const startTime = await saleBase.startTime();
        const endTime = await saleBase.endTime();
        const wallet = await saleBase.wallet();

        startTime.toNumber().should.equal(START_TIME);
        endTime.toNumber().should.equal(END_TIME);
        wallet.should.equal(WALLET);
    });

    it('#2 should set owner correctly', async () => {
        const res = await saleBase.owner();
        res.should.equal(OWNER);
    });

    it('#3 should not allow to invest before start', async () => {
        return saleBase.sendTransaction(Utils.txParams(INVESTORS[0], 1))
            .should.be.rejected;
    });

    it('#4 should allow all investors to invest after start', async () => {
        const now = await Utils.getLastBlockTime();
        const startTime = (await saleBase.startTime()).toNumber();
        Utils.increaseTime(startTime - now + 30);

        const value = 500;
        const balance1 = new BigNumber(await W3.Default.eth.getBalance(WALLET));

        await saleBase.sendTransaction(Utils.txParams(INVESTORS[1], value));
        
        const tokens = new BigNumber(await token.balanceOf(INVESTORS[1]));
        const balance2 = new BigNumber(await W3.Default.eth.getBalance(WALLET));

        tokens.toNumber().should.equal(RATE.mul(value).toNumber());
        balance2.toNumber().should.equal(balance1.plus(value).toNumber());
    });

    it('#5 should not allow to invest more then hard cap', async () => {
        const weiCap = await saleBase.weiMaximumGoal();
        const weiRaised = await saleBase.weiRaised();
        await saleBase.sendTransaction(Utils.txParams(accounts[2], weiCap.minus(weiRaised)));
        return saleBase.sendTransaction(Utils.txParams(accounts[2], 1)).should.be.rejected;
    });

    it('#6 should now allow to invest after endTime', async () => {
        saleBase = await deploySaleBase(10,11);
        const now = await Utils.getLastBlockTime();
        const endTime = (await saleBase.endTime()).toNumber();
        Utils.increaseTime(endTime - now + 30);

        return saleBase.sendTransaction(Utils.txParams(accounts[2], 1))
            .should.be.rejected;
    });


});