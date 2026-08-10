import { z } from 'zod';
export declare const StellarAddressSchema: z.ZodEffects<z.ZodString, string, string>;
export declare const PositiveBigIntSchema: z.ZodEffects<z.ZodBigInt, bigint, bigint>;
export declare const VaultConfigSchema: z.ZodObject<{
    vaultId: z.ZodString;
    name: z.ZodString;
    symbol: z.ZodString;
    assetCode: z.ZodString;
    assetIssuer: z.ZodString;
    decimals: z.ZodNumber;
    vaultAddress: z.ZodEffects<z.ZodString, string, string>;
    initialApy: z.ZodNumber;
    maxTotalAssets: z.ZodOptional<z.ZodEffects<z.ZodBigInt, bigint, bigint>>;
}, "strip", z.ZodTypeAny, {
    symbol: string;
    vaultId: string;
    name: string;
    assetCode: string;
    assetIssuer: string;
    decimals: number;
    vaultAddress: string;
    initialApy: number;
    maxTotalAssets?: bigint | undefined;
}, {
    symbol: string;
    vaultId: string;
    name: string;
    assetCode: string;
    assetIssuer: string;
    decimals: number;
    vaultAddress: string;
    initialApy: number;
    maxTotalAssets?: bigint | undefined;
}>;
export declare function validateStellarAddress(address: string): void;
export declare function validatePositiveAmount(amount: bigint): void;
export declare function validateStellarMemo(memo: {
    type: 'text' | 'id' | 'hash';
    value: string;
}): void;
export declare function validateStellarMinReserve(accountBalanceXlm: number, subentries?: number): void;
