import { IAssetAdapter } from '../types';
export interface AssetAllocation {
    adapter: IAssetAdapter;
    targetWeight: number;
}
export interface RebalanceRecommendation {
    assetCode: string;
    currentWeight: number;
    targetWeight: number;
    action: 'BUY' | 'SELL' | 'HOLD';
    adjustmentUsd: number;
}
export declare class MultiAssetVaultEngine {
    private allocations;
    constructor(allocations: AssetAllocation[]);
    setAllocations(allocations: AssetAllocation[]): void;
    /**
     * Calculate total portfolio valuation across all underlying asset adapters
     */
    calculateTotalPortfolioUsd(vaultAddress: string): Promise<number>;
    /**
     * Evaluate portfolio weight drift and generate rebalance recommendations
     */
    evaluateRebalance(vaultAddress: string): Promise<RebalanceRecommendation[]>;
}
