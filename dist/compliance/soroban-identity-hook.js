"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SorobanIdentityHook = void 0;
class SorobanIdentityHook {
    name = 'SorobanIdentityRegistryComplianceHook';
    identityMap = new Map();
    requireAccredited;
    constructor(requireAccredited = true) {
        this.requireAccredited = requireAccredited;
    }
    /**
     * Register on-chain identity data from Soroban identity contract
     */
    registerIdentity(record) {
        this.identityMap.set(record.address, record);
    }
    async validateDeposit(context) {
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
    async validateWithdraw(context) {
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
exports.SorobanIdentityHook = SorobanIdentityHook;
