"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YieldMath = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
// Set default BigNumber precision to 18 decimals and round down for financial safety
bignumber_js_1.default.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: bignumber_js_1.default.ROUND_DOWN });
class YieldMath {
    static SECONDS_PER_YEAR = new bignumber_js_1.default(31536000); // 365 days in seconds
    /**
     * Convert underlying asset amount to vault share count.
     * If totalAssets or totalSupply is 0, shares = assetAmount (1:1 base).
     * Formula: floor((assets * totalShares) / totalAssets)
     */
    static convertToShares(assetAmount, totalAssets, totalSupply) {
        if (assetAmount <= 0n)
            return 0n;
        if (totalAssets <= 0n || totalSupply <= 0n) {
            return assetAmount;
        }
        const assetsBN = new bignumber_js_1.default(assetAmount.toString());
        const totalAssetsBN = new bignumber_js_1.default(totalAssets.toString());
        const totalSupplyBN = new bignumber_js_1.default(totalSupply.toString());
        const sharesBN = assetsBN.times(totalSupplyBN).dividedToIntegerBy(totalAssetsBN);
        return BigInt(sharesBN.toFixed(0));
    }
    /**
     * Convert vault share count to underlying asset amount.
     * Formula: floor((shares * totalAssets) / totalShares)
     */
    static convertToAssets(shareAmount, totalAssets, totalSupply) {
        if (shareAmount <= 0n || totalSupply <= 0n)
            return 0n;
        if (totalAssets <= 0n)
            return 0n;
        const sharesBN = new bignumber_js_1.default(shareAmount.toString());
        const totalAssetsBN = new bignumber_js_1.default(totalAssets.toString());
        const totalSupplyBN = new bignumber_js_1.default(totalSupply.toString());
        const assetsBN = sharesBN.times(totalAssetsBN).dividedToIntegerBy(totalSupplyBN);
        return BigInt(assetsBN.toFixed(0));
    }
    /**
     * Calculate accrued yield over a time delta given an APY rate.
     * Linear simple interest formula: principal * APY * (dt / SECONDS_PER_YEAR)
     */
    static calculateLinearYield(principalAssets, apy, durationSeconds) {
        if (principalAssets <= 0n || apy <= 0 || durationSeconds <= 0)
            return 0n;
        const principalBN = new bignumber_js_1.default(principalAssets.toString());
        const apyBN = new bignumber_js_1.default(apy);
        const timeBN = new bignumber_js_1.default(durationSeconds);
        const yieldBN = principalBN
            .times(apyBN)
            .times(timeBN)
            .dividedToIntegerBy(this.SECONDS_PER_YEAR);
        return BigInt(yieldBN.toFixed(0));
    }
    /**
     * Calculate current price per share.
     * Standard 1.0 = 1 share equals 1 asset unit (scaled by decimal places e.g. 1e7 or 1e18)
     */
    static calculateSharePrice(totalAssets, totalSupply) {
        if (totalSupply <= 0n || totalAssets <= 0n)
            return 1.0;
        const totalAssetsBN = new bignumber_js_1.default(totalAssets.toString());
        const totalSupplyBN = new bignumber_js_1.default(totalSupply.toString());
        return totalAssetsBN.dividedBy(totalSupplyBN).toNumber();
    }
}
exports.YieldMath = YieldMath;
