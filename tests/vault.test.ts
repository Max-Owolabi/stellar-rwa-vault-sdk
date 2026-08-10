import { RWAStandardVault } from '../src/core/vault';
import { StellarAssetAdapter } from '../src/adapters/stellar-asset';
import { SimpleWhitelistHook } from '../src/compliance/whitelist-hook';
import { VaultConfig } from '../src/types';

describe('RWAStandardVault Core Functionality', () => {
  let vault: RWAStandardVault;
  let assetAdapter: StellarAssetAdapter;
  let whitelistHook: SimpleWhitelistHook;

  const mockUser = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';
  const mockVaultAddr = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M';

  const config: VaultConfig = {
    vaultId: 'vault-usdc-01',
    name: 'Stellar RWA Treasury Bill Vault',
    symbol: 'rwaUSDC',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7,
    vaultAddress: mockVaultAddr,
    initialApy: 0.05 // 5% APY
  };

  beforeEach(() => {
    assetAdapter = new StellarAssetAdapter('USDC', config.assetIssuer, 7);
    whitelistHook = new SimpleWhitelistHook(['US']);

    vault = new RWAStandardVault(config, assetAdapter);
    vault.addComplianceHook(whitelistHook);

    // Whitelist test user
    whitelistHook.setWhitelisted({
      address: mockUser,
      isKycVerified: true,
      isAccredited: true,
      jurisdiction: 'US',
      restricted: false
    });

    // Fund test user with 1,000 USDC (10,000,000,000 stroops)
    assetAdapter.setMockBalance(mockUser, 10_000_000_000n);
    assetAdapter.setMockBalance(mockVaultAddr, 0n);
  });

  test('Deposit successful for whitelisted user', async () => {
    const depositAmount = 1_000_000_000n; // 100 USDC
    const res = await vault.deposit(mockUser, depositAmount);

    expect(res.status).toBe('SUCCESS');
    expect(res.sharesMinted).toBe(depositAmount);
    expect(vault.totalAssets()).toBe(depositAmount);
    expect(vault.totalSupply()).toBe(depositAmount);
    expect(vault.getUserShares(mockUser)).toBe(depositAmount);
    expect(await assetAdapter.getBalance(mockVaultAddr)).toBe(depositAmount);
  });

  test('Deposit rejected for non-whitelisted user', async () => {
    const nonKycUser = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F3';
    assetAdapter.setMockBalance(nonKycUser, 1_000_000_000n);

    const res = await vault.deposit(nonKycUser, 100_000_000n);

    expect(res.status).toBe('REJECTED');
    expect(res.rejectionReason).toContain('not KYC verified or whitelisted');
    expect(vault.totalAssets()).toBe(0n);
  });

  test('Withdraw returns proportional underlying assets after yield accrual', async () => {
    const startTime = 1000000;
    const depositAmount = 1_000_000_000n;

    // 1. Initial Deposit
    await vault.deposit(mockUser, depositAmount, startTime);

    // 2. Fast forward 1 year (31,536,000 seconds) at 5% APY
    const oneYearLater = startTime + 31_536_000;

    // 3. Withdraw full share balance
    const withdrawRes = await vault.withdraw(mockUser, depositAmount, oneYearLater);

    expect(withdrawRes.status).toBe('SUCCESS');
    // At 5% APY over 1 year, 1,000,000,000 yields 50,000,000 asset units extra
    expect(withdrawRes.assetsReturned).toBe(1_050_000_000n);
    expect(vault.getUserShares(mockUser)).toBe(0n);
    expect(vault.totalAssets()).toBe(0n);
    expect(vault.totalSupply()).toBe(0n);
  });

  test('Deposit rejected when it would exceed configured maxTotalAssets cap', async () => {
    const cappedConfig: VaultConfig = {
      ...config,
      maxTotalAssets: 500_000_000n // 50 USDC cap
    };
    const cappedVault = new RWAStandardVault(cappedConfig, assetAdapter);
    cappedVault.addComplianceHook(whitelistHook);

    const res = await cappedVault.deposit(mockUser, 1_000_000_000n);

    expect(res.status).toBe('REJECTED');
    expect(res.rejectionReason).toContain('exceeds vault maximum capacity');
    expect(cappedVault.totalAssets()).toBe(0n);
  });

  test('Deposit succeeds up to the maxTotalAssets cap and reports remaining capacity', async () => {
    const cappedConfig: VaultConfig = {
      ...config,
      maxTotalAssets: 500_000_000n // 50 USDC cap
    };
    const cappedVault = new RWAStandardVault(cappedConfig, assetAdapter);
    cappedVault.addComplianceHook(whitelistHook);

    expect(cappedVault.remainingDepositCapacity()).toBe(500_000_000n);

    const res = await cappedVault.deposit(mockUser, 500_000_000n);

    expect(res.status).toBe('SUCCESS');
    expect(cappedVault.totalAssets()).toBe(500_000_000n);
    expect(cappedVault.remainingDepositCapacity()).toBe(0n);

    // A further deposit, even of 1 stroop, should now be rejected
    const secondRes = await cappedVault.deposit(mockUser, 1n);
    expect(secondRes.status).toBe('REJECTED');
  });

  test('Uncapped vault reports null remaining deposit capacity', () => {
    expect(vault.remainingDepositCapacity()).toBeNull();
  });
});
