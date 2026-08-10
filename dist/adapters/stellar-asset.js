"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StellarAssetAdapter = void 0;
class StellarAssetAdapter {
    assetCode;
    issuer;
    decimals;
    // Mock balance ledger for testing & sandbox environment
    balances = new Map();
    constructor(assetCode = 'USDC', issuer = 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D', decimals = 7) {
        this.assetCode = assetCode;
        this.issuer = issuer;
        this.decimals = decimals;
    }
    /**
     * Set balance for testing/sandbox setup
     */
    setMockBalance(address, amount) {
        this.balances.set(address, amount);
    }
    async getBalance(address) {
        return this.balances.get(address) ?? 0n;
    }
    async transfer(from, to, amount) {
        if (amount <= 0n)
            return false;
        const senderBalance = await this.getBalance(from);
        if (senderBalance < amount) {
            throw new Error(`Insufficient asset balance for transfer. Account ${from} has ${senderBalance}, requested ${amount}`);
        }
        const recipientBalance = await this.getBalance(to);
        this.balances.set(from, senderBalance - amount);
        this.balances.set(to, recipientBalance + amount);
        return true;
    }
}
exports.StellarAssetAdapter = StellarAssetAdapter;
