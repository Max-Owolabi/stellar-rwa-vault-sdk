import {
  VaultError,
  ComplianceError,
  YieldMathError,
  SDKValidationError,
  AssetAdapterError
} from '../src/errors';

describe('Custom SDK Error Hierarchy (Issue #21)', () => {
  test('VaultError sets name and code correctly', () => {
    const err = new VaultError('Test error', 'ERR_TEST');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(VaultError);
    expect(err.name).toBe('VaultError');
    expect(err.code).toBe('ERR_TEST');
  });

  test('ComplianceError inherits from VaultError', () => {
    const err = new ComplianceError('KYC failed', 'ERR_KYC_FAILED');
    expect(err).toBeInstanceOf(VaultError);
    expect(err.name).toBe('ComplianceError');
    expect(err.code).toBe('ERR_KYC_FAILED');
  });

  test('YieldMathError sets math code', () => {
    const err = new YieldMathError('Division by zero');
    expect(err).toBeInstanceOf(VaultError);
    expect(err.name).toBe('YieldMathError');
    expect(err.code).toBe('ERR_YIELD_MATH_FAILED');
  });

  test('SDKValidationError sets validation code', () => {
    const err = new SDKValidationError('Invalid address');
    expect(err).toBeInstanceOf(VaultError);
    expect(err.name).toBe('SDKValidationError');
    expect(err.code).toBe('ERR_VALIDATION_FAILED');
  });

  test('AssetAdapterError sets adapter error code', () => {
    const err = new AssetAdapterError('Transfer failed');
    expect(err).toBeInstanceOf(VaultError);
    expect(err.name).toBe('AssetAdapterError');
    expect(err.code).toBe('ERR_ASSET_ADAPTER_FAILED');
  });
});
