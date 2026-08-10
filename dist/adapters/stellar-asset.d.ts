import { IAssetAdapter } from '../types';
export declare class StellarAssetAdapter implements IAssetAdapter {
    assetCode: string;
    issuer: string;
    decimals: number;
    private balances;
    constructor(assetCode?: string, issuer?: string, decimals?: number);
    /**
     * Set balance for testing/sandbox setup
     */
    setMockBalance(address: string, amount: bigint): void;
    getBalance(address: string): Promise<bigint>;
    transfer(from: string, to: string, amount: bigint): Promise<boolean>;
}
