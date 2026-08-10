import { IAssetAdapter } from '../types';
import { AssetAdapterError } from '../errors';
import BigNumber from 'bignumber.js';

export interface OracleNavFeed {
  symbol: string;
  navPriceUsd: number; // e.g. 1.025 for $1.025 per token
  lastUpdated: number;
}

const SECONDS_PER_DAY = 86400;

export class TreasuryBillAdapter implements IAssetAdapter {
  public assetCode: string;
  public issuer: string;
  public decimals: number;

  private oracleFeed: OracleNavFeed;
  private balances: Map<string, bigint> = new Map();
  private maturityTimestamp: number | null = null;

  constructor(
    assetCode: string = 'USDY',
    issuer: string = 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M',
    initialNav: number = 1.0,
    decimals: number = 7,
    maturityDate?: Date | number
  ) {
    this.assetCode = assetCode;
    this.issuer = issuer;
    this.decimals = decimals;
    this.oracleFeed = {
      symbol: assetCode,
      navPriceUsd: initialNav,
      lastUpdated: Math.floor(Date.now() / 1000)
    };
    if (maturityDate !== undefined) {
      this.setMaturityDate(maturityDate);
    }
  }

  /**
   * Set (or update) the T-Bill bond maturity date.
   * Accepts a Date object or a Unix timestamp in seconds (Issue #61).
   */
  public setMaturityDate(maturityDate: Date | number): void {
    const timestamp =
      maturityDate instanceof Date ? Math.floor(maturityDate.getTime() / 1000) : maturityDate;

    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      throw new AssetAdapterError('Maturity date must resolve to a valid positive timestamp');
    }

    this.maturityTimestamp = timestamp;
  }

  /**
   * Get the configured maturity date as a Unix timestamp (seconds), or null if unset.
   */
  public getMaturityDate(): number | null {
    return this.maturityTimestamp;
  }

  /**
   * Calculate the number of whole days remaining until bond maturity (Issue #61).
   * Returns 0 once the bond has matured (never negative).
   * Optionally accepts a reference timestamp (Unix seconds) for deterministic testing.
   */
  public getDaysUntilMaturity(fromTimestampSeconds: number = Math.floor(Date.now() / 1000)): number {
    if (this.maturityTimestamp === null) {
      throw new AssetAdapterError('Maturity date has not been set for this T-Bill adapter');
    }

    const remainingSeconds = this.maturityTimestamp - fromTimestampSeconds;
    if (remainingSeconds <= 0) return 0;

    return Math.ceil(remainingSeconds / SECONDS_PER_DAY);
  }

  /**
   * Returns true if the bond has reached or passed its maturity date.
   */
  public isMatured(fromTimestampSeconds: number = Math.floor(Date.now() / 1000)): boolean {
    if (this.maturityTimestamp === null) return false;
    return fromTimestampSeconds >= this.maturityTimestamp;
  }

  /**
   * Update the off-chain oracle NAV price feed
   */
  public updateOracleNav(newPriceUsd: number, timestamp: number = Math.floor(Date.now() / 1000)): void {
    if (newPriceUsd <= 0) {
      throw new Error('NAV price must be greater than zero');
    }
    this.oracleFeed = {
      symbol: this.assetCode,
      navPriceUsd: newPriceUsd,
      lastUpdated: timestamp
    };
  }

  /**
   * Get current NAV feed status
   */
  public getOracleNav(): OracleNavFeed {
    return { ...this.oracleFeed };
  }

  /**
   * Calculate USD value of raw token balance based on NAV oracle
   */
  public getUsdValue(tokenAmount: bigint): bigint {
    if (tokenAmount <= 0n) return 0n;
    const amountBN = new BigNumber(tokenAmount.toString());
    const navBN = new BigNumber(this.oracleFeed.navPriceUsd);
    const usdValBN = amountBN.times(navBN).dividedToIntegerBy(1);
    return BigInt(usdValBN.toFixed(0));
  }

  public setMockBalance(address: string, amount: bigint): void {
    this.balances.set(address, amount);
  }

  public async getBalance(address: string): Promise<bigint> {
    return this.balances.get(address) ?? 0n;
  }

  public async transfer(from: string, to: string, amount: bigint): Promise<boolean> {
    if (amount <= 0n) return false;

    const senderBalance = await this.getBalance(from);
    if (senderBalance < amount) {
      throw new Error(
        `Insufficient T-Bill asset balance. Account ${from} has ${senderBalance}, requested ${amount}`
      );
    }

    const recipientBalance = await this.getBalance(to);
    this.balances.set(from, senderBalance - amount);
    this.balances.set(to, recipientBalance + amount);

    return true;
  }
}
