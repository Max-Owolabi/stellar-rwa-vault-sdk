"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccreditationReminderHook = void 0;
class AccreditationReminderHook {
    name = 'AccreditationReminderComplianceHook';
    records = new Map();
    warningWindowSeconds;
    constructor(warningWindowDays = 30) {
        this.warningWindowSeconds = warningWindowDays * 86400;
    }
    setRecord(record) {
        this.records.set(record.address, record);
    }
    /**
     * Check if address is within warning window of accreditation expiry
     */
    checkExpiryWarning(address, currentTimestamp = Math.floor(Date.now() / 1000)) {
        const record = this.records.get(address);
        if (!record)
            return { isExpiringSoon: false, daysRemaining: 0 };
        const timeRemaining = record.accreditationExpiry - currentTimestamp;
        if (timeRemaining <= 0) {
            return { isExpiringSoon: true, daysRemaining: 0 };
        }
        const isExpiringSoon = timeRemaining <= this.warningWindowSeconds;
        const daysRemaining = Math.floor(timeRemaining / 86400);
        return { isExpiringSoon, daysRemaining };
    }
    async validateDeposit(context) {
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
    async validateWithdraw(context) {
        return { allowed: true };
    }
}
exports.AccreditationReminderHook = AccreditationReminderHook;
