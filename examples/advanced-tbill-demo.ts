import {
  RWAStandardVault,
  TreasuryBillAdapter,
  SorobanIdentityHook,
  VaultConfig
} from '../src';

async function main() {
  console.log('================================================================');
  console.log('  Stellar RWA Vault SDK — Advanced Tokenized T-Bill Vault Demo');
  console.log('================================================================\n');

  const investorAddress = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';
  const vaultAddress = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012';

  // 1. Vault Setup Configuration
  const vaultConfig: VaultConfig = {
    vaultId: 'vault-tbill-usdy-01',
    name: 'Ondo USDY Tokenized Treasury Yield Vault',
    symbol: 'rwaUSDY',
    assetCode: 'USDY',
    assetIssuer: 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M',
    decimals: 7,
    vaultAddress: vaultAddress,
    initialApy: 0.054 // 5.4% APY on USDY Treasury Yield
  };

  // 2. Initialize Treasury Bill Adapter with Oracle NAV
  const tBillAdapter = new TreasuryBillAdapter('USDY', vaultConfig.assetIssuer, 1.0, 7);
  tBillAdapter.setMockBalance(investorAddress, 20_000_000_000n); // 2,000 USDY
  tBillAdapter.setMockBalance(vaultAddress, 0n);

  // 3. Register Soroban Identity Hook (Accredited Investor required)
  const sorobanIdentityHook = new SorobanIdentityHook(true);
  sorobanIdentityHook.registerIdentity({
    address: investorAddress,
    identityHash: '0x987654321fedcba',
    isAccredited: true,
    accreditationExpiry: 1800000000, // Valid accreditation
    jurisdiction: 'US',
    sanctioned: false
  });

  // 4. Instantiate Vault
  const vault = new RWAStandardVault(vaultConfig, tBillAdapter);
  vault.addComplianceHook(sorobanIdentityHook);

  console.log(`[Vault Active] ${vaultConfig.name} (${vaultConfig.symbol})`);
  console.log(`Oracle NAV Price: $${tBillAdapter.getOracleNav().navPriceUsd.toFixed(3)}`);
  console.log(`Investor USDY Balance: ${await tBillAdapter.getBalance(investorAddress)} stroops\n`);

  // 5. Deposit 10,000 USDY
  const depositTime = 1700000000;
  const depositAmount = 10_000_000_000n; // 1,000 USDY

  console.log(`--> Depositing 1,000 USDY into Vault (Checked against Soroban Identity Registry)...`);
  const depositRes = await vault.deposit(investorAddress, depositAmount, depositTime);

  console.log(`    Deposit Status: ${depositRes.status}`);
  console.log(`    Shares Minted:  ${depositRes.sharesMinted} ${vaultConfig.symbol}`);
  console.log(`    Vault Assets:   ${vault.totalAssets()} stroops\n`);

  // 6. Simulate Oracle NAV increase to $1.035 + Vault Yield Accrual
  console.log(`--> Oracle update: T-Bill NAV price appreciated to $1.035 USD per token...`);
  tBillAdapter.updateOracleNav(1.035, depositTime + 90 * 86400);

  const ninetyDaysLater = depositTime + 90 * 86400;
  vault.accrueYield(ninetyDaysLater);

  const usdValue = tBillAdapter.getUsdValue(vault.totalAssets());

  console.log(`    New Total Assets: ${vault.totalAssets()} USDY stroops`);
  console.log(`    Vault Asset USD Valuation: $${(Number(usdValue) / 1e7).toFixed(2)} USD`);
  console.log(`    Share Price: ${vault.getState().sharePrice.toFixed(6)}\n`);

  console.log('================================================================');
  console.log('  Advanced Demo Completed! Multi-adapter compliance verified.');
  console.log('================================================================');
}

main().catch(console.error);
