import {
  DepositResult,
  IAssetAdapter,
  IComplianceHook,
  VaultConfig,
  VaultState,
  WithdrawResult
} from '../types';
import { YieldMath } from '../math/yield';
import { validatePositiveAmount, validateStellarAddress, VaultConfigSchema } from '../utils/validation';

export interface VaultTransactionRecord {
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: bigint;
  timestamp: number;
}

export class RWAStandardVault {
  public config: VaultConfig;
  private assetAdapter: IAssetAdapter;
  private complianceHooks: IComplianceHook[] = [];

  private _totalAssets: bigint = 0n;
  private _totalSupply: bigint = 0n;
  private _userShares: Map<string, bigint> = new Map();
  private _lastYieldAccrual: number;
  private _currentApy: number;

  // New State Variables for Issues #46, #48, #62
  private _isPaused: boolean = false;
  private _maxDepositCap: bigint | null = null;
  private _txHistory: VaultTransactionRecord[] = [];

  constructor(config: VaultConfig, assetAdapter: IAssetAdapter) {
    VaultConfigSchema.parse(config);
    this.config = config;
    this.assetAdapter = assetAdapter;
    this._currentApy = config.initialApy;
    this._lastYieldAccrual = Math.floor(Date.now() / 1000);
  }

  /**
   * Pause vault deposit and withdraw transactions (Issue #46)
   */
  public pause(): void {
    this._isPaused = true;
  }

  /**
   * Unpause vault transactions (Issue #46)
   */
  public unpause(): void {
    this._isPaused = false;
  }

  /**
   * Check if vault is currently paused (Issue #46)
   */
  public isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Set global maximum deposit cap (Issue #62)
   */
  public setMaxDepositCap(cap: bigint | null): void {
    if (cap !== null && cap <= 0n) {
      throw new Error('Max deposit cap must be greater than zero or null');
    }
    this._maxDepositCap = cap;
  }

  /**
   * Get global maximum deposit cap (Issue #62)
   */
  public getMaxDepositCap(): bigint | null {
    return this._maxDepositCap;
  }

  /**
   * Get user share percentage relative to total supply (Issue #54)
   * e.g. 0.25 for 25% share ownership
   */
  public getUserSharePercentage(userAddress: string): number {
    if (this._totalSupply <= 0n) return 0;
    const userBalance = this.getUserShares(userAddress);
    if (userBalance <= 0n) return 0;

    return Number(userBalance) / Number(this._totalSupply);
  }

  /**
   * Get 24-hour aggregate deposit and withdrawal volume (Issue #48)
   */
  public getRolling24HourVolume(currentTimestamp: number = Math.floor(Date.now() / 1000)): {
    depositVolume: bigint;
    withdrawVolume: bigint;
  } {
    const cutoff = currentTimestamp - 86400;
    let depositVolume = 0n;
    let withdrawVolume = 0n;

    for (const tx of this._txHistory) {
      if (tx.timestamp >= cutoff) {
        if (tx.type === 'DEPOSIT') {
          depositVolume += tx.amount;
        } else if (tx.type === 'WITHDRAW') {
          withdrawVolume += tx.amount;
        }
      }
    }

    return { depositVolume, withdrawVolume };
  }

  /**
   * Register a compliance hook to validate deposit/withdraw actions
   */
  public addComplianceHook(hook: IComplianceHook): void {
    this.complianceHooks.push(hook);
  }

  /**
   * Remove all compliance hooks
   */
  public clearComplianceHooks(): void {
    this.complianceHooks = [];
  }

  /**
   * Set new APY yield rate
   */
  public setApy(newApy: number): void {
    if (newApy < 0 || newApy > 1.0) {
      throw new Error('APY rate must be between 0 and 1.0 (100%)');
    }
    this.accrueYield();
    this._currentApy = newApy;
  }

  /**
   * Trigger yield accrual based on elapsed time
   */
  public accrueYield(currentTimestampSeconds: number = Math.floor(Date.now() / 1000)): bigint {
    const timeDelta = currentTimestampSeconds - this._lastYieldAccrual;
    if (timeDelta <= 0 || this._totalAssets <= 0n) {
      this._lastYieldAccrual = currentTimestampSeconds;
      return 0n;
    }

    const accruedYield = YieldMath.calculateLinearYield(
      this._totalAssets,
      this._currentApy,
      timeDelta
    );

    if (accruedYield > 0n) {
      this._totalAssets += accruedYield;
    }

    this._lastYieldAccrual = currentTimestampSeconds;
    return accruedYield;
  }

  /**
   * Deposit underlying assets into the vault and receive minted vault shares
   */
  public async deposit(
    depositor: string,
    amount: bigint,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<DepositResult> {
    validateStellarAddress(depositor);
    validatePositiveAmount(amount);

    // Check circuit breaker pause state (Issue #46)
    if (this._isPaused) {
      return {
        sharesMinted: 0n,
        assetsDeposited: 0n,
        depositor,
        timestamp,
        status: 'REJECTED',
        rejectionReason: 'Vault is currently paused for deposits and withdrawals'
      };
    }

    // 1. Accrue outstanding yield prior to share conversion
    this.accrueYield(timestamp);

    // Check maximum deposit cap (Issue #62)
    if (this._maxDepositCap !== null && this._totalAssets + amount > this._maxDepositCap) {
      return {
        sharesMinted: 0n,
        assetsDeposited: 0n,
        depositor,
        timestamp,
        status: 'REJECTED',
        rejectionReason: `Deposit exceeds maximum vault cap. Current total assets: ${this._totalAssets}, requested deposit: ${amount}, cap: ${this._maxDepositCap}`
      };
    }

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
    const sharesToMint = YieldMath.convertToShares(
      amount,
      this._totalAssets,
      this._totalSupply
    );

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

    // 5. Update vault state & record transaction history (Issue #48)
    this._totalAssets += amount;
    this._totalSupply += sharesToMint;

    const currentBalance = this._userShares.get(depositor) ?? 0n;
    this._userShares.set(depositor, currentBalance + sharesToMint);

    this._txHistory.push({
      type: 'DEPOSIT',
      amount,
      timestamp
    });

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
  public async withdraw(
    withdrawer: string,
    shares: bigint,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<WithdrawResult> {
    validateStellarAddress(withdrawer);
    validatePositiveAmount(shares);

    // Check circuit breaker pause state (Issue #46)
    if (this._isPaused) {
      return {
        sharesBurned: 0n,
        assetsReturned: 0n,
        withdrawer,
        timestamp,
        status: 'REJECTED',
        rejectionReason: 'Vault is currently paused for deposits and withdrawals'
      };
    }

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
    const assetsToReturn = YieldMath.convertToAssets(
      shares,
      this._totalAssets,
      this._totalSupply
    );

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

    // 6. Update state & record transaction history (Issue #48)
    this._totalAssets -= assetsToReturn;
    this._totalSupply -= shares;
    this._userShares.set(withdrawer, userShares - shares);

    this._txHistory.push({
      type: 'WITHDRAW',
      amount: assetsToReturn,
      timestamp
    });

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
  public getUserShares(userAddress: string): bigint {
    return this._userShares.get(userAddress) ?? 0n;
  }

  /**
   * Get total assets in vault
   */
  public totalAssets(): bigint {
    return this._totalAssets;
  }

  /**
   * Get total shares minted
   */
  public totalSupply(): bigint {
    return this._totalSupply;
  }

  /**
   * Convert amount to shares
   */
  public convertToShares(assets: bigint): bigint {
    return YieldMath.convertToShares(assets, this._totalAssets, this._totalSupply);
  }

  /**
   * Convert shares to underlying asset value
   */
  public convertToAssets(shares: bigint): bigint {
    return YieldMath.convertToAssets(shares, this._totalAssets, this._totalSupply);
  }

  /**
   * Get current vault state summary
   */
  public getState(): VaultState {
    return {
      totalAssets: this._totalAssets,
      totalSupply: this._totalSupply,
      sharePrice: YieldMath.calculateSharePrice(this._totalAssets, this._totalSupply),
      lastYieldAccrual: this._lastYieldAccrual,
      currentApy: this._currentApy
    };
  }
}
