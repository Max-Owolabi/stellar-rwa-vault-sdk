export declare class YieldMath {
    private static SECONDS_PER_YEAR;
    /**
     * Convert underlying asset amount to vault share count.
     * If totalAssets or totalSupply is 0, shares = assetAmount (1:1 base).
     * Formula: floor((assets * totalShares) / totalAssets)
     */
    static convertToShares(assetAmount: bigint, totalAssets: bigint, totalSupply: bigint): bigint;
    /**
     * Convert vault share count to underlying asset amount.
     * Formula: floor((shares * totalAssets) / totalShares)
     */
    static convertToAssets(shareAmount: bigint, totalAssets: bigint, totalSupply: bigint): bigint;
    /**
     * Calculate accrued yield over a time delta given an APY rate.
     * Linear simple interest formula: principal * APY * (dt / SECONDS_PER_YEAR)
     */
    static calculateLinearYield(principalAssets: bigint, apy: number, durationSeconds: number): bigint;
    /**
     * Calculate current price per share safely preventing NaN or division by zero.
     * Standard 1.0 = 1 share equals 1 asset unit
     */
    static calculateSharePrice(totalAssets: bigint, totalSupply: bigint): number;
    /**
     * Safe zero-checking math wrapper for share price division (Issue #7)
     */
    static safeSharePriceDivision(totalAssets: bigint, totalSupply: bigint): number;
    /**
     * Calculate compounded yield over arbitrary time intervals (Issue #6)
     * Formula: Principal * ((1 + APY / n) ^ (n * t)) - Principal
     */
    static calculateCompoundedYield(principalAssets: bigint, apy: number, durationSeconds: number, compoundingFrequencyPerYear?: number): bigint;
}
