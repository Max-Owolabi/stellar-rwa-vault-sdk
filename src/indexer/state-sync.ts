import { VaultEvent } from '../types';
import { YieldMath } from '../math/yield';

export interface SyncedVaultState {
  totalAssets: bigint;
  totalSupply: bigint;
  sharePrice: number;
  lastSyncedLedger: number;
}

/**
 * Maintains an off-chain mirror of on-chain vault state by applying
 * normalized {@link VaultEvent} records as they stream in from the
 * {@link SorobanEventIndexer}.
 *
 * Deposit and Withdraw events carry authoritative absolute totals
 * (totalAssets / totalSupply) so the mirror reconciles to on-chain state
 * instead of drifting on delta arithmetic. Per-user share balances are
 * tracked as deltas, matching on-chain bookkeeping.
 */
export class SorobanVaultStateSync {
  private _totalAssets: bigint = 0n;
  private _totalSupply: bigint = 0n;
  private _userShares: Map<string, bigint> = new Map();
  private _lastSyncedLedger: number = 0;

  /**
   * Apply a single normalized vault event to the mirrored state.
   */
  public applyEvent(event: VaultEvent): void {
    switch (event.type) {
      case 'DEPOSIT':
        this._totalAssets = event.data.totalAssets;
        this._totalSupply = event.data.totalSupply;
        this.addShares(event.data.depositor, event.data.sharesMinted);
        break;
      case 'WITHDRAW':
        this._totalAssets = event.data.totalAssets;
        this._totalSupply = event.data.totalSupply;
        this.removeShares(event.data.withdrawer, event.data.sharesBurned);
        break;
      case 'YIELD_ACCRUAL':
        this._totalAssets = event.data.totalAssets;
        break;
      default:
        throw new Error(`Unsupported vault event type: ${(event as VaultEvent).type}`);
    }
    this._lastSyncedLedger = event.ledger;
  }

  /**
   * Reconcile mirrored totals to authoritative on-chain values, e.g. after a
   * fresh backfill from ledger zero.
   */
  public reconcile(totalAssets: bigint, totalSupply: bigint, ledger: number): void {
    this._totalAssets = totalAssets;
    this._totalSupply = totalSupply;
    this._lastSyncedLedger = ledger;
  }

  public totalAssets(): bigint {
    return this._totalAssets;
  }

  public totalSupply(): bigint {
    return this._totalSupply;
  }

  public getUserShares(address: string): bigint {
    return this._userShares.get(address) ?? 0n;
  }

  public lastSyncedLedger(): number {
    return this._lastSyncedLedger;
  }

  public getState(): SyncedVaultState {
    return {
      totalAssets: this._totalAssets,
      totalSupply: this._totalSupply,
      sharePrice: YieldMath.calculateSharePrice(this._totalAssets, this._totalSupply),
      lastSyncedLedger: this._lastSyncedLedger
    };
  }

  private addShares(address: string, shares: bigint): void {
    const current = this._userShares.get(address) ?? 0n;
    this._userShares.set(address, current + shares);
  }

  private removeShares(address: string, shares: bigint): void {
    const current = this._userShares.get(address) ?? 0n;
    this._userShares.set(address, current - shares);
  }
}
