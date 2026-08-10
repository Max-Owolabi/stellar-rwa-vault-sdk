import { ComplianceResult, DepositContext, IComplianceHook, WithdrawContext } from '../types';
export interface WhitelistEntry {
    address: string;
    isKycVerified: boolean;
    isAccredited: boolean;
    jurisdiction: string;
    restricted: boolean;
}
export declare class SimpleWhitelistHook implements IComplianceHook {
    name: string;
    private whitelist;
    private allowedJurisdictions;
    constructor(allowedJurisdictions?: string[]);
    /**
     * Register or update a user's compliance whitelist record
     */
    setWhitelisted(entry: WhitelistEntry): void;
    /**
     * Remove a user from the compliance whitelist
     */
    revokeWhitelist(address: string): void;
    validateDeposit(context: DepositContext): Promise<ComplianceResult>;
    validateWithdraw(context: WithdrawContext): Promise<ComplianceResult>;
}
