import { rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { z } from 'zod';
import { SDKValidationError, VaultError } from '../errors';
import {
  DepositVaultEventData,
  SorobanEventIndexerConfig,
  VaultEvent,
  VaultEventData,
  VaultEventListener,
  VaultEventType,
  WithdrawVaultEventData,
  YieldAccrualVaultEventData
} from '../types';

export const SorobanEventIndexerConfigSchema = z.object({
  rpcUrl: z.string().min(1, 'Soroban RPC URL is required'),
  vaultContractId: z.string().min(1, 'Vault contract ID is required'),
  pollIntervalMs: z.number().int().positive().default(5000),
  startLedger: z.number().int().positive().optional()
});

/**
 * Expected event topic names emitted by the on-chain RWA vault contract.
 * The default decoder matches these names against the first ScVal topic.
 */
export const VAULT_EVENT_TOPICS = ['Deposit', 'Withdraw', 'YieldAccrual'] as const;

const EVENT_TOPIC_SUFFIXES: Record<string, string[]> = {
  Deposit: ['*', '*'],
  Withdraw: ['*', '*'],
  YieldAccrual: ['*']
};

/**
 * Converts a normalized vault event decoder. Implementations translate raw
 * Soroban contract events into application-ready {@link VaultEvent} records.
 * Return `null` when the raw event is not relevant to the vault.
 */
export interface VaultEventDecoder {
  decode(event: rpc.Api.EventResponse): VaultEvent | null;
}

function encodeSymbolAsScValBase64(name: string): string {
  return xdr.ScVal.scvSymbol(name).toXDR('base64');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(value);
  if (typeof value === 'string') return BigInt(value);
  throw new VaultError(
    `Expected bigint-compatible event value but received ${typeof value}`,
    'ERR_SOROBAN_EVENT_DECODE'
  );
}

function timestampFromIso(iso: string): number {
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
export class DefaultVaultEventDecoder implements VaultEventDecoder {
  private contractId: string;

  constructor(contractId: string) {
    this.contractId = contractId;
  }

  public decode(event: rpc.Api.EventResponse): VaultEvent | null {
    if (event.type !== 'contract') return null;
    if (!event.contractId || String(event.contractId) !== this.contractId) return null;
    if (!event.inSuccessfulContractCall) return null;

    const name = event.topic.length > 0 ? String(scValToNative(event.topic[0])) : '';
    const value = scValToNative(event.value);

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

  private decodeDeposit(event: rpc.Api.EventResponse, value: unknown): VaultEvent | null {
    if (event.topic.length < 3) return null;
    const depositor = String(scValToNative(event.topic[2]));
    const data = this.decodeRecord<DepositVaultEventData>(
      value,
      ['amount', 'sharesMinted', 'totalAssets', 'totalSupply'],
      (record) => ({
        depositor,
        amount: toBigInt(record.amount),
        sharesMinted: toBigInt(record.sharesMinted),
        totalAssets: toBigInt(record.totalAssets),
        totalSupply: toBigInt(record.totalSupply)
      })
    );
    if (!data || data.amount <= 0n || data.sharesMinted <= 0n) return null;
    return this.buildEvent(event, 'DEPOSIT', data);
  }

  private decodeWithdraw(event: rpc.Api.EventResponse, value: unknown): VaultEvent | null {
    if (event.topic.length < 3) return null;
    const withdrawer = String(scValToNative(event.topic[2]));
    const data = this.decodeRecord<WithdrawVaultEventData>(
      value,
      ['sharesBurned', 'assetsReturned', 'totalAssets', 'totalSupply'],
      (record) => ({
        withdrawer,
        sharesBurned: toBigInt(record.sharesBurned),
        assetsReturned: toBigInt(record.assetsReturned),
        totalAssets: toBigInt(record.totalAssets),
        totalSupply: toBigInt(record.totalSupply)
      })
    );
    if (!data || data.sharesBurned <= 0n || data.assetsReturned <= 0n) return null;
    return this.buildEvent(event, 'WITHDRAW', data);
  }

  private decodeYieldAccrual(event: rpc.Api.EventResponse, value: unknown): VaultEvent | null {
    const data = this.decodeRecord<YieldAccrualVaultEventData>(
      value,
      ['accruedYield', 'totalAssets'],
      (record) => ({
        accruedYield: toBigInt(record.accruedYield),
        totalAssets: toBigInt(record.totalAssets),
        apy: record.apy !== undefined ? Number(record.apy) / 10000 : undefined
      })
    );
    if (!data || data.accruedYield < 0n) return null;
    return this.buildEvent(event, 'YIELD_ACCRUAL', data);
  }

  private decodeRecord<T>(
    value: unknown,
    keys: string[],
    build: (record: Record<string, unknown>) => T
  ): T | null {
    if (!isRecord(value)) return null;
    for (const key of keys) {
      if (value[key] === undefined) return null;
    }
    return build(value);
  }

  private buildEvent(
    event: rpc.Api.EventResponse,
    type: VaultEventType,
    data: VaultEventData
  ): VaultEvent {
    return {
      id: event.id,
      type,
      ledger: event.ledger,
      timestamp: timestampFromIso(event.ledgerClosedAt),
      txHash: event.txHash,
      contractId: String(event.contractId),
      data
    } as VaultEvent;
  }
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
export class SorobanEventIndexer {
  private server: rpc.Server;
  private config: SorobanEventIndexerConfig;
  private decoder: VaultEventDecoder;
  private listeners: Set<VaultEventListener> = new Set();
  private pollTimer: NodeJS.Timeout | null = null;
  private cursor: string | undefined;
  private lastSyncedLedgerNumber: number | undefined;
  private onError: ((error: Error) => void) | undefined;

  constructor(config: SorobanEventIndexerConfig, decoder?: VaultEventDecoder) {
    this.config = SorobanEventIndexerConfigSchema.parse(config);
    this.server = new rpc.Server(this.config.rpcUrl);
    this.decoder = decoder ?? new DefaultVaultEventDecoder(this.config.vaultContractId);
  }

  /**
   * Register a listener invoked with every normalized vault event.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: VaultEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Register an error handler invoked when a raw event fails to decode.
   */
  public onDecodeError(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  /**
   * Ledger height of the most recent event batch observed by the indexer.
   */
  public get lastSyncedLedger(): number | undefined {
    return this.lastSyncedLedgerNumber;
  }

  /**
   * Synchronously drain every event page from the given ledger (inclusive)
   * and dispatch decoded vault events to listeners. Returns the number of
   * vault events processed.
   */
  public async syncFromLedger(startLedger: number): Promise<number> {
    if (!Number.isInteger(startLedger) || startLedger <= 0) {
      throw new SDKValidationError(
        `startLedger must be a positive integer, received ${startLedger}`,
        'ERR_SOROBAN_INDEXER_INVALID_START_LEDGER'
      );
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
  public async poll(): Promise<number> {
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
  public start(): void {
    if (this.pollTimer !== null) return;

    void this.poll().catch((error) => this.safeEmitError(error));

    this.pollTimer = setInterval(() => {
      void this.poll().catch((error) => this.safeEmitError(error));
    }, this.config.pollIntervalMs);
  }

  /**
   * Stop continuous polling. Pending in-flight sweeps are allowed to finish.
   */
  public stop(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  public isRunning(): boolean {
    return this.pollTimer !== null;
  }

  private async fetchAndDispatch(startLedger?: number): Promise<number> {
    let processed = 0;

    while (true) {
      const request: rpc.Server.GetEventsRequest = {
        filters: this.buildFilters(),
        limit: 100
      };
      if (this.cursor !== undefined) {
        request.cursor = this.cursor;
      } else if (startLedger !== undefined) {
        request.startLedger = startLedger;
      }

      const response = await this.server.getEvents(request);
      this.lastSyncedLedgerNumber = response.latestLedger;

      for (const raw of response.events) {
        let decoded: VaultEvent | null = null;
        try {
          decoded = this.decoder.decode(raw);
        } catch (error) {
          this.safeEmitError(
            error instanceof Error ? error : new Error(String(error))
          );
          continue;
        }
        if (decoded !== null) {
          this.emitEvent(decoded);
          processed += 1;
        }
      }

      this.cursor = response.cursor;
      if (response.events.length === 0 || !this.cursor) break;
    }

    return processed;
  }

  private buildFilters(): rpc.Api.EventFilter[] {
    return VAULT_EVENT_TOPICS.map((name) => ({
      type: 'contract',
      contractIds: [this.config.vaultContractId],
      topics: [[encodeSymbolAsScValBase64(name), ...EVENT_TOPIC_SUFFIXES[name]]]
    }));
  }

  private emitEvent(event: VaultEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private safeEmitError(error: Error): void {
    if (this.onError) {
      try {
        this.onError(error);
      } catch {
        // Error handlers must never break the polling loop.
      }
    }
  }
}
