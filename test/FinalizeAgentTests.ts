
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
    const WEI_MAX_GOAL = new BigNumber(ETHER_MAX_GOAL * 10**18);
    const WEI_MIN_GOAL = 0;
    const WEI_MIN_AMOUNT = 1;
    const OWNER = accounts[0];
    const WALLET = accounts[1];
    const ADMIN = accounts[5];

    const deployingParams = Utils.txParams(accounts[0])

    const RATES =  [3, 2, 1];
    const LIMITS = [1000, 2000, 3000];

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
    let START_TIME: number;

    before(async () => {
        token = await PlayHallToken.New(deployingParams);
        await token.activate(W3.TC.txParamsDefaultDeploy(OWNER))
        pricingStrategy = await SalePricingStrategy.New(deployingParams, {
            _rates: RATES,
            _limits: LIMITS
        });

        START_TIME = await Utils.getLastBlockTime() + 20*DAY;
        const END_TIME = START_TIME + 10*DAY;

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
            _weiRaised: 0,
            _tokensSold: 0
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
        const now = await Utils.getLastBlockTime();
        await Utils.increaseTime(START_TIME - now + DAY, OWNER);
        const weiValue = 1000;
        const tokensValue = await pricingStrategy.calculateTokenAmount(weiValue, 0, Utils.txParams(OWNER));
        console.log(tokensValue.toNumber())
        const value = Math.floor(tokensValue.toNumber() * FUNDS_PERCENT / 60) ;
        const expectedTeamFundBalance = Math.floor(value * TEAM_PERCENT / 100) ;
        const expectedBountyFundBalance = Math.floor(value * BOUNTY_PERCENT / 100) ;
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

    it("should not allow buy after crowdsale is finalized", async () => {
        await sale.sendTransaction(Utils.txParams(accounts[3], 200)).should.be.rejected;
    });
});