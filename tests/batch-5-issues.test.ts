import { RWAStandardVault } from '../src/core/vault';
import { StellarAssetAdapter } from '../src/adapters/stellar-asset';
import { SimpleWhitelistHook } from '../src/compliance/whitelist-hook';
import { VaultConfig } from '../src/types';

describe('Batch 5 Resolved Issues Test Suite (#46, #47, #48, #54, #62)', () => {
  let vault: RWAStandardVault;
  let assetAdapter: StellarAssetAdapter;
  let whitelistHook: SimpleWhitelistHook;

  const mockUser = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272A';
  const mockVaultAddr = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012';

  const config: VaultConfig = {
    vaultId: 'vault-batch5-01',
    name: 'Stellar RWA Treasury Vault',
    symbol: 'rwaUSDC',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7,
    vaultAddress: mockVaultAddr,
    initialApy: 0.05,
    metadata: { environment: 'testnet', manager: 'Maxima-Steller' } // Issue #47
  };

  beforeEach(() => {
    assetAdapter = new StellarAssetAdapter('USDC', config.assetIssuer, 7);
    whitelistHook = new SimpleWhitelistHook(['US']);

    vault = new RWAStandardVault(config, assetAdapter);
    vault.addComplianceHook(whitelistHook);

    whitelistHook.setWhitelisted({
      address: mockUser,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: false
    });

    assetAdapter.setMockBalance(mockUser, 100_000_000_000n);
    assetAdapter.setMockBalance(mockVaultAddr, 0n);
  });

  test('Issue #47: Accepts optional metadata in VaultConfig', () => {
    expect(vault.config.metadata?.environment).toBe('testnet');
    expect(vault.config.metadata?.manager).toBe('Maxima-Steller');
  });

  test('Issue #46: Pause and Unpause circuit breaker functionality', async () => {
    vault.pause();
    expect(vault.isPaused()).toBe(true);

    const depositRes = await vault.deposit(mockUser, 1000n);
    expect(depositRes.status).toBe('REJECTED');
    expect(depositRes.rejectionReason).toContain('currently paused');

    vault.unpause();
    expect(vault.isPaused()).toBe(false);

    const validDeposit = await vault.deposit(mockUser, 1000n);
    expect(validDeposit.status).toBe('SUCCESS');
  });

  test('Issue #62: Maximum deposit cap enforcement', async () => {
    vault.setMaxDepositCap(5000n);
    expect(vault.getMaxDepositCap()).toBe(5000n);

    // Deposit 4,000 passes
    const dep1 = await vault.deposit(mockUser, 4000n);
    expect(dep1.status).toBe('SUCCESS');

    // Deposit another 2,000 exceeds 5,000 cap and fails
    const dep2 = await vault.deposit(mockUser, 2000n);
    expect(dep2.status).toBe('REJECTED');
    expect(dep2.rejectionReason).toContain('exceeds maximum vault cap');
  });

  test('Issue #54: User share percentage calculator', async () => {
    const user2 = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272B';
    whitelistHook.setWhitelisted({
      address: user2,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: false
    });
    assetAdapter.setMockBalance(user2, 50_000_000_000n);

    await vault.deposit(mockUser, 3000n);
    await vault.deposit(user2, 1000n);

    // Total supply = 4000 shares. User 1 has 3000 (75%), User 2 has 1000 (25%)
    expect(vault.getUserSharePercentage(mockUser)).toBe(0.75);
    expect(vault.getUserSharePercentage(user2)).toBe(0.25);
  });

  test('Issue #48: Rolling 24-hour volume aggregator', async () => {
    const t0 = 100000;
    await vault.deposit(mockUser, 5000n, t0);
    await vault.withdraw(mockUser, 1000n, t0 + 1000);

    // Query 24h volume at t0 + 2000
    const vol = vault.getRolling24HourVolume(t0 + 2000);
    expect(vol.depositVolume).toBe(5000n);
    expect(vol.withdrawVolume).toBe(1000n);

    // Fast forward past 24 hours (86,400 seconds)
    const oldVol = vault.getRolling24HourVolume(t0 + 100000);
    expect(oldVol.depositVolume).toBe(0n);
    expect(oldVol.withdrawVolume).toBe(0n);
  });
});
