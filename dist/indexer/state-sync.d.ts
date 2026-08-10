import { VaultEvent } from '../types';
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
export declare class SorobanVaultStateSync {
    private _totalAssets;
    private _totalSupply;
    private _userShares;
    private _lastSyncedLedger;
    /**
     * Apply a single normalized vault event to the mirrored state.
     */
    applyEvent(event: VaultEvent): void;
    /**
     * Reconcile mirrored totals to authoritative on-chain values, e.g. after a
     * fresh backfill from ledger zero.
     */
    reconcile(totalAssets: bigint, totalSupply: bigint, ledger: number): void;
    totalAssets(): bigint;
    totalSupply(): bigint;
    getUserShares(address: string): bigint;
    lastSyncedLedger(): number;
    getState(): SyncedVaultState;
    private addShares;
    private removeShares;
}
