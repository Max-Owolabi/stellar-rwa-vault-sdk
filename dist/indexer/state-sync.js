"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorobanVaultStateSync = void 0;
const yield_1 = require("../math/yield");
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
class SorobanVaultStateSync {
    _totalAssets = 0n;
    _totalSupply = 0n;
    _userShares = new Map();
    _lastSyncedLedger = 0;
    /**
     * Apply a single normalized vault event to the mirrored state.
     */
    applyEvent(event) {
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
                throw new Error(`Unsupported vault event type: ${event.type}`);
        }
        this._lastSyncedLedger = event.ledger;
    }
    /**
     * Reconcile mirrored totals to authoritative on-chain values, e.g. after a
     * fresh backfill from ledger zero.
     */
    reconcile(totalAssets, totalSupply, ledger) {
        this._totalAssets = totalAssets;
        this._totalSupply = totalSupply;
        this._lastSyncedLedger = ledger;
    }
    totalAssets() {
        return this._totalAssets;
    }
    totalSupply() {
        return this._totalSupply;
    }
    getUserShares(address) {
        return this._userShares.get(address) ?? 0n;
    }
    lastSyncedLedger() {
        return this._lastSyncedLedger;
    }
    getState() {
        return {
            totalAssets: this._totalAssets,
            totalSupply: this._totalSupply,
            sharePrice: yield_1.YieldMath.calculateSharePrice(this._totalAssets, this._totalSupply),
            lastSyncedLedger: this._lastSyncedLedger
        };
    }
    addShares(address, shares) {
        const current = this._userShares.get(address) ?? 0n;
        this._userShares.set(address, current + shares);
    }
    removeShares(address, shares) {
        const current = this._userShares.get(address) ?? 0n;
        this._userShares.set(address, current - shares);
    }
}
exports.SorobanVaultStateSync = SorobanVaultStateSync;
