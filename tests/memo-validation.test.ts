import { validateStellarMemo } from '../src/utils/validation';

describe('Stellar Memo Field Validation (Issue #14)', () => {
  test('Validates compliant memo text under 28 bytes', () => {
    expect(() => {
      validateStellarMemo({ type: 'text', value: 'Vault Deposit #12345' });
    }).not.toThrow();
  });

  test('Rejects memo text exceeding 28 bytes', () => {
    expect(() => {
      validateStellarMemo({
        type: 'text',
        value: 'This is a very long memo message that exceeds twenty eight bytes'
      });
    }).toThrow('Stellar memo text exceeds max 28 bytes limit');
  });

  test('Validates compliant memo ID', () => {
    expect(() => {
      validateStellarMemo({ type: 'id', value: '1234567890123' });
    }).not.toThrow();
  });

  test('Validates 64-hex character memo hash', () => {
    const hash = 'a'.repeat(64);
    expect(() => {
      validateStellarMemo({ type: 'hash', value: hash });
    }).not.toThrow();
  });

  test('Rejects invalid memo hash length', () => {
    expect(() => {
      validateStellarMemo({ type: 'hash', value: 'short_hash' });
    }).toThrow('Stellar memo hash must be a 64-character hexadecimal string');
  });
});
