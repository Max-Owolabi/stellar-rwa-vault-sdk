import { IAssetAdapter } from '../types';
import BigNumber from 'bignumber.js';

export interface AssetAllocation {
  adapter: IAssetAdapter;
  targetWeight: number; // e.g. 0.5 for 50%
}

export interface RebalanceRecommendation {
  assetCode: string;
  currentWeight: number;
  targetWeight: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  adjustmentUsd: number;
}

export class MultiAssetVaultEngine {
  private allocations: AssetAllocation[] = [];

  constructor(allocations: AssetAllocation[]) {
    this.setAllocations(allocations);
  }

  public setAllocations(allocations: AssetAllocation[]): void {
    const totalWeight = allocations.reduce((sum, item) => sum + item.targetWeight, 0);
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error(`Target allocation weights must sum to 1.0 (100%). Given sum: ${totalWeight.toFixed(4)}`);
    }
    this.allocations = allocations;
  }

  /**
   * Calculate total portfolio valuation across all underlying asset adapters
   */
  public async calculateTotalPortfolioUsd(vaultAddress: string): Promise<number> {
    let totalUsd = 0;
    for (const alloc of this.allocations) {
      const balance = await alloc.adapter.getBalance(vaultAddress);
      const balanceNum = Number(balance) / Math.pow(10, alloc.adapter.decimals);
      totalUsd += balanceNum;
    }
    return totalUsd;
  }

  /**
   * Evaluate portfolio weight drift and generate rebalance recommendations
   */
  public async evaluateRebalance(vaultAddress: string): Promise<RebalanceRecommendation[]> {
    const totalPortfolioUsd = await this.calculateTotalPortfolioUsd(vaultAddress);
    const recommendations: RebalanceRecommendation[] = [];

    if (totalPortfolioUsd <= 0) {
      return this.allocations.map(a => ({
        assetCode: a.adapter.assetCode,
        currentWeight: 0,
        targetWeight: a.targetWeight,
        action: 'HOLD',
        adjustmentUsd: 0
      }));
    }

    for (const alloc of this.allocations) {
      const balance = await alloc.adapter.getBalance(vaultAddress);
      const currentUsd = Number(balance) / Math.pow(10, alloc.adapter.decimals);
      const currentWeight = currentUsd / totalPortfolioUsd;
      const targetUsd = totalPortfolioUsd * alloc.targetWeight;
      const adjustmentUsd = targetUsd - currentUsd;

      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
      if (adjustmentUsd > 1.0) {
        action = 'BUY';
      } else if (adjustmentUsd < -1.0) {
        action = 'SELL';
      }

      recommendations.push({
        assetCode: alloc.adapter.assetCode,
        currentWeight,
        targetWeight: alloc.targetWeight,
        action,
        adjustmentUsd
      });
    }

    return recommendations;
  }
}
