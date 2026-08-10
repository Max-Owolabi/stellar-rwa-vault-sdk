"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreasuryBillAdapter = void 0;
const errors_1 = require("../errors");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const SECONDS_PER_DAY = 86400;
class TreasuryBillAdapter {
    assetCode;
    issuer;
    decimals;
    oracleFeed;
    balances = new Map();
    maturityTimestamp = null;
    constructor(assetCode = 'USDY', issuer = 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M', initialNav = 1.0, decimals = 7, maturityDate) {
        this.assetCode = assetCode;
        this.issuer = issuer;
        this.decimals = decimals;
        this.oracleFeed = {
            symbol: assetCode,
            navPriceUsd: initialNav,
            lastUpdated: Math.floor(Date.now() / 1000)
        };
        if (maturityDate !== undefined) {
            this.setMaturityDate(maturityDate);
        }
    }
    /**
     * Set (or update) the T-Bill bond maturity date.
     * Accepts a Date object or a Unix timestamp in seconds (Issue #61).
     */
    setMaturityDate(maturityDate) {
        const timestamp = maturityDate instanceof Date ? Math.floor(maturityDate.getTime() / 1000) : maturityDate;
        if (!Number.isFinite(timestamp) || timestamp <= 0) {
            throw new errors_1.AssetAdapterError('Maturity date must resolve to a valid positive timestamp');
        }
        this.maturityTimestamp = timestamp;
    }
    /**
     * Get the configured maturity date as a Unix timestamp (seconds), or null if unset.
     */
    getMaturityDate() {
        return this.maturityTimestamp;
    }
    /**
     * Calculate the number of whole days remaining until bond maturity (Issue #61).
     * Returns 0 once the bond has matured (never negative).
     * Optionally accepts a reference timestamp (Unix seconds) for deterministic testing.
     */
    getDaysUntilMaturity(fromTimestampSeconds = Math.floor(Date.now() / 1000)) {
        if (this.maturityTimestamp === null) {
            throw new errors_1.AssetAdapterError('Maturity date has not been set for this T-Bill adapter');
        }
        const remainingSeconds = this.maturityTimestamp - fromTimestampSeconds;
        if (remainingSeconds <= 0)
            return 0;
        return Math.ceil(remainingSeconds / SECONDS_PER_DAY);
    }
    /**
     * Returns true if the bond has reached or passed its maturity date.
     */
    isMatured(fromTimestampSeconds = Math.floor(Date.now() / 1000)) {
        if (this.maturityTimestamp === null)
            return false;
        return fromTimestampSeconds >= this.maturityTimestamp;
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
