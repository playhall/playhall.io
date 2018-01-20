
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
    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const INVESTORS = [accounts[2], accounts[3]]; 

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

    let START_TIME, END_TIME: number;

    let sale: Sale;
    let token: PlayHallToken;
    let pricingStrategy: SalePricingStrategy;
    let finalizeAgent: FinalizeAgent;

    let deploySale = async (deltaStart, duration) => {
        const now = await Utils.getLastBlockTime();
        const startTime = now + deltaStart;
        const phToken = await PlayHallToken.New(deployingParams);
        const strategy = await SalePricingStrategy.New(deployingParams, {
            _rates: RATES,
            _limits: LIMITS
        });
        const phSale = await Sale.New(deployingParams, {
            _startTime: startTime,
            _endTime: startTime + duration,
            _pricingStrategy: strategy.address,
            _token: phToken.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL,
            _fundsPercent: FUNDS_PERCENT
        });
        const agent = await FinalizeAgent.New(deployingParams, {
            _token: phToken.address,
            _crowdsale: phSale.address,
            _teamPercent: TEAM_PERCENT,
            _bountyPercent: BOUNTY_PERCENT,
            _reservePercent: RESERVE_PERCENT,
            _teamFund: TEAM_FUND,
            _bountyFund: BOUNTY_FUND,
            _reserveFund: RESERVE_FUND
        });
        await phSale.setFinalizeAgent(agent.address, Utils.txParams(OWNER));
        return phSale;
    }

    before(async()=>{
        START_TIME = await Utils.getLastBlockTime() + 30*DAY;
        END_TIME = START_TIME + 10*DAY;
                
        token = await PlayHallToken.New(deployingParams);

        pricingStrategy = await SalePricingStrategy.New(deployingParams, {
            _rates: RATES,
            _limits: LIMITS
        });

        sale = await Sale.New(deployingParams, {
            _startTime: START_TIME,
            _endTime: END_TIME,
            _pricingStrategy: pricingStrategy.address,
            _token: token.address,
            _wallet: WALLET,
            _weiMaximumGoal: WEI_MAX_GOAL,
            _weiMinimumGoal: WEI_MIN_GOAL,
            _fundsPercent: FUNDS_PERCENT
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
        
        await token.transferOwnership(sale.address, Utils.txParams(OWNER, 0));
        await sale.setFinalizeAgent(finalizeAgent.address, Utils.txParams(OWNER));
    })

    it("#1 should have correct parameters", async () => {
        const startTime = await sale.startTime();
        const endTime = await sale.endTime();
        const wallet = await sale.wallet();

        startTime.toNumber().should.equal(START_TIME);
        endTime.toNumber().should.equal(END_TIME);
        wallet.should.equal(WALLET);
    });

    it("#2 should stop token minting after finalize crowdsale", async() => {
        let now = await Utils.getLastBlockTime();
        Utils.increaseTime(START_TIME - now + 30);
        await sale.sendTransaction(Utils.txParams(accounts[2], 200));
        await sale.finalize(Utils.txParams(OWNER));
        await sale.sendTransaction(Utils.txParams(accounts[2], 200)).should.be.rejected;
    });

});