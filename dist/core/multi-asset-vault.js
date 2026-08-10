"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiAssetVaultEngine = void 0;
class MultiAssetVaultEngine {
    allocations = [];
    constructor(allocations) {
        this.setAllocations(allocations);
    }
    setAllocations(allocations) {
        const totalWeight = allocations.reduce((sum, item) => sum + item.targetWeight, 0);
        if (Math.abs(totalWeight - 1.0) > 0.001) {
            throw new Error(`Target allocation weights must sum to 1.0 (100%). Given sum: ${totalWeight.toFixed(4)}`);
        }
        this.allocations = allocations;
    }
    /**
     * Calculate total portfolio valuation across all underlying asset adapters
     */
    async calculateTotalPortfolioUsd(vaultAddress) {
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
    async evaluateRebalance(vaultAddress) {
        const totalPortfolioUsd = await this.calculateTotalPortfolioUsd(vaultAddress);
        const recommendations = [];
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
            let action = 'HOLD';
            if (adjustmentUsd > 1.0) {
                action = 'BUY';
            }
            else if (adjustmentUsd < -1.0) {
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
exports.MultiAssetVaultEngine = MultiAssetVaultEngine;
