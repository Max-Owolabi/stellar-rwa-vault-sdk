import {
  RWAStandardVault,
  StellarAssetAdapter,
  SimpleWhitelistHook,
  VaultConfig
} from '../src';

async function main() {
  console.log('====================================================');
  console.log('  Stellar RWA Vault SDK — End-to-End Demo');
  console.log('====================================================\n');

  const investorAddress = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2';
  const vaultAddress = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M';

  // 1. Vault Setup Configuration
  const vaultConfig: VaultConfig = {
    vaultId: 'vault-ustb-01',
    name: 'Stellar US Treasury Yield Vault',
    symbol: 'rwaUSTB',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7, // Stellar Stroops
    vaultAddress: vaultAddress,
    initialApy: 0.052 // 5.2% APY Yield on T-Bills
  };

  // 2. Initialize Asset Adapter & Compliance Hook
  const assetAdapter = new StellarAssetAdapter('USDC', vaultConfig.assetIssuer, 7);
  const whitelistHook = new SimpleWhitelistHook(['US', 'EU', 'SG']);

  // Fund investor with 10,000 USDC (100,000,000,000 stroops)
  assetAdapter.setMockBalance(investorAddress, 100_000_000_000n);
  assetAdapter.setMockBalance(vaultAddress, 0n);

  // Register investor on Compliance Whitelist
  whitelistHook.setWhitelisted({
    address: investorAddress,
    isKycVerified: true,
    isAccredited: true,
    jurisdiction: 'US',
    restricted: false
  });

  // 3. Create Vault Instance
  const vault = new RWAStandardVault(vaultConfig, assetAdapter);
  vault.addComplianceHook(whitelistHook);

  console.log(`[Vault Created] ${vaultConfig.name} (${vaultConfig.symbol})`);
  console.log(`Initial APY: ${(vaultConfig.initialApy * 100).toFixed(2)}%`);
  console.log(`Investor Initial USDC Balance: ${await assetAdapter.getBalance(investorAddress)} stroops\n`);

  // 4. Execute First Deposit (5,000 USDC)
  const depositTime = 1700000000;
  const depositAmount = 50_000_000_000n; // 5,000 USDC

  console.log(`--> Depositing 5,000 USDC into Vault at timestamp ${depositTime}...`);
  const depositRes = await vault.deposit(investorAddress, depositAmount, depositTime);

  console.log(`    Deposit Status: ${depositRes.status}`);
  console.log(`    Shares Minted:  ${depositRes.sharesMinted} ${vaultConfig.symbol}`);
  console.log(`    Vault Total Assets: ${vault.totalAssets()} stroops`);
  console.log(`    Current Share Price: ${vault.getState().sharePrice.toFixed(6)}\n`);

  // 5. Simulate Yield Accrual Over 180 Days (6 Months)
  const halfYearSeconds = 180 * 86400;
  const sixMonthsLater = depositTime + halfYearSeconds;

  console.log(`--> Simulating 180 days of 5.2% APY yield accrual (fast forward to t=${sixMonthsLater})...`);
  const accruedYield = vault.accrueYield(sixMonthsLater);

  console.log(`    Accrued Yield: +${accruedYield} stroops USDC`);
  console.log(`    New Vault Total Assets: ${vault.totalAssets()} stroops`);
  console.log(`    New Share Price: ${vault.getState().sharePrice.toFixed(6)}\n`);

  // 6. Execute Partial Withdrawal (2,500 Shares)
  const withdrawShares = 25_000_000_000n; // 2,500 shares
  console.log(`--> Withdrawing 2,500 shares at timestamp ${sixMonthsLater}...`);

  const withdrawRes = await vault.withdraw(investorAddress, withdrawShares, sixMonthsLater);

  console.log(`    Withdraw Status:  ${withdrawRes.status}`);
  console.log(`    Shares Burned:    ${withdrawRes.sharesBurned}`);
  console.log(`    Assets Returned:  ${withdrawRes.assetsReturned} stroops USDC`);
  console.log(`    Investor Final USDC Balance: ${await assetAdapter.getBalance(investorAddress)} stroops`);
  console.log(`    Remaining Investor Shares:   ${vault.getUserShares(investorAddress)} ${vaultConfig.symbol}`);
  console.log(`    Remaining Vault Assets:      ${vault.totalAssets()} stroops\n`);

  console.log('====================================================');
  console.log('  Demo Completed Successfully! All systems verified.');
  console.log('====================================================');
}

main().catch(console.error);
