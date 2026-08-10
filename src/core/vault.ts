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

export class RWAStandardVault {
  public config: VaultConfig;
  private assetAdapter: IAssetAdapter;
  private complianceHooks: IComplianceHook[] = [];

  private _totalAssets: bigint = 0n;
  private _totalSupply: bigint = 0n;
  private _userShares: Map<string, bigint> = new Map();
  private _lastYieldAccrual: number;
  private _currentApy: number;

  constructor(config: VaultConfig, assetAdapter: IAssetAdapter) {
    VaultConfigSchema.parse(config);
    this.config = config;
    this.assetAdapter = assetAdapter;
    this._currentApy = config.initialApy;
    this._lastYieldAccrual = Math.floor(Date.now() / 1000);
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
  public async withdraw(
    withdrawer: string,
    shares: bigint,
    timestamp: number = Math.floor(Date.now() / 1000)
  ): Promise<WithdrawResult> {
    validateStellarAddress(withdrawer);
    validatePositiveAmount(shares);

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
