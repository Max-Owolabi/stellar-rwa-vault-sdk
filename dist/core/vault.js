"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RWAStandardVault = void 0;
const yield_1 = require("../math/yield");
const validation_1 = require("../utils/validation");
class RWAStandardVault {
    config;
    assetAdapter;
    complianceHooks = [];
    _totalAssets = 0n;
    _totalSupply = 0n;
    _userShares = new Map();
    _lastYieldAccrual;
    _currentApy;
    constructor(config, assetAdapter) {
        validation_1.VaultConfigSchema.parse(config);
        this.config = config;
        this.assetAdapter = assetAdapter;
        this._currentApy = config.initialApy;
        this._lastYieldAccrual = Math.floor(Date.now() / 1000);
    }
    /**
     * Register a compliance hook to validate deposit/withdraw actions
     */
    addComplianceHook(hook) {
        this.complianceHooks.push(hook);
    }
    /**
     * Remove all compliance hooks
     */
    clearComplianceHooks() {
        this.complianceHooks = [];
    }
    /**
     * Set new APY yield rate
     */
    setApy(newApy) {
        if (newApy < 0 || newApy > 1.0) {
            throw new Error('APY rate must be between 0 and 1.0 (100%)');
        }
        this.accrueYield();
        this._currentApy = newApy;
    }
    /**
     * Trigger yield accrual based on elapsed time
     */
    accrueYield(currentTimestampSeconds = Math.floor(Date.now() / 1000)) {
        const timeDelta = currentTimestampSeconds - this._lastYieldAccrual;
        if (timeDelta <= 0 || this._totalAssets <= 0n) {
            this._lastYieldAccrual = currentTimestampSeconds;
            return 0n;
        }
        const accruedYield = yield_1.YieldMath.calculateLinearYield(this._totalAssets, this._currentApy, timeDelta);
        if (accruedYield > 0n) {
            this._totalAssets += accruedYield;
        }
        this._lastYieldAccrual = currentTimestampSeconds;
        return accruedYield;
    }
    /**
     * Deposit underlying assets into the vault and receive minted vault shares
     */
    async deposit(depositor, amount, timestamp = Math.floor(Date.now() / 1000)) {
        (0, validation_1.validateStellarAddress)(depositor);
        (0, validation_1.validatePositiveAmount)(amount);
        // 1. Accrue outstanding yield prior to share conversion
        this.accrueYield(timestamp);
        // 2. Execute compliance hook checks
        const depositContext = {
            depositor,
            amount,
            assetCode: this.config.assetCode,
            timestamp
        };
        for (const hook of this.complianceHooks) {
            const result = await hook.validateDeposit(depositContext);
            if (!result.allowed) {
                return {
                    sharesMinted: 0n,
                    assetsDeposited: 0n,
                    depositor,
                    timestamp,
                    status: 'REJECTED',
                    rejectionReason: result.reason ?? 'Deposit rejected by compliance policy'
                };
            }
        }
        // 3. Calculate shares to mint
        const sharesToMint = yield_1.YieldMath.convertToShares(amount, this._totalAssets, this._totalSupply);
        if (sharesToMint <= 0n) {
            return {
                sharesMinted: 0n,
                assetsDeposited: 0n,
                depositor,
                timestamp,
                status: 'REJECTED',
                rejectionReason: 'Calculated shares to mint is zero due to precision rounding'
            };
        }
        // 4. Transfer underlying asset from depositor to vault
        await this.assetAdapter.transfer(depositor, this.config.vaultAddress, amount);
        // 5. Update vault state
        this._totalAssets += amount;
        this._totalSupply += sharesToMint;
        const currentBalance = this._userShares.get(depositor) ?? 0n;
        this._userShares.set(depositor, currentBalance + sharesToMint);
        return {
            sharesMinted: sharesToMint,
            assetsDeposited: amount,
            depositor,
            timestamp,
            status: 'SUCCESS'
        };
    }
    /**
     * Redeem vault shares for underlying assets
     */
    async withdraw(withdrawer, shares, timestamp = Math.floor(Date.now() / 1000)) {
        (0, validation_1.validateStellarAddress)(withdrawer);
        (0, validation_1.validatePositiveAmount)(shares);
        // 1. Accrue yield first
        this.accrueYield(timestamp);
        // 2. Verify user has enough shares
        const userShares = this._userShares.get(withdrawer) ?? 0n;
        if (userShares < shares) {
            return {
                sharesBurned: 0n,
                assetsReturned: 0n,
                withdrawer,
                timestamp,
                status: 'REJECTED',
                rejectionReason: `Insufficient shares. User has ${userShares}, requested ${shares}`
            };
        }
        // 3. Calculate asset return amount
        const assetsToReturn = yield_1.YieldMath.convertToAssets(shares, this._totalAssets, this._totalSupply);
        // 4. Compliance hooks
        const withdrawContext = {
            withdrawer,
            shares,
            expectedAssets: assetsToReturn,
            assetCode: this.config.assetCode,
            timestamp
        };
        for (const hook of this.complianceHooks) {
            const result = await hook.validateWithdraw(withdrawContext);
            if (!result.allowed) {
                return {
                    sharesBurned: 0n,
                    assetsReturned: 0n,
                    withdrawer,
                    timestamp,
                    status: 'REJECTED',
                    rejectionReason: result.reason ?? 'Withdrawal rejected by compliance policy'
                };
            }
        }
        // 5. Transfer assets back to withdrawer
        await this.assetAdapter.transfer(this.config.vaultAddress, withdrawer, assetsToReturn);
        // 6. Update state
        this._totalAssets -= assetsToReturn;
        this._totalSupply -= shares;
        this._userShares.set(withdrawer, userShares - shares);
        return {
            sharesBurned: shares,
            assetsReturned: assetsToReturn,
            withdrawer,
            timestamp,
            status: 'SUCCESS'
        };
    }
    /**
     * Get user share balance
     */
    getUserShares(userAddress) {
        return this._userShares.get(userAddress) ?? 0n;
    }
    /**
     * Get total assets in vault
     */
    totalAssets() {
        return this._totalAssets;
    }
    /**
     * Get total shares minted
     */
    totalSupply() {
        return this._totalSupply;
    }
    /**
     * Convert amount to shares
     */
    convertToShares(assets) {
        return yield_1.YieldMath.convertToShares(assets, this._totalAssets, this._totalSupply);
    }
    /**
     * Convert shares to underlying asset value
     */
    convertToAssets(shares) {
        return yield_1.YieldMath.convertToAssets(shares, this._totalAssets, this._totalSupply);
    }
    /**
     * Get current vault state summary
     */
    getState() {
        return {
            totalAssets: this._totalAssets,
            totalSupply: this._totalSupply,
            sharePrice: yield_1.YieldMath.calculateSharePrice(this._totalAssets, this._totalSupply),
            lastYieldAccrual: this._lastYieldAccrual,
            currentApy: this._currentApy
        };
    }
}
exports.RWAStandardVault = RWAStandardVault;
