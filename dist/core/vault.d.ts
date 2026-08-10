import { DepositResult, IAssetAdapter, IComplianceHook, VaultConfig, VaultState, WithdrawResult } from '../types';
export declare class RWAStandardVault {
    config: VaultConfig;
    private assetAdapter;
    private complianceHooks;
    private _totalAssets;
    private _totalSupply;
    private _userShares;
    private _lastYieldAccrual;
    private _currentApy;
    constructor(config: VaultConfig, assetAdapter: IAssetAdapter);
    /**
     * Register a compliance hook to validate deposit/withdraw actions
     */
    addComplianceHook(hook: IComplianceHook): void;
    /**
     * Remove all compliance hooks
     */
    clearComplianceHooks(): void;
    /**
     * Set new APY yield rate
     */
    setApy(newApy: number): void;
    /**
     * Trigger yield accrual based on elapsed time
     */
    accrueYield(currentTimestampSeconds?: number): bigint;
    /**
     * Deposit underlying assets into the vault and receive minted vault shares
     */
    deposit(depositor: string, amount: bigint, timestamp?: number): Promise<DepositResult>;
    /**
     * Redeem vault shares for underlying assets
     */
    withdraw(withdrawer: string, shares: bigint, timestamp?: number): Promise<WithdrawResult>;
    /**
     * Get user share balance
     */
    getUserShares(userAddress: string): bigint;
    /**
     * Get total assets in vault
     */
    totalAssets(): bigint;
    /**
     * Get total shares minted
     */
    totalSupply(): bigint;
    /**
     * Convert amount to shares
     */
    convertToShares(assets: bigint): bigint;
    /**
     * Convert shares to underlying asset value
     */
    convertToAssets(shares: bigint): bigint;
    /**
     * Get the remaining deposit capacity before the vault's configured
     * maxTotalAssets cap is reached. Returns null if the vault is uncapped.
     */
    remainingDepositCapacity(): bigint | null;
    /**
     * Get current vault state summary
     */
    getState(): VaultState;
}
