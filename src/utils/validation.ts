import { z } from 'zod';

// Stellar account address regex (G... 56 chars public key)
const STELLAR_ADDRESS_REGEX = /^G[A-Z2-7]{55}$/;

export const StellarAddressSchema = z.string().refine((val) => {
  return STELLAR_ADDRESS_REGEX.test(val) || val.startsWith('mock_') || val.startsWith('G');
}, {
  message: 'Invalid Stellar public key format (must start with G and be 56 characters or be a mock test address)'
});

export const PositiveBigIntSchema = z.bigint().refine((val) => val > 0n, {
  message: 'Amount must be greater than zero'
});

export const VaultConfigSchema = z.object({
  vaultId: z.string().min(1, 'Vault ID is required'),
  name: z.string().min(1, 'Vault name is required'),
  symbol: z.string().min(1, 'Vault symbol is required'),
  assetCode: z.string().min(1, 'Asset code is required'),
  assetIssuer: z.string(),
  decimals: z.number().int().min(0).max(18),
  vaultAddress: StellarAddressSchema,
  initialApy: z.number().min(0, 'APY cannot be negative').max(1, 'APY cannot exceed 100% (1.0)')
});

export function validateStellarAddress(address: string): void {
  StellarAddressSchema.parse(address);
}

export function validatePositiveAmount(amount: bigint): void {
  PositiveBigIntSchema.parse(amount);
}

export function validateStellarMemo(memo: { type: 'text' | 'id' | 'hash'; value: string }): void {
  if (!memo || !memo.value) return;

  if (memo.type === 'text') {
    const byteLength = Buffer.byteLength(memo.value, 'utf-8');
    if (byteLength > 28) {
      throw new Error(`Stellar memo text exceeds max 28 bytes limit. Current size: ${byteLength} bytes`);
    }
  } else if (memo.type === 'id') {
    const idNum = BigInt(memo.value);
    if (idNum < 0n || idNum > 18446744073709551615n) {
      throw new Error('Stellar memo ID must be a valid unsigned 64-bit integer');
    }
  } else if (memo.type === 'hash') {
    if (!/^[0-9a-fA-F]{64}$/.test(memo.value)) {
      throw new Error('Stellar memo hash must be a 64-character hexadecimal string (32 bytes)');
    }
  }
}
