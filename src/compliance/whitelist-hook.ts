import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';

export interface WhitelistEntry {
  address: string;
  isKycVerified: boolean;
  isAccredited: boolean;
  jurisdiction: string;
  restricted: boolean;
}

export class SimpleWhitelistHook implements IComplianceHook {
  public name = 'SimpleWhitelistComplianceHook';
  private whitelist: Map<string, WhitelistEntry> = new Map();
  private allowedJurisdictions: Set<string>;

  constructor(allowedJurisdictions: string[] = ['US', 'EU', 'UK', 'SG', 'GLOBAL']) {
    this.allowedJurisdictions = new Set(allowedJurisdictions);
  }

  /**
   * Register or update a user's compliance whitelist record
   */
  public setWhitelisted(entry: WhitelistEntry): void {
    this.whitelist.set(entry.address, entry);
  }

  /**
   * Remove a user from the compliance whitelist
   */
  public revokeWhitelist(address: string): void {
    this.whitelist.delete(address);
  }

  public async validateDeposit(context: DepositContext): Promise<ComplianceResult> {
    const entry = this.whitelist.get(context.depositor);

    if (!entry) {
      return {
        allowed: false,
        reason: `Address ${context.depositor} is not KYC verified or whitelisted for deposits.`,
        code: 'ERR_NOT_WHITELISTED'
      };
    }

    if (entry.restricted) {
      return {
        allowed: false,
        reason: `Address ${context.depositor} has been compliance restricted.`,
        code: 'ERR_ACCOUNT_RESTRICTED'
      };
    }

    if (!entry.isKycVerified) {
      return {
        allowed: false,
        reason: `Address ${context.depositor} lacks active KYC verification.`,
        code: 'ERR_KYC_REQUIRED'
      };
    }

    if (!this.allowedJurisdictions.has(entry.jurisdiction)) {
      return {
        allowed: false,
        reason: `Jurisdiction '${entry.jurisdiction}' is not permitted in this vault.`,
        code: 'ERR_JURISDICTION_NOT_ALLOWED'
      };
    }

    return { allowed: true };
  }

  public async validateWithdraw(context: WithdrawContext): Promise<ComplianceResult> {
    const entry = this.whitelist.get(context.withdrawer);

    if (!entry) {
      return {
        allowed: false,
        reason: `Address ${context.withdrawer} is not whitelisted for withdrawals.`,
        code: 'ERR_NOT_WHITELISTED'
      };
    }

    if (entry.restricted) {
      return {
        allowed: false,
        reason: `Address ${context.withdrawer} is compliance restricted from withdrawing.`,
        code: 'ERR_ACCOUNT_RESTRICTED'
      };
    }

    return { allowed: true };
  }
}
