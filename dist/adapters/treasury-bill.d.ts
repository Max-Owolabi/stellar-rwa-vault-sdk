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
    constructor(assetCode?: string, issuer?: string, initialNav?: number, decimals?: number);
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
