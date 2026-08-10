import { SorobanIdentityHook } from '../src/compliance/soroban-identity-hook';

describe('SorobanIdentityHook Enforcement', () => {
  let hook: SorobanIdentityHook;
  const user = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';

  beforeEach(() => {
    hook = new SorobanIdentityHook(true);
  });

  test('Approves accredited non-sanctioned investor with active accreditation', async () => {
    hook.registerIdentity({
      address: user,
      identityHash: '0x123abc456def',
      isAccredited: true,
      accreditationExpiry: 2000000000,
      jurisdiction: 'US',
      sanctioned: false
    });

    const res = await hook.validateDeposit({
      depositor: user,
      amount: 1000n,
      assetCode: 'USDY',
      timestamp: 1700000000
    });

    expect(res.allowed).toBe(true);
  });

  test('Rejects unaccredited investor when accreditation required', async () => {
    hook.registerIdentity({
      address: user,
      identityHash: '0x123abc456def',
      isAccredited: false,
      accreditationExpiry: 2000000000,
      jurisdiction: 'US',
      sanctioned: false
    });

    const res = await hook.validateDeposit({
      depositor: user,
      amount: 1000n,
      assetCode: 'USDY',
      timestamp: 1700000000
    });

    expect(res.allowed).toBe(false);
    expect(res.code).toBe('ERR_ACCREDITATION_REQUIRED');
  });

  test('Rejects sanctioned address for withdrawals', async () => {
    hook.registerIdentity({
      address: user,
      identityHash: '0xbadbadbad',
      isAccredited: true,
      accreditationExpiry: 2000000000,
      jurisdiction: 'US',
      sanctioned: true
    });

    const res = await hook.validateWithdraw({
      withdrawer: user,
      shares: 500n,
      expectedAssets: 500n,
      assetCode: 'USDY',
      timestamp: 1700000000
    });

    expect(res.allowed).toBe(false);
    expect(res.code).toBe('ERR_SANCTIONED_ADDRESS');
  });
});
