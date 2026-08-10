import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';
export interface IdentityRecord {
    address: string;
    identityHash: string;
    isAccredited: boolean;
    accreditationExpiry: number;
    jurisdiction: string;
    sanctioned: boolean;
}
export declare class SorobanIdentityHook implements IComplianceHook {
    name: string;
    private identityMap;
    private requireAccredited;
    constructor(requireAccredited?: boolean);
    /**
     * Register on-chain identity data from Soroban identity contract
     */
    registerIdentity(record: IdentityRecord): void;
    validateDeposit(context: DepositContext): Promise<ComplianceResult>;
    validateWithdraw(context: WithdrawContext): Promise<ComplianceResult>;
}
