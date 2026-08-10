import { IAssetAdapter } from '../types';

export class StellarAssetAdapter implements IAssetAdapter {
  public assetCode: string;
  public issuer: string;
  public decimals: number;

  // Mock balance ledger for testing & sandbox environment
  private balances: Map<string, bigint> = new Map();

  constructor(assetCode: string = 'USDC', issuer: string = 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D', decimals: number = 7) {
    this.assetCode = assetCode;
    this.issuer = issuer;
    this.decimals = decimals;
  }

  /**
   * Set balance for testing/sandbox setup
   */
  public setMockBalance(address: string, amount: bigint): void {
    this.balances.set(address, amount);
  }

  public async getBalance(address: string): Promise<bigint> {
    return this.balances.get(address) ?? 0n;
  }

  public async transfer(from: string, to: string, amount: bigint): Promise<boolean> {
    if (amount <= 0n) return false;

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
