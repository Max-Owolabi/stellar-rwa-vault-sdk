import { RWAStandardVault } from '../src/core/vault';
import { StellarAssetAdapter } from '../src/adapters/stellar-asset';
import { SimpleWhitelistHook } from '../src/compliance/whitelist-hook';
import { VaultConfig } from '../src/types';

describe('Flash loan attack prevention / single-block deposit-withdraw lock (Issue #70)', () => {
  let assetAdapter: StellarAssetAdapter;
  let whitelistHook: SimpleWhitelistHook;

  const mockUser = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';
  const mockVaultAddr = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M';

  const baseConfig: VaultConfig = {
    vaultId: 'vault-usdc-01',
    name: 'Stellar RWA Treasury Bill Vault',
    symbol: 'rwaUSDC',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7,
    vaultAddress: mockVaultAddr,
    initialApy: 0.05
  };

  function makeVault(config: VaultConfig): RWAStandardVault {
    const vault = new RWAStandardVault(config, assetAdapter);
    vault.addComplianceHook(whitelistHook);
    return vault;
  }

  beforeEach(() => {
    assetAdapter = new StellarAssetAdapter('USDC', baseConfig.assetIssuer, 7);
    whitelistHook = new SimpleWhitelistHook(['US']);

    whitelistHook.setWhitelisted({
      address: mockUser,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: false
    });

    assetAdapter.setMockBalance(mockUser, 10_000_000_000n);
    // Funded generously so tiny yield accrual between deposit and a
    // post-guard-window withdrawal doesn't hit the mock ledger's balance
    // check; these tests are about the guard, not yield-vs-balance accounting.
    assetAdapter.setMockBalance(mockVaultAddr, 10_000_000_000n);
  });

  test('blocks a withdrawal in the same block (timestamp) as a deposit by default', async () => {
    const vault = makeVault(baseConfig);
    const t = 1_700_000_000;

    const depositRes = await vault.deposit(mockUser, 1_000_000_000n, t);
    expect(depositRes.status).toBe('SUCCESS');

    const withdrawRes = await vault.withdraw(mockUser, depositRes.sharesMinted, t);
    expect(withdrawRes.status).toBe('REJECTED');
    expect(withdrawRes.rejectionReason).toMatch(/Flash loan guard/);
    expect(withdrawRes.sharesBurned).toBe(0n);

    // Vault state must be unchanged by the rejected withdrawal
    expect(vault.getUserShares(mockUser)).toBe(depositRes.sharesMinted);
  });

  test('allows the withdrawal once a single second has elapsed past the deposit block', async () => {
    const vault = makeVault(baseConfig);
    const t = 1_700_000_000;

    const depositRes = await vault.deposit(mockUser, 1_000_000_000n, t);
    const withdrawRes = await vault.withdraw(mockUser, depositRes.sharesMinted, t + 1);

    expect(withdrawRes.status).toBe('SUCCESS');
    expect(withdrawRes.sharesBurned).toBe(depositRes.sharesMinted);
  });

  test('honors a configured flashLoanGuardSeconds window longer than one block', async () => {
    const vault = makeVault({ ...baseConfig, flashLoanGuardSeconds: 300 });
    const t = 1_700_000_000;

    const depositRes = await vault.deposit(mockUser, 1_000_000_000n, t);

    const tooSoon = await vault.withdraw(mockUser, depositRes.sharesMinted, t + 299);
    expect(tooSoon.status).toBe('REJECTED');
    expect(tooSoon.rejectionReason).toMatch(/Flash loan guard/);

    const afterWindow = await vault.withdraw(mockUser, depositRes.sharesMinted, t + 301);
    expect(afterWindow.status).toBe('SUCCESS');
  });

  test('does not lock a user who has never deposited', async () => {
    const vault = makeVault(baseConfig);
    // withdrawer with zero shares and no deposit history should fail on the
    // share-balance check, not the flash loan guard
    const res = await vault.withdraw(mockUser, 1_000n, 1_700_000_000);
    expect(res.status).toBe('REJECTED');
    expect(res.rejectionReason).toMatch(/Insufficient shares/);
  });

  test('remainingFlashLoanLockSeconds reports the lock window accurately', async () => {
    const vault = makeVault({ ...baseConfig, flashLoanGuardSeconds: 60 });
    const t = 1_700_000_000;

    expect(vault.remainingFlashLoanLockSeconds(mockUser, t)).toBe(0);

    await vault.deposit(mockUser, 1_000_000_000n, t);
    expect(vault.remainingFlashLoanLockSeconds(mockUser, t)).toBe(61);
    expect(vault.remainingFlashLoanLockSeconds(mockUser, t + 30)).toBe(31);
    expect(vault.remainingFlashLoanLockSeconds(mockUser, t + 61)).toBe(0);
  });

  test('a second, later deposit refreshes the lock window', async () => {
    const vault = makeVault(baseConfig);
    const t = 1_700_000_000;

    const first = await vault.deposit(mockUser, 500_000_000n, t);
    const secondWithdrawAttempt = await vault.deposit(mockUser, 500_000_000n, t + 10);
    expect(secondWithdrawAttempt.status).toBe('SUCCESS');

    // Immediately after the second deposit, withdrawing at the same block is blocked again
    const blocked = await vault.withdraw(
      mockUser,
      first.sharesMinted + secondWithdrawAttempt.sharesMinted,
      t + 10
    );
    expect(blocked.status).toBe('REJECTED');
    expect(blocked.rejectionReason).toMatch(/Flash loan guard/);
  });
});
