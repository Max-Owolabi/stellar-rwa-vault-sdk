import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';

export interface AccreditationExpiryRecord {
  address: string;
  accreditationExpiry: number; // Unix timestamp
}

export class AccreditationReminderHook implements IComplianceHook {
  public name = 'AccreditationReminderComplianceHook';
  private records: Map<string, AccreditationExpiryRecord> = new Map();
  private warningWindowSeconds: number;

  constructor(warningWindowDays: number = 30) {
    this.warningWindowSeconds = warningWindowDays * 86400;
  }

  public setRecord(record: AccreditationExpiryRecord): void {
    this.records.set(record.address, record);
  }

  /**
   * Check if address is within warning window of accreditation expiry
   */
  public checkExpiryWarning(address: string, currentTimestamp: number = Math.floor(Date.now() / 1000)): {
    isExpiringSoon: boolean;
    daysRemaining: number;
  } {
    const record = this.records.get(address);
    if (!record) return { isExpiringSoon: false, daysRemaining: 0 };

    const timeRemaining = record.accreditationExpiry - currentTimestamp;
    if (timeRemaining <= 0) {
      return { isExpiringSoon: true, daysRemaining: 0 };
    }

    const isExpiringSoon = timeRemaining <= this.warningWindowSeconds;
    const daysRemaining = Math.floor(timeRemaining / 86400);

    return { isExpiringSoon, daysRemaining };
  }

  public async validateDeposit(context: DepositContext): Promise<ComplianceResult> {
    const record = this.records.get(context.depositor);
    if (record && record.accreditationExpiry < context.timestamp) {
      return {
        allowed: false,
        reason: `Accreditation for ${context.depositor} expired. Re-verification required.`,
        code: 'ERR_ACCREDITATION_EXPIRED'
      };
    }
    return { allowed: true };
  }

  public async validateWithdraw(context: WithdrawContext): Promise<ComplianceResult> {
    return { allowed: true };
  }
}
