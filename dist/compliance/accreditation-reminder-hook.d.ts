import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';
export interface AccreditationExpiryRecord {
    address: string;
    accreditationExpiry: number;
}
export declare class AccreditationReminderHook implements IComplianceHook {
    name: string;
    private records;
    private warningWindowSeconds;
    constructor(warningWindowDays?: number);
    setRecord(record: AccreditationExpiryRecord): void;
    /**
     * Check if address is within warning window of accreditation expiry
     */
    checkExpiryWarning(address: string, currentTimestamp?: number): {
        isExpiringSoon: boolean;
        daysRemaining: number;
    };
    validateDeposit(context: DepositContext): Promise<ComplianceResult>;
    validateWithdraw(context: WithdrawContext): Promise<ComplianceResult>;
}
