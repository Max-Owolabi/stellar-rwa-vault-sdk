"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryBillAdapter = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
class TreasuryBillAdapter {
    assetCode;
    issuer;
    decimals;
    oracleFeed;
    balances = new Map();
    constructor(assetCode = 'USDY', issuer = 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M', initialNav = 1.0, decimals = 7) {
        this.assetCode = assetCode;
        this.issuer = issuer;
        this.decimals = decimals;
        this.oracleFeed = {
            symbol: assetCode,
            navPriceUsd: initialNav,
            lastUpdated: Math.floor(Date.now() / 1000)
        };
    }
    /**
     * Update the off-chain oracle NAV price feed
     */
    updateOracleNav(newPriceUsd, timestamp = Math.floor(Date.now() / 1000)) {
        if (newPriceUsd <= 0) {
            throw new Error('NAV price must be greater than zero');
        }
        this.oracleFeed = {
            symbol: this.assetCode,
            navPriceUsd: newPriceUsd,
            lastUpdated: timestamp
        };
    }
    /**
     * Get current NAV feed status
     */
    getOracleNav() {
        return { ...this.oracleFeed };
    }
    /**
     * Calculate USD value of raw token balance based on NAV oracle
     */
    getUsdValue(tokenAmount) {
        if (tokenAmount <= 0n)
            return 0n;
        const amountBN = new bignumber_js_1.default(tokenAmount.toString());
        const navBN = new bignumber_js_1.default(this.oracleFeed.navPriceUsd);
        const usdValBN = amountBN.times(navBN).dividedToIntegerBy(1);
        return BigInt(usdValBN.toFixed(0));
    }
    setMockBalance(address, amount) {
        this.balances.set(address, amount);
    }
    async getBalance(address) {
        return this.balances.get(address) ?? 0n;
    }
    async transfer(from, to, amount) {
        if (amount <= 0n)
            return false;
        const senderBalance = await this.getBalance(from);
        if (senderBalance < amount) {
            throw new Error(`Insufficient T-Bill asset balance. Account ${from} has ${senderBalance}, requested ${amount}`);
        }
        const recipientBalance = await this.getBalance(to);
        this.balances.set(from, senderBalance - amount);
        this.balances.set(to, recipientBalance + amount);
        return true;
    }
}
exports.TreasuryBillAdapter = TreasuryBillAdapter;
