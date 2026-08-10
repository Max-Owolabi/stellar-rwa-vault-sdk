import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';

export interface IdentityRecord {
  address: string;
  identityHash: string;
  isAccredited: boolean;
  accreditationExpiry: number; // Unix timestamp
  jurisdiction: string;
  sanctioned: boolean;
}

export class SorobanIdentityHook implements IComplianceHook {
  public name = 'SorobanIdentityRegistryComplianceHook';
  private identityMap: Map<string, IdentityRecord> = new Map();
  private requireAccredited: boolean;

  constructor(requireAccredited: boolean = true) {
    this.requireAccredited = requireAccredited;
  }

  /**
   * Register on-chain identity data from Soroban identity contract
   */
  public registerIdentity(record: IdentityRecord): void {
    this.identityMap.set(record.address, record);
  }

  public async validateDeposit(context: DepositContext): Promise<ComplianceResult> {
    const record = this.identityMap.get(context.depositor);

    if (!record) {
      return {
        allowed: false,
        reason: `No Soroban identity record found for address ${context.depositor}`,
        code: 'ERR_SOROBAN_IDENTITY_NOT_FOUND'
      };
    }

    if (record.sanctioned) {
      return {
        allowed: false,
        reason: `Address ${context.depositor} matches OFAC / Sanction watchlists on Soroban Identity Registry`,
        code: 'ERR_SANCTIONED_ADDRESS'
      };
    }

    if (this.requireAccredited) {
      if (!record.isAccredited) {
        return {
          allowed: false,
          reason: `Vault requires accredited investor status. Address ${context.depositor} is unaccredited.`,
          code: 'ERR_ACCREDITATION_REQUIRED'
        };
      }

      if (record.accreditationExpiry < context.timestamp) {
        return {
          allowed: false,
          reason: `Accreditation for address ${context.depositor} expired at timestamp ${record.accreditationExpiry}`,
          code: 'ERR_ACCREDITATION_EXPIRED'
        };
      }
    }

    return { allowed: true };
  }

  public async validateWithdraw(context: WithdrawContext): Promise<ComplianceResult> {
    const record = this.identityMap.get(context.withdrawer);

    if (!record) {
      return {
        allowed: false,
        reason: `No Soroban identity record found for address ${context.withdrawer}`,
        code: 'ERR_SOROBAN_IDENTITY_NOT_FOUND'
      };
    }

    if (record.sanctioned) {
      return {
        allowed: false,
        reason: `Address ${context.withdrawer} is sanctioned. Withdrawals frozen.`,
        code: 'ERR_SANCTIONED_ADDRESS'
      };
    }

    return { allowed: true };
  }
}
