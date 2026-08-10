"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorobanEventIndexer = exports.DefaultVaultEventDecoder = exports.VAULT_EVENT_TOPICS = exports.SorobanEventIndexerConfigSchema = void 0;
const stellar_sdk_1 = require("@stellar/stellar-sdk");
const zod_1 = require("zod");
const errors_1 = require("../errors");
exports.SorobanEventIndexerConfigSchema = zod_1.z.object({
    rpcUrl: zod_1.z.string().min(1, 'Soroban RPC URL is required'),
    vaultContractId: zod_1.z.string().min(1, 'Vault contract ID is required'),
    pollIntervalMs: zod_1.z.number().int().positive().default(5000),
    startLedger: zod_1.z.number().int().positive().optional()
});
/**
 * Expected event topic names emitted by the on-chain RWA vault contract.
 * The default decoder matches these names against the first ScVal topic.
 */
exports.VAULT_EVENT_TOPICS = ['Deposit', 'Withdraw', 'YieldAccrual'];
const EVENT_TOPIC_SUFFIXES = {
    Deposit: ['*', '*'],
    Withdraw: ['*', '*'],
    YieldAccrual: ['*']
};
function encodeSymbolAsScValBase64(name) {
    return stellar_sdk_1.xdr.ScVal.scvSymbol(name).toXDR('base64');
}
function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function toBigInt(value) {
    if (typeof value === 'bigint')
        return value;
    if (typeof value === 'number' && Number.isFinite(value))
        return BigInt(value);
    if (typeof value === 'string')
        return BigInt(value);
    throw new errors_1.VaultError(`Expected bigint-compatible event value but received ${typeof value}`, 'ERR_SOROBAN_EVENT_DECODE');
}
function timestampFromIso(iso) {
    const parsed = Date.parse(iso);
    return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
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
class DefaultVaultEventDecoder {
    contractId;
    constructor(contractId) {
        this.contractId = contractId;
    }
    decode(event) {
        if (event.type !== 'contract')
            return null;
        if (!event.contractId || String(event.contractId) !== this.contractId)
            return null;
        if (!event.inSuccessfulContractCall)
            return null;
        const name = event.topic.length > 0 ? String((0, stellar_sdk_1.scValToNative)(event.topic[0])) : '';
        const value = (0, stellar_sdk_1.scValToNative)(event.value);
        switch (name) {
            case 'Deposit':
                return this.decodeDeposit(event, value);
            case 'Withdraw':
                return this.decodeWithdraw(event, value);
            case 'YieldAccrual':
                return this.decodeYieldAccrual(event, value);
            default:
                return null;
        }
    }
    decodeDeposit(event, value) {
        if (event.topic.length < 3)
            return null;
        const depositor = String((0, stellar_sdk_1.scValToNative)(event.topic[2]));
        const data = this.decodeRecord(value, ['amount', 'sharesMinted', 'totalAssets', 'totalSupply'], (record) => ({
            depositor,
            amount: toBigInt(record.amount),
            sharesMinted: toBigInt(record.sharesMinted),
            totalAssets: toBigInt(record.totalAssets),
            totalSupply: toBigInt(record.totalSupply)
        }));
        if (!data || data.amount <= 0n || data.sharesMinted <= 0n)
            return null;
        return this.buildEvent(event, 'DEPOSIT', data);
    }
    decodeWithdraw(event, value) {
        if (event.topic.length < 3)
            return null;
        const withdrawer = String((0, stellar_sdk_1.scValToNative)(event.topic[2]));
        const data = this.decodeRecord(value, ['sharesBurned', 'assetsReturned', 'totalAssets', 'totalSupply'], (record) => ({
            withdrawer,
            sharesBurned: toBigInt(record.sharesBurned),
            assetsReturned: toBigInt(record.assetsReturned),
            totalAssets: toBigInt(record.totalAssets),
            totalSupply: toBigInt(record.totalSupply)
        }));
        if (!data || data.sharesBurned <= 0n || data.assetsReturned <= 0n)
            return null;
        return this.buildEvent(event, 'WITHDRAW', data);
    }
    decodeYieldAccrual(event, value) {
        const data = this.decodeRecord(value, ['accruedYield', 'totalAssets'], (record) => ({
            accruedYield: toBigInt(record.accruedYield),
            totalAssets: toBigInt(record.totalAssets),
            apy: record.apy !== undefined ? Number(record.apy) / 10000 : undefined
        }));
        if (!data || data.accruedYield < 0n)
            return null;
        return this.buildEvent(event, 'YIELD_ACCRUAL', data);
    }
    decodeRecord(value, keys, build) {
        if (!isRecord(value))
            return null;
        for (const key of keys) {
            if (value[key] === undefined)
                return null;
        }
        return build(value);
    }
    buildEvent(event, type, data) {
        return {
            id: event.id,
            type,
            ledger: event.ledger,
            timestamp: timestampFromIso(event.ledgerClosedAt),
            txHash: event.txHash,
            contractId: String(event.contractId),
            data
        };
    }
}
exports.DefaultVaultEventDecoder = DefaultVaultEventDecoder;
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
class SorobanEventIndexer {
    server;
    config;
    decoder;
    listeners = new Set();
    pollTimer = null;
    cursor;
    lastSyncedLedgerNumber;
    onError;
    constructor(config, decoder) {
        this.config = exports.SorobanEventIndexerConfigSchema.parse(config);
        this.server = new stellar_sdk_1.rpc.Server(this.config.rpcUrl);
        this.decoder = decoder ?? new DefaultVaultEventDecoder(this.config.vaultContractId);
    }
    /**
     * Register a listener invoked with every normalized vault event.
     * Returns an unsubscribe function.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Register an error handler invoked when a raw event fails to decode.
     */
    onDecodeError(handler) {
        this.onError = handler;
    }
    /**
     * Ledger height of the most recent event batch observed by the indexer.
     */
    get lastSyncedLedger() {
        return this.lastSyncedLedgerNumber;
    }
    /**
     * Synchronously drain every event page from the given ledger (inclusive)
     * and dispatch decoded vault events to listeners. Returns the number of
     * vault events processed.
     */
    async syncFromLedger(startLedger) {
        if (!Number.isInteger(startLedger) || startLedger <= 0) {
            throw new errors_1.SDKValidationError(`startLedger must be a positive integer, received ${startLedger}`, 'ERR_SOROBAN_INDEXER_INVALID_START_LEDGER');
        }
        this.cursor = undefined;
        return this.fetchAndDispatch(startLedger);
    }
    /**
     * Run a single catch-up sweep. When a cursor exists, resumes from the last
     * synced position; otherwise starts from `startLedger` (if configured) or
     * from the latest ledger the RPC node has observed. Returns the number of
     * vault events processed.
     */
    async poll() {
        if (this.cursor !== undefined) {
            return this.fetchAndDispatch();
        }
        if (this.config.startLedger !== undefined) {
            this.cursor = undefined;
            return this.fetchAndDispatch(this.config.startLedger);
        }
        const latestLedger = await this.server.getLatestLedger();
        this.cursor = undefined;
        return this.fetchAndDispatch(latestLedger.sequence);
    }
    /**
     * Begin continuous real-time polling. The first sweep happens immediately,
     * subsequent sweeps run on the configured `pollIntervalMs`.
     */
    start() {
        if (this.pollTimer !== null)
            return;
        void this.poll().catch((error) => this.safeEmitError(error));
        this.pollTimer = setInterval(() => {
            void this.poll().catch((error) => this.safeEmitError(error));
        }, this.config.pollIntervalMs);
    }
    /**
     * Stop continuous polling. Pending in-flight sweeps are allowed to finish.
     */
    stop() {
        if (this.pollTimer !== null) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
    }
    isRunning() {
        return this.pollTimer !== null;
    }
    async fetchAndDispatch(startLedger) {
        let processed = 0;
        while (true) {
            const request = {
                filters: this.buildFilters(),
                limit: 100
            };
            if (this.cursor !== undefined) {
                request.cursor = this.cursor;
            }
            else if (startLedger !== undefined) {
                request.startLedger = startLedger;
            }
            const response = await this.server.getEvents(request);
            this.lastSyncedLedgerNumber = response.latestLedger;
            for (const raw of response.events) {
                let decoded = null;
                try {
                    decoded = this.decoder.decode(raw);
                }
                catch (error) {
                    this.safeEmitError(error instanceof Error ? error : new Error(String(error)));
                    continue;
                }
                if (decoded !== null) {
                    this.emitEvent(decoded);
                    processed += 1;
                }
            }
            this.cursor = response.cursor;
            if (response.events.length === 0 || !this.cursor)
                break;
        }
        return processed;
    }
    buildFilters() {
        return exports.VAULT_EVENT_TOPICS.map((name) => ({
            type: 'contract',
            contractIds: [this.config.vaultContractId],
            topics: [[encodeSymbolAsScValBase64(name), ...EVENT_TOPIC_SUFFIXES[name]]]
        }));
    }
    emitEvent(event) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
    safeEmitError(error) {
        if (this.onError) {
            try {
                this.onError(error);
            }
            catch {
                // Error handlers must never break the polling loop.
            }
        }
    }
}
exports.SorobanEventIndexer = SorobanEventIndexer;
