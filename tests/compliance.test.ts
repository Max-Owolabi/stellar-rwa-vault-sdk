import { SimpleWhitelistHook } from '../src/compliance/whitelist-hook';

describe('SimpleWhitelistHook Enforcement', () => {
  let hook: SimpleWhitelistHook;
  const user = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';

  beforeEach(() => {
    hook = new SimpleWhitelistHook(['US', 'SG']);
  });

  test('Validates compliant user in permitted jurisdiction', async () => {
    hook.setWhitelisted({
      address: user,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: false
    });

    const res = await hook.validateDeposit({
      depositor: user,
      amount: 100n,
      assetCode: 'USDC',
      timestamp: 1000
    });

    expect(res.allowed).toBe(true);
  });

  test('Rejects user from non-permitted jurisdiction', async () => {
    hook.setWhitelisted({
      address: user,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'IR', // Not in ['US', 'SG']
      restricted: false
    });

    const res = await hook.validateDeposit({
      depositor: user,
      amount: 100n,
      assetCode: 'USDC',
      timestamp: 1000
    });

    expect(res.allowed).toBe(false);
    expect(res.code).toBe('ERR_JURISDICTION_NOT_ALLOWED');
  });

  test('Rejects restricted account', async () => {
    hook.setWhitelisted({
      address: user,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: true
    });

    const res = await hook.validateWithdraw({
      withdrawer: user,
      shares: 50n,
      expectedAssets: 50n,
      assetCode: 'USDC',
      timestamp: 1000
    });

    expect(res.allowed).toBe(false);
    expect(res.code).toBe('ERR_ACCOUNT_RESTRICTED');
  });
});
