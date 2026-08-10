export interface VaultConfig {
    vaultId: string;
    name: string;
    symbol: string;
    assetCode: string;
    assetIssuer: string;
    decimals: number;
    vaultAddress: string;
    initialApy: number;
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
