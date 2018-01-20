
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

contract('FinalizeAgent', (accounts) => {

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
    const WEI = 7;

    const TEAM_FUND = accounts[9];
    const BOUNTY_FUND = accounts[8];
    const RESERVE_FUND = accounts[7];    
    const FUNDS_PERCENT = 40;

    const TEAM_PERCENT = 35;
    const BOUNTY_PERCENT = 15;
    const RESERVE_PERCENT = 50;

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

    before(async () => {
        const START_TIME = await Utils.getLastBlockTime() + 1*DAY;
        const END_TIME = START_TIME + 10*DAY;
                
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
    })

    it("#1 should have correct parameters", async () => {
        let teamFund = await finalizeAgent.teamFund();
        let bountyFund = await finalizeAgent.bountyFund();
        let reserveFund = await finalizeAgent.reserveFund();
        
        let teamPercent = await finalizeAgent.teamPercent();
        let bountyPercent = await finalizeAgent.bountyPercent();
        let reservePercent = await finalizeAgent.reservePercent();
        
        teamFund.should.be.equal(TEAM_FUND);
        bountyFund.should.be.equal(BOUNTY_FUND);
        reserveFund.should.be.equal(RESERVE_FUND);

        teamPercent.toNumber().should.be.equal(TEAM_PERCENT);
        bountyPercent.toNumber().should.be.equal(BOUNTY_PERCENT);
        reservePercent.toNumber().should.be.equal(RESERVE_PERCENT);
    });

    it("#2 should not allow to set finalizeAgent from non-owner account", async () => {
        await sale.setFinalizeAgent(finalizeAgent.address, Utils.txParams(accounts[1]))
            .should.be.rejected
    });

    it("#3 should not allow to set invalid finalizeAgent", async () => {
        await sale.setFinalizeAgent(accounts[1], Utils.txParams(OWNER))
            .should.be.rejected;
    });

    it("#4 should allow to set finilizeAgent", async () => {
        await sale.setFinalizeAgent(finalizeAgent.address, Utils.txParams(OWNER));
        let agentAddress = await sale.finalizeAgent();
        agentAddress.should.be.equal(finalizeAgent.address);
    });

    it("#5 should not allow to finalize crowdsale from non-sale account", async () => {
        await finalizeAgent.finalizeCrowdsale(Utils.txParams(OWNER))
            .should.be.rejected;
    });

    it("#6 should successfully finalize crowdsale", async () => {
        await Utils.increaseTime(1*DAY);
        const weiValue = 1000;
        const tokensValue = await pricingStrategy.calculateTokenAmount(weiValue, 0, Utils.txParams(OWNER));
        const value = Math.round(tokensValue.toNumber() / 60) * FUNDS_PERCENT;
        const expectedTeamFundBalance = Math.round(value / 100) * TEAM_PERCENT;
        const expectedBountyFundBalance = Math.round(value / 100) * BOUNTY_PERCENT;
        const expectedReserveFundBalance = value - (expectedTeamFundBalance + expectedBountyFundBalance);
        
        await sale.sendTransaction(Utils.txParams(accounts[1], weiValue));

        await sale.finalize(Utils.txParams(OWNER));
        
        let teamFundBalance = await token.balanceOf(TEAM_FUND);
        let bountyFundBalance = await token.balanceOf(BOUNTY_FUND);
        let reserveFundBalance = await token.balanceOf(RESERVE_FUND);
        teamFundBalance.toNumber().should.be.equal(expectedTeamFundBalance);
        bountyFundBalance.toNumber().should.be.equal(expectedBountyFundBalance);
        reserveFundBalance.toNumber().should.be.equal(expectedReserveFundBalance);
    });

    it("should not allow invest after crowdsale is finalized", async () => {
        await sale.sendTransaction(Utils.txParams(accounts[3], 200)).should.be.rejected;
    });
});