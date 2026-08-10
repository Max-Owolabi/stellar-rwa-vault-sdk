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
}, "strip", z.ZodTypeAny, {
    symbol: string;
    vaultId: string;
    name: string;
    assetCode: string;
    assetIssuer: string;
    decimals: number;
    vaultAddress: string;
    initialApy: number;
}, {
    symbol: string;
    vaultId: string;
    name: string;
    assetCode: string;
    assetIssuer: string;
    decimals: number;
    vaultAddress: string;
    initialApy: number;
}>;
export declare function validateStellarAddress(address: string): void;
export declare function validatePositiveAmount(amount: bigint): void;
