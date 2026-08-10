import { rpc } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { SorobanEventIndexerConfig, VaultEvent, VaultEventListener } from '../types';
export declare const SorobanEventIndexerConfigSchema: z.ZodObject<{
    rpcUrl: z.ZodString;
    vaultContractId: z.ZodString;
    pollIntervalMs: z.ZodDefault<z.ZodNumber>;
    startLedger: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    rpcUrl: string;
    vaultContractId: string;
    pollIntervalMs: number;
    startLedger?: number | undefined;
}, {
    rpcUrl: string;
    vaultContractId: string;
    pollIntervalMs?: number | undefined;
    startLedger?: number | undefined;
}>;
/**
 * Expected event topic names emitted by the on-chain RWA vault contract.
 * The default decoder matches these names against the first ScVal topic.
 */
export declare const VAULT_EVENT_TOPICS: readonly ["Deposit", "Withdraw", "YieldAccrual"];
/**
 * Converts a normalized vault event decoder. Implementations translate raw
 * Soroban contract events into application-ready {@link VaultEvent} records.
 * Return `null` when the raw event is not relevant to the vault.
 */
export interface VaultEventDecoder {
    decode(event: rpc.Api.EventResponse): VaultEvent | null;
}
/**
 * Canonical event payload mapping used by {@link DefaultVaultEventDecoder}.
 *
 * Deposit event     topics: ["Deposit", assetSymbol, depositorAddress]
 *                   value:  map { amount, sharesMinted, totalAssets, totalSupply }
 * Withdraw event    topics: ["Withdraw", assetSymbol, withdrawerAddress]
 *                   value:  map { sharesBurned, assetsReturned, totalAssets, totalSupply }
 * YieldAccrual event topics: ["YieldAccrual", assetSymbol]
 *                   value:  map { accruedYield, totalAssets, apyBps? }
 *
 * Absolute totals are carried in every event so the off-chain state mirror
 * can be reconciled against authoritative on-chain state. The optional `apy`
 * value is transmitted as an integer scaled by 10,000 (basis points, e.g.
 * 500 = 5.00% APY) so it survives as a native ScVal, and is normalized to a
 * decimal APY (0.05) in {@link YieldAccrualVaultEventData}.
 */
export declare class DefaultVaultEventDecoder implements VaultEventDecoder {
    private contractId;
    constructor(contractId: string);
    decode(event: rpc.Api.EventResponse): VaultEvent | null;
    private decodeDeposit;
    private decodeWithdraw;
    private decodeYieldAccrual;
    private decodeRecord;
    private buildEvent;
}
/**
 * Polls Soroban RPC for contract events emitted by an on-chain RWA vault
 * contract and dispatches them to subscribed listeners. Uses cursor-based
 * pagination so the indexer can be resumed from the last synced event.
 *
 * Example:
 * ```ts
 * const indexer = new SorobanEventIndexer({
 *   rpcUrl: 'https://soroban-testnet.stellar.org',
 *   vaultContractId: 'CDLZ...',
 *   pollIntervalMs: 5000
 * });
 * indexer.subscribe((event) => console.log(event));
 * indexer.start();
 * ```
 */
export declare class SorobanEventIndexer {
    private server;
    private config;
    private decoder;
    private listeners;
    private pollTimer;
    private cursor;
    private lastSyncedLedgerNumber;
    private onError;
    constructor(config: SorobanEventIndexerConfig, decoder?: VaultEventDecoder);
    /**
     * Register a listener invoked with every normalized vault event.
     * Returns an unsubscribe function.
     */
    subscribe(listener: VaultEventListener): () => void;
    /**
     * Register an error handler invoked when a raw event fails to decode.
     */
    onDecodeError(handler: (error: Error) => void): void;
    /**
     * Ledger height of the most recent event batch observed by the indexer.
     */
    get lastSyncedLedger(): number | undefined;
    /**
     * Synchronously drain every event page from the given ledger (inclusive)
     * and dispatch decoded vault events to listeners. Returns the number of
     * vault events processed.
     */
    syncFromLedger(startLedger: number): Promise<number>;
    /**
     * Run a single catch-up sweep. When a cursor exists, resumes from the last
     * synced position; otherwise starts from `startLedger` (if configured) or
     * from the latest ledger the RPC node has observed. Returns the number of
     * vault events processed.
     */
    poll(): Promise<number>;
    /**
     * Begin continuous real-time polling. The first sweep happens immediately,
     * subsequent sweeps run on the configured `pollIntervalMs`.
     */
    start(): void;
    /**
     * Stop continuous polling. Pending in-flight sweeps are allowed to finish.
     */
    stop(): void;
    isRunning(): boolean;
    private fetchAndDispatch;
    private buildFilters;
    private emitEvent;
    private safeEmitError;
}
