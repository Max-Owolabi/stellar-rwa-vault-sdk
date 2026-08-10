import { Address, Keypair, nativeToScVal, rpc, xdr } from '@stellar/stellar-sdk';
import {
  DefaultVaultEventDecoder,
  SorobanEventIndexer,
  VAULT_EVENT_TOPICS
} from '../src/indexer/soroban-event-indexer';
import { SorobanVaultStateSync } from '../src/indexer/state-sync';
import { SDKValidationError } from '../src/errors';

const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC';
const USER_A = Keypair.random().publicKey();
const USER_B = Keypair.random().publicKey();

const symbolScVal = (name: string): xdr.ScVal => xdr.ScVal.scvSymbol(name);
const addressScVal = (publicKey: string): xdr.ScVal => new Address(publicKey).toScVal();
const mapScVal = (obj: Record<string, unknown>): xdr.ScVal =>
  nativeToScVal(obj, { type: 'map' });

interface EventOverrides {
  id?: string;
  ledger?: number;
  pagingToken?: string;
  contractId?: string;
  successful?: boolean;
  type?: rpc.Api.EventType;
}

function depositEvent(
  overrides: EventOverrides & {
    amount: bigint;
    sharesMinted: bigint;
    totalAssets: bigint;
    totalSupply: bigint;
    depositor?: string;
  }
): rpc.Api.EventResponse {
  const ledger = overrides.ledger ?? 100;
  return {
    id: overrides.id ?? `event-deposit-${ledger}`,
    type: overrides.type ?? 'contract',
    ledger,
    ledgerClosedAt: '2026-08-10T00:00:00Z',
    pagingToken: overrides.pagingToken ?? `${ledger}-0000000001`,
    inSuccessfulContractCall: overrides.successful ?? true,
    txHash: 'a'.repeat(64),
    contractId: overrides.contractId ?? CONTRACT_ID,
    topic: [
      symbolScVal('Deposit'),
      symbolScVal('rwaUSDC'),
      addressScVal(overrides.depositor ?? USER_A)
    ],
    value: mapScVal({
      amount: overrides.amount,
      sharesMinted: overrides.sharesMinted,
      totalAssets: overrides.totalAssets,
      totalSupply: overrides.totalSupply
    })
  } as unknown as rpc.Api.EventResponse;
}

function withdrawEvent(
  overrides: EventOverrides & {
    sharesBurned: bigint;
    assetsReturned: bigint;
    totalAssets: bigint;
    totalSupply: bigint;
    withdrawer?: string;
  }
): rpc.Api.EventResponse {
  const ledger = overrides.ledger ?? 200;
  return {
    id: overrides.id ?? `event-withdraw-${ledger}`,
    type: overrides.type ?? 'contract',
    ledger,
    ledgerClosedAt: '2026-08-10T01:00:00Z',
    pagingToken: overrides.pagingToken ?? `${ledger}-0000000002`,
    inSuccessfulContractCall: overrides.successful ?? true,
    txHash: 'b'.repeat(64),
    contractId: overrides.contractId ?? CONTRACT_ID,
    topic: [
      symbolScVal('Withdraw'),
      symbolScVal('rwaUSDC'),
      addressScVal(overrides.withdrawer ?? USER_A)
    ],
    value: mapScVal({
      sharesBurned: overrides.sharesBurned,
      assetsReturned: overrides.assetsReturned,
      totalAssets: overrides.totalAssets,
      totalSupply: overrides.totalSupply
    })
  } as unknown as rpc.Api.EventResponse;
}

function yieldAccrualEvent(
  overrides: EventOverrides & { accruedYield: bigint; totalAssets: bigint; apyBps?: number }
): rpc.Api.EventResponse {
  const ledger = overrides.ledger ?? 300;
  const mapEntries: xdr.ScMapEntry[] = [
    new xdr.ScMapEntry({ key: symbolScVal('accruedYield'), val: nativeToScVal(overrides.accruedYield) }),
    new xdr.ScMapEntry({ key: symbolScVal('totalAssets'), val: nativeToScVal(overrides.totalAssets) })
  ];
  if (overrides.apyBps !== undefined) {
    mapEntries.push(new xdr.ScMapEntry({ key: symbolScVal('apy'), val: nativeToScVal(overrides.apyBps) }));
  }
  return {
    id: overrides.id ?? `event-yield-${ledger}`,
    type: overrides.type ?? 'contract',
    ledger,
    ledgerClosedAt: '2026-08-10T02:00:00Z',
    pagingToken: overrides.pagingToken ?? `${ledger}-0000000003`,
    inSuccessfulContractCall: overrides.successful ?? true,
    txHash: 'c'.repeat(64),
    contractId: overrides.contractId ?? CONTRACT_ID,
    topic: [symbolScVal('YieldAccrual'), symbolScVal('rwaUSDC')],
    value: xdr.ScVal.scvMap(mapEntries)
  } as unknown as rpc.Api.EventResponse;
}

describe('DefaultVaultEventDecoder', () => {
  const decoder = new DefaultVaultEventDecoder(CONTRACT_ID);

  test('decodes a Deposit event into a normalized vault event', () => {
    const decoded = decoder.decode(
      depositEvent({
        amount: 1_000_000_000n,
        sharesMinted: 1_000_000_000n,
        totalAssets: 1_000_000_000n,
        totalSupply: 1_000_000_000n,
        depositor: USER_A,
        ledger: 123
      })
    );

    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('DEPOSIT');
    expect(decoded?.ledger).toBe(123);
    expect(decoded?.txHash).toHaveLength(64);
    expect(decoded?.data).toEqual({
      depositor: USER_A,
      amount: 1_000_000_000n,
      sharesMinted: 1_000_000_000n,
      totalAssets: 1_000_000_000n,
      totalSupply: 1_000_000_000n
    });
  });

  test('decodes a Withdraw event into a normalized vault event', () => {
    const decoded = decoder.decode(
      withdrawEvent({
        sharesBurned: 500_000_000n,
        assetsReturned: 525_000_000n,
        totalAssets: 525_000_000n,
        totalSupply: 500_000_000n,
        withdrawer: USER_A
      })
    );

    expect(decoded?.type).toBe('WITHDRAW');
    expect(decoded?.data).toMatchObject({
      withdrawer: USER_A,
      sharesBurned: 500_000_000n,
      assetsReturned: 525_000_000n
    });
  });

  test('decodes a YieldAccrual event including optional APY', () => {
    const decoded = decoder.decode(
      yieldAccrualEvent({ accruedYield: 50_000_000n, totalAssets: 1_050_000_000n, apyBps: 500 })
    );

    expect(decoded?.type).toBe('YIELD_ACCRUAL');
    expect(decoded?.data).toEqual({
      accruedYield: 50_000_000n,
      totalAssets: 1_050_000_000n,
      apy: 0.05
    });
  });

  test('ignores events from other contracts', () => {
    expect(decoder.decode(depositEvent({ contractId: 'OTHER', amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n }))).toBeNull();
  });

  test('ignores non-contract event types', () => {
    expect(decoder.decode(depositEvent({ type: 'system', amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n }))).toBeNull();
  });

  test('ignores events from failed contract calls', () => {
    expect(decoder.decode(depositEvent({ successful: false, amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n }))).toBeNull();
  });

  test('ignores events with unknown topic names', () => {
    const raw = depositEvent({ amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n });
    const unknownTopicEvent = { ...raw, topic: [symbolScVal('UnknownEvent'), symbolScVal('rwaUSDC')] };
    expect(decoder.decode(unknownTopicEvent)).toBeNull();
  });

  test('ignores malformed deposit values missing required keys', () => {
    const raw = depositEvent({ amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n });
    const malformed = { ...raw, value: mapScVal({ amount: 1n }) };
    expect(decoder.decode(malformed)).toBeNull();
  });
});

describe('SorobanEventIndexer', () => {
  const baseConfig = {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    vaultContractId: CONTRACT_ID,
    pollIntervalMs: 5000
  };

  let getEventsMock: jest.SpyInstance;
  let getLatestLedgerMock: jest.SpyInstance;

  beforeEach(() => {
    getEventsMock = jest.spyOn(rpc.Server.prototype, 'getEvents');
    getLatestLedgerMock = jest.spyOn(rpc.Server.prototype, 'getLatestLedger');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('rejects invalid configuration', () => {
    expect(() => new SorobanEventIndexer({ rpcUrl: 'not-a-url', vaultContractId: '' })).toThrow();
    expect(() => new SorobanEventIndexer({ rpcUrl: 'https://soroban-testnet.stellar.org', vaultContractId: '' })).toThrow();
  });

  test('syncFromLedger rejects non-positive start ledger', async () => {
    const indexer = new SorobanEventIndexer(baseConfig);
    await expect(indexer.syncFromLedger(0)).rejects.toBeInstanceOf(SDKValidationError);
    await expect(indexer.syncFromLedger(-5)).rejects.toBeInstanceOf(SDKValidationError);
  });

  test('drains all event pages in order and dispatches vault events', async () => {
    const page1: rpc.Api.GetEventsResponse = {
      latestLedger: 102,
      cursor: 'cursor-1',
      events: [
        depositEvent({ amount: 1000n, sharesMinted: 1000n, totalAssets: 1000n, totalSupply: 1000n, depositor: USER_A, ledger: 101, pagingToken: '101-0' }),
        yieldAccrualEvent({ accruedYield: 10n, totalAssets: 1010n, ledger: 102, pagingToken: '102-0' })
      ]
    };
    const page2: rpc.Api.GetEventsResponse = {
      latestLedger: 103,
      cursor: 'cursor-2',
      events: [
        depositEvent({ amount: 500n, sharesMinted: 500n, totalAssets: 1510n, totalSupply: 1500n, depositor: USER_B, ledger: 103, pagingToken: '103-0' })
      ]
    };
    const emptyPage: rpc.Api.GetEventsResponse = { latestLedger: 103, cursor: 'cursor-3', events: [] };

    getEventsMock
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(page2)
      .mockResolvedValueOnce(emptyPage);

    const indexer = new SorobanEventIndexer(baseConfig);
    const received: string[] = [];
    indexer.subscribe((event) => received.push(`${event.type}:${event.ledger}`));

    const processed = await indexer.syncFromLedger(101);

    expect(processed).toBe(3);
    expect(received).toEqual(['DEPOSIT:101', 'YIELD_ACCRUAL:102', 'DEPOSIT:103']);
    expect(indexer.lastSyncedLedger).toBe(103);

    const requests = getEventsMock.mock.calls.map(([req]) => req);
    expect(requests[0].startLedger).toBe(101);
    expect(requests[0].cursor).toBeUndefined();
    expect(requests[1].cursor).toBe('cursor-1');
    expect(requests[2].cursor).toBe('cursor-2');
    expect(requests[0].filters[0]).toEqual({
      type: 'contract',
      contractIds: [CONTRACT_ID],
      topics: [[expect.any(String), '*', '*']]
    });
  });

  test('poll resumes from stored cursor on subsequent sweeps', async () => {
    const page1: rpc.Api.GetEventsResponse = {
      latestLedger: 100,
      cursor: 'cursor-1',
      events: [depositEvent({ amount: 1000n, sharesMinted: 1000n, totalAssets: 1000n, totalSupply: 1000n, ledger: 100, pagingToken: '100-0' })]
    };
    const emptyPage: rpc.Api.GetEventsResponse = { latestLedger: 100, cursor: 'cursor-2', events: [] };
    const emptyPage2: rpc.Api.GetEventsResponse = { latestLedger: 101, cursor: 'cursor-3', events: [] };

    getEventsMock
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(emptyPage)
      .mockResolvedValueOnce(emptyPage2);

    const indexer = new SorobanEventIndexer({ ...baseConfig, startLedger: 99 });
    await indexer.poll();
    await indexer.poll();

    expect(getEventsMock).toHaveBeenCalledTimes(3);
    expect(getEventsMock.mock.calls[0][0].startLedger).toBe(99);
    expect(getEventsMock.mock.calls[1][0].cursor).toBe('cursor-1');
    expect(getEventsMock.mock.calls[2][0].cursor).toBe('cursor-2');
  });

  test('poll without cursor or startLedger syncs from the latest ledger', async () => {
    getLatestLedgerMock.mockResolvedValue({ id: 'x', sequence: 1000, protocolVersion: '22' });
    getEventsMock.mockResolvedValue({ latestLedger: 1000, cursor: 'cursor-0', events: [] });

    const indexer = new SorobanEventIndexer(baseConfig);
    await indexer.poll();

    expect(getLatestLedgerMock).toHaveBeenCalledTimes(1);
    expect(getEventsMock.mock.calls[0][0].startLedger).toBe(1000);
  });

  test('start/stop schedules polling on the configured interval', async () => {
    jest.useFakeTimers();
    getLatestLedgerMock.mockResolvedValue({ id: 'x', sequence: 100, protocolVersion: '22' });
    getEventsMock.mockResolvedValue({ latestLedger: 100, cursor: 'cursor-0', events: [] });

    const indexer = new SorobanEventIndexer(baseConfig);
    indexer.start();

    expect(indexer.isRunning()).toBe(true);
    await jest.advanceTimersByTimeAsync(0); // flush the immediate first sweep
    expect(getEventsMock).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(5000);
    expect(getEventsMock).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(10_000);
    expect(getEventsMock).toHaveBeenCalledTimes(4);

    indexer.stop();
    expect(indexer.isRunning()).toBe(false);

    await jest.advanceTimersByTimeAsync(10_000);
    expect(getEventsMock).toHaveBeenCalledTimes(4);
    jest.useRealTimers();
  });

  test('subscribe returns unsubscribe that stops delivery', async () => {
    getEventsMock
      .mockResolvedValueOnce({
        latestLedger: 100,
        cursor: 'cursor-0',
        events: [depositEvent({ amount: 1n, sharesMinted: 1n, totalAssets: 1n, totalSupply: 1n, ledger: 100 })]
      })
      .mockResolvedValueOnce({ latestLedger: 100, cursor: 'cursor-1', events: [] })
      .mockResolvedValueOnce({ latestLedger: 100, cursor: 'cursor-2', events: [] });

    const indexer = new SorobanEventIndexer(baseConfig);
    const listener = jest.fn();
    const unsubscribe = indexer.subscribe(listener);

    await indexer.syncFromLedger(100);
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    await indexer.syncFromLedger(100);
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('SorobanVaultStateSync', () => {
  test('applies deposit events to mirror totals and user shares', () => {
    const sync = new SorobanVaultStateSync();
    sync.applyEvent({
      id: 'd1',
      type: 'DEPOSIT',
      ledger: 100,
      timestamp: 1750000000,
      txHash: 'a'.repeat(64),
      contractId: CONTRACT_ID,
      data: {
        depositor: USER_A,
        amount: 1_000_000_000n,
        sharesMinted: 1_000_000_000n,
        totalAssets: 1_000_000_000n,
        totalSupply: 1_000_000_000n
      }
    });

    expect(sync.totalAssets()).toBe(1_000_000_000n);
    expect(sync.totalSupply()).toBe(1_000_000_000n);
    expect(sync.getUserShares(USER_A)).toBe(1_000_000_000n);
    expect(sync.getUserShares(USER_B)).toBe(0n);
    expect(sync.lastSyncedLedger()).toBe(100);
    expect(sync.getState().sharePrice).toBe(1.0);
  });

  test('yield accrual updates total assets and share price', () => {
    const sync = new SorobanVaultStateSync();
    sync.applyEvent({
      id: 'd1',
      type: 'DEPOSIT',
      ledger: 100,
      timestamp: 1750000000,
      txHash: 'a'.repeat(64),
      contractId: CONTRACT_ID,
      data: {
        depositor: USER_A,
        amount: 1_000_000_000n,
        sharesMinted: 1_000_000_000n,
        totalAssets: 1_000_000_000n,
        totalSupply: 1_000_000_000n
      }
    });
    sync.applyEvent({
      id: 'y1',
      type: 'YIELD_ACCRUAL',
      ledger: 101,
      timestamp: 1750003600,
      txHash: 'b'.repeat(64),
      contractId: CONTRACT_ID,
      data: { accruedYield: 50_000_000n, totalAssets: 1_050_000_000n, apy: 0.05 }
    });

    expect(sync.totalAssets()).toBe(1_050_000_000n);
    expect(sync.totalSupply()).toBe(1_000_000_000n);
    expect(sync.getState().sharePrice).toBe(1.05);
  });

  test('withdraw event burns shares and returns assets', () => {
    const sync = new SorobanVaultStateSync();
    sync.applyEvent({
      id: 'd1',
      type: 'DEPOSIT',
      ledger: 100,
      timestamp: 1750000000,
      txHash: 'a'.repeat(64),
      contractId: CONTRACT_ID,
      data: {
        depositor: USER_A,
        amount: 1_000_000_000n,
        sharesMinted: 1_000_000_000n,
        totalAssets: 1_000_000_000n,
        totalSupply: 1_000_000_000n
      }
    });
    sync.applyEvent({
      id: 'w1',
      type: 'WITHDRAW',
      ledger: 102,
      timestamp: 1750007200,
      txHash: 'c'.repeat(64),
      contractId: CONTRACT_ID,
      data: {
        withdrawer: USER_A,
        sharesBurned: 400_000_000n,
        assetsReturned: 400_000_000n,
        totalAssets: 600_000_000n,
        totalSupply: 600_000_000n
      }
    });

    expect(sync.totalAssets()).toBe(600_000_000n);
    expect(sync.totalSupply()).toBe(600_000_000n);
    expect(sync.getUserShares(USER_A)).toBe(600_000_000n);
  });

  test('reconcile resets mirrored totals to authoritative values', () => {
    const sync = new SorobanVaultStateSync();
    sync.reconcile(9_999_000_000n, 9_000_000_000n, 500);
    expect(sync.totalAssets()).toBe(9_999_000_000n);
    expect(sync.totalSupply()).toBe(9_000_000_000n);
    expect(sync.lastSyncedLedger()).toBe(500);
  });
});
