
import { BigNumber } from 'bignumber.js';
import * as chai from 'chai';
import { PlayHallToken } from '../types';
import { Sale } from '../types';
import { SalePricingStrategy } from '../types';
import { FinalizeAgent } from '../types';
import { Utils } from './Utils';

import { W3 } from 'soltsice';

chai.use(require('chai-bignumber')());
chai.use(require('chai-as-promised'));
chai.should();

W3.Default = new W3();

contract('Sale', (accounts) => {

    const DAY = 60*60*24;
    const ETHER_MAX_GOAL = 5;
    const RATE = new BigNumber(Math.round((1 / 12000) * 10**18));
    const WEI_MAX_GOAL = new BigNumber(ETHER_MAX_GOAL * 10**18);
    const WEI_MIN_GOAL = 0;
    const WEI_MIN_AMOUNT = 1;
    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const BUYERS = [accounts[2], accounts[3]]; 
    const ADMIN = accounts[5];
    const WEI_RAISED = 5;
    const TOKENS_SOLD = 10;

    const deployingParams = {
        from : accounts[0],
        gas: 10000000,
        gasPrice: 10000000000,
        value: 0
    }

    const RATES =  [3, 2, 1];
    const LIMITS = [1000, 2000, 3000];

    const TEAM_FUND = accounts[9];
    const BOUNTY_FUND = accounts[8];
    const RESERVE_FUND = accounts[7];    
    const FUNDS_PERCENT = 40;

    const TEAM_PERCENT = 35;
    const BOUNTY_PERCENT = 15;
    const RESERVE_PERCENT = 50;

    let START_TIME: number;
    let END_TIME: number;

    let sale: Sale;
    let token: PlayHallToken;
    let pricingStrategy: SalePricingStrategy;
    let finalizeAgent: FinalizeAgent;

    before(async()=>{
        token = await PlayHallToken.New(W3.TC.txParamsDefaultDeploy(OWNER))
        await token.activate(W3.TC.txParamsDefaultDeploy(OWNER))

        pricingStrategy = await SalePricingStrategy.New(deployingParams, {
            _rates: RATES,
            _limits: LIMITS
        });

        START_TIME = await Utils.getLastBlockTime() + 30*DAY;
        END_TIME = START_TIME + 10*DAY;
        sale = await Sale.New(deployingParams, {
            _startTime: START_TIME,
            _endTime: END_TIME,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL,
            _weiMinimumAmount: WEI_MIN_AMOUNT,
            _admin: ADMIN,
            _weiRaised: WEI_RAISED,
            _tokensSold: TOKENS_SOLD
        });

        finalizeAgent = await FinalizeAgent.New(deployingParams, {
            _token: token.address,
            _crowdsale: sale.address,
            _teamPercent: TEAM_PERCENT,
            _bountyPercent: BOUNTY_PERCENT,
            _reservePercent: RESERVE_PERCENT,
            _teamFund: TEAM_FUND,
            _bountyFund: BOUNTY_FUND,
            _reserveFund: RESERVE_FUND
        });
        
        await token.setMinter(sale.address, Utils.txParams(OWNER));
        await sale.setFinalizeAgent(finalizeAgent.address, Utils.txParams(OWNER));
    })

    it("#1 should have correct parameters", async () => {
        const startTime = await sale.startTime();
        const endTime = await sale.endTime();
        const wallet = await sale.wallet();
        const weiRaised = await sale.weiRaised();
        const tokensSold = await sale.tokensSold();

        startTime.toNumber().should.equal(START_TIME);
        endTime.toNumber().should.equal(END_TIME);
        wallet.should.equal(WALLET);
        weiRaised.toNumber().should.equal(WEI_RAISED);
        tokensSold.toNumber().should.equal(TOKENS_SOLD);
    });

    it("#2 should stop token minting after finalize crowdsale", async() => {
        let now = await Utils.getLastBlockTime();
        await Utils.increaseTime(START_TIME - now + 30, OWNER);
        await sale.sendTransaction(Utils.txParams(accounts[2], 200));
        await sale.finalize(Utils.txParams(OWNER));
        await sale.sendTransaction(Utils.txParams(accounts[2], 200)).should.be.rejected;
    });

});