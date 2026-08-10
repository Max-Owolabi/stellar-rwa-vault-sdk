import { IAssetAdapter } from '../types';
export interface OracleNavFeed {
    symbol: string;
    navPriceUsd: number;
    lastUpdated: number;
}
export declare class TreasuryBillAdapter implements IAssetAdapter {
    assetCode: string;
    issuer: string;
    decimals: number;
    private oracleFeed;
    private balances;
    private maturityTimestamp;
    constructor(assetCode?: string, issuer?: string, initialNav?: number, decimals?: number, maturityDate?: Date | number);
    /**
     * Set (or update) the T-Bill bond maturity date.
     * Accepts a Date object or a Unix timestamp in seconds (Issue #61).
     */
    setMaturityDate(maturityDate: Date | number): void;
    /**
     * Get the configured maturity date as a Unix timestamp (seconds), or null if unset.
     */
    getMaturityDate(): number | null;
    /**
     * Calculate the number of whole days remaining until bond maturity (Issue #61).
     * Returns 0 once the bond has matured (never negative).
     * Optionally accepts a reference timestamp (Unix seconds) for deterministic testing.
     */
    getDaysUntilMaturity(fromTimestampSeconds?: number): number;
    /**
     * Returns true if the bond has reached or passed its maturity date.
     */
    isMatured(fromTimestampSeconds?: number): boolean;
    /**
     * Update the off-chain oracle NAV price feed
     */
    updateOracleNav(newPriceUsd: number, timestamp?: number): void;
    /**
     * Get current NAV feed status
     */
    getOracleNav(): OracleNavFeed;
    /**
     * Calculate USD value of raw token balance based on NAV oracle
     */
    getUsdValue(tokenAmount: bigint): bigint;
    setMockBalance(address: string, amount: bigint): void;
    getBalance(address: string): Promise<bigint>;
    transfer(from: string, to: string, amount: bigint): Promise<boolean>;
}
