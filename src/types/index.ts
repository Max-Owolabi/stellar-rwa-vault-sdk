export interface VaultConfig {
  vaultId: string;
  name: string;
  symbol: string;
  assetCode: string;
  assetIssuer: string;
  decimals: number;
  vaultAddress: string;
  initialApy: number; // e.g. 0.05 for 5% APY
  maxTotalAssets?: bigint; // optional cap on total underlying assets held by the vault; undefined/0 = uncapped
  flashLoanGuardSeconds?: number; // min seconds an address must wait after depositing before it may withdraw; 0 (default) blocks same-block deposit+withdraw, undefined behaves as 0
}

export interface DepositContext {
  depositor: string;
  amount: bigint;
  assetCode: string;
  timestamp: number;
}

export interface WithdrawContext {
  withdrawer: string;
  shares: bigint;
  expectedAssets: bigint;
  assetCode: string;
  timestamp: number;
}

export interface ComplianceResult {
  allowed: boolean;
  reason?: string;
  code?: string;
}

export interface IComplianceHook {
  name: string;
  validateDeposit(context: DepositContext): Promise<ComplianceResult>;
  validateWithdraw(context: WithdrawContext): Promise<ComplianceResult>;
}

export interface IAssetAdapter {
  assetCode: string;
  issuer: string;
  decimals: number;
  getBalance(address: string): Promise<bigint>;
  transfer(from: string, to: string, amount: bigint): Promise<boolean>;
}

export interface DepositResult {
  sharesMinted: bigint;
  assetsDeposited: bigint;
  depositor: string;
  timestamp: number;
  status: 'SUCCESS' | 'REJECTED';
  rejectionReason?: string;
}

export interface WithdrawResult {
  sharesBurned: bigint;
  assetsReturned: bigint;
  withdrawer: string;
  timestamp: number;
  status: 'SUCCESS' | 'REJECTED';
  rejectionReason?: string;
}

export interface VaultState {
  totalAssets: bigint;
  totalSupply: bigint;
  sharePrice: number;
  lastYieldAccrual: number;
  currentApy: number;
}

export interface VaultEventFilter {
  eventType?: 'DEPOSIT' | 'WITHDRAW' | 'YIELD_ACCRUAL';
  address?: string;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export type VaultEventType = 'DEPOSIT' | 'WITHDRAW' | 'YIELD_ACCRUAL';

export interface DepositVaultEventData {
  depositor: string;
  amount: bigint;
  sharesMinted: bigint;
  totalAssets: bigint;
  totalSupply: bigint;
}

export interface WithdrawVaultEventData {
  withdrawer: string;
  sharesBurned: bigint;
  assetsReturned: bigint;
  totalAssets: bigint;
  totalSupply: bigint;
}

export interface YieldAccrualVaultEventData {
  accruedYield: bigint;
  totalAssets: bigint;
  apy?: number; // decimal APY (e.g. 0.05 for 5%), decoded from on-chain basis points
}

export type VaultEventData =
  | DepositVaultEventData
  | WithdrawVaultEventData
  | YieldAccrualVaultEventData;

interface BaseVaultEvent {
  id: string;
  ledger: number;
  timestamp: number; // Unix seconds derived from ledger close time
  txHash: string;
  contractId: string;
}

export interface DepositVaultEvent extends BaseVaultEvent {
  type: 'DEPOSIT';
  data: DepositVaultEventData;
}

export interface WithdrawVaultEvent extends BaseVaultEvent {
  type: 'WITHDRAW';
  data: WithdrawVaultEventData;
}

export interface YieldAccrualVaultEvent extends BaseVaultEvent {
  type: 'YIELD_ACCRUAL';
  data: YieldAccrualVaultEventData;
}

/**
 * A normalized, application-ready vault event decoded from a raw Soroban
 * contract event log emitted by an on-chain RWA vault contract.
 */
export type VaultEvent = DepositVaultEvent | WithdrawVaultEvent | YieldAccrualVaultEvent;

export interface SorobanEventIndexerConfig {
  rpcUrl: string;
  vaultContractId: string;
  pollIntervalMs?: number;
  startLedger?: number;
}

export type VaultEventListener = (event: VaultEvent) => void;
