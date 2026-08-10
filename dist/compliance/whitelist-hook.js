"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleWhitelistHook = void 0;
class SimpleWhitelistHook {
    name = 'SimpleWhitelistComplianceHook';
    whitelist = new Map();
    allowedJurisdictions;
    constructor(allowedJurisdictions = ['US', 'EU', 'UK', 'SG', 'GLOBAL']) {
        this.allowedJurisdictions = new Set(allowedJurisdictions);
    }
    /**
     * Register or update a user's compliance whitelist record
     */
    setWhitelisted(entry) {
        this.whitelist.set(entry.address, entry);
    }
    /**
     * Remove a user from the compliance whitelist
     */
    revokeWhitelist(address) {
        this.whitelist.delete(address);
    }
    async validateDeposit(context) {
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
    async validateWithdraw(context) {
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
exports.SimpleWhitelistHook = SimpleWhitelistHook;
