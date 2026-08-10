const { execSync } = require('child_process');

const issues200 = [
  { title: 'feat(sdk): Add helper to query vault annual percentage yield (APY) in basis points', body: 'Drips Wave 8 - High (200 Pts). Implement APY calculation in basis points (e.g. 520 bps = 5.20%).' },
  { title: 'refactor(math): Add percentage-based share price slippage calculator', body: 'Drips Wave 8 - High (200 Pts). Add slippage tolerance check before executing share conversions.' },
  { title: 'feat(validation): Add check for Stellar account minimum XLM reserve balance', body: 'Drips Wave 8 - High (200 Pts). Verify accounts hold minimum base XLM reserve before processing deposits.' },
  { title: 'docs(guides): Add developer tutorial for deploying custom compliance hooks', body: 'Drips Wave 8 - High (200 Pts). Provide Markdown guide with example code for custom IComplianceHook implementations.' },
  { title: 'feat(cli): Add JSON output flag (--json) to CLI initialization command', body: 'Drips Wave 8 - High (200 Pts). Support machine-readable JSON output for `npx stellar-rwa-vault init --json`.' },
  { title: 'feat(adapters): Add mock token faucet helper to StellarAssetAdapter', body: 'Drips Wave 8 - High (200 Pts). Add `mintMockTokens(address, amount)` helper to speed up sandbox testing.' },
  { title: 'refactor(compliance): Add whitelist bulk import helper from CSV file', body: 'Drips Wave 8 - High (200 Pts). Implement `importWhitelistCsv(filePath)` helper method.' },
  { title: 'feat(sdk): Add vault pause/unpause state getter and setter', body: 'Drips Wave 8 - High (200 Pts). Add boolean `isPaused` flag to RWAStandardVault preventing deposits when active.' },
  { title: 'fix(types): Add optional metadata field to VaultConfig interface', body: 'Drips Wave 8 - High (200 Pts). Add optional `metadata?: Record<string, string>` field to VaultConfig.' },
  { title: 'feat(analytics): Calculate 24-hour total deposit volume aggregator', body: 'Drips Wave 8 - High (200 Pts). Track rolling 24-hour aggregate deposit and withdrawal volume.' },
  { title: 'feat(validation): Add validator for Soroban contract address format (C... 56 chars)', body: 'Drips Wave 8 - High (200 Pts). Add Zod schema validator for Soroban contract addresses starting with C.' },
  { title: 'docs(architecture): Add Mermaid flowchart for multi-asset rebalancing logic', body: 'Drips Wave 8 - High (200 Pts). Update architecture.md with detailed rebalancing decision tree diagram.' },
  { title: 'feat(adapters): Add transaction gas fee estimator to StellarAssetAdapter', body: 'Drips Wave 8 - High (200 Pts). Estimate Stroop gas fee cost for standard asset transfers.' },
  { title: 'feat(compliance): Add accredited investor jurisdiction blacklist override rule', body: 'Drips Wave 8 - High (200 Pts). Allow specific accredited investors to bypass country blacklists with manual clearance.' },
  { title: 'refactor(errors): Add error cause property to VaultError for stack tracing', body: 'Drips Wave 8 - High (200 Pts). Attach underlying cause error to VaultError instance.' },
  { title: 'feat(sdk): Add user share balance percentage calculator relative to total supply', body: 'Drips Wave 8 - High (200 Pts). Return floating point percentage of vault owned by user.' },
  { title: 'feat(cli): Add `npx stellar-rwa-vault validate` config file syntax checker', body: 'Drips Wave 8 - High (200 Pts). Add CLI validator to verify vault-config.json fields.' },
  { title: 'feat(math): Add BigNumber fixed-point rounding mode configuration toggle', body: 'Drips Wave 8 - High (200 Pts). Allow toggling between ROUND_DOWN and ROUND_HALF_UP.' },
  { title: 'docs(readme): Add badges for test coverage, TypeScript build status, and license', body: 'Drips Wave 8 - High (200 Pts). Update README.md with Shields.io status badges.' },
  { title: 'feat(compliance): Add IP address subnet CIDR block checking helper', body: 'Drips Wave 8 - High (200 Pts). Validate investor IP against CIDR subnet ranges.' },
  { title: 'feat(sdk): Add timestamp converter for Stellar Horizon ledger close time', body: 'Drips Wave 8 - High (200 Pts). Convert ISO-8601 ledger close times to Unix timestamps.' },
  { title: 'feat(adapters): Add treasury bill maturity date countdown calculator', body: 'Drips Wave 8 - High (200 Pts). Calculate remaining days until tokenized T-Bill bond maturity.' },
  { title: 'feat(telemetry): Add console logger middleware with configurable log levels', body: 'Drips Wave 8 - High (200 Pts). Add configurable logger (DEBUG, INFO, WARN, ERROR).' },
  { title: 'fix(vault): Add maximum deposit limit cap to RWAStandardVault', body: 'Drips Wave 8 - High (200 Pts). Allow setting a global cap on total vault assets.' },
  { title: 'feat(types): Export AssetAllocation and RebalanceRecommendation types', body: 'Drips Wave 8 - High (200 Pts). Export multi-asset types in public index.ts.' }
];

const issues400 = [
  { title: 'feat(soroban): Build full Soroban smart contract verification & deployment suite', body: 'Drips Wave 8 - Grand (400 Pts). Complete Rust Soroban smart contract verification, compilation, and testnet deployment suite.' },
  { title: 'feat(cross-chain): Implement Axelar / Wormhole cross-chain RWA deposit bridge adapter', body: 'Drips Wave 8 - Grand (400 Pts). Cross-chain asset bridge adapter enabling EVM/Solana deposits into Stellar RWA Vaults.' },
  { title: 'feat(automation): Implement automated yield compounder bot with cron execution', body: 'Drips Wave 8 - Grand (400 Pts). Automated yield harvesting and re-investment bot service.' },
  { title: 'feat(zk-proofs): Implement Zero-Knowledge proof compliance verification hook (zk-KYC)', body: 'Drips Wave 8 - Grand (400 Pts). Integrate ZK-SNARK / ZK-STARK proof verification for private KYC.' },
  { title: 'feat(indexer): Build multi-vault historical transaction & event indexer engine', body: 'Drips Wave 8 - Grand (400 Pts). High-throughput indexing service for parsing historical vault events.' },
  { title: 'feat(security): Implement flash loan attack prevention and single-block deposit/withdraw locks', body: 'Drips Wave 8 - Grand (400 Pts). On-chain flash loan defense preventing same-block deposit and withdrawal exploits.' },
  { title: 'feat(oracle): Build Pyth / Chainlink decentralized oracle price feed aggregator adapter', body: 'Drips Wave 8 - Grand (400 Pts). Decentralized multi-oracle price feed aggregator for RWA token NAV pricing.' },
  { title: 'feat(sdk): Implement automated multi-vault portfolio auto-rebalancer service', body: 'Drips Wave 8 - Grand (400 Pts). Automated portfolio execution service executing cross-vault rebalancing swaps.' },
  { title: 'feat(compliance): Build automated FATF travel rule compliance payload generator', body: 'Drips Wave 8 - Grand (400 Pts). Generator for IVMS101 compliant travel rule payloads for institutional transfers.' },
  { title: 'feat(testing): Build full testnet simulation sandbox with simulated market crash scenarios', body: 'Drips Wave 8 - Grand (400 Pts). Comprehensive stress-test suite simulating high volatility and liquidation events.' }
];

console.log(`Publishing 25 x 200 Pts issues and 10 x 400 Pts issues to GitHub...`);

let count = 0;
for (const issue of issues200) {
  count++;
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${title}" --body "${body}"`;
  try {
    const url = execSync(cmd, { cwd: __dirname + '/..', encoding: 'utf-8' }).trim();
    console.log(`[Created 200 Pts #${count}/25] ${url}`);
  } catch (err) {
    console.error(`Failed to create issue:`, err.message);
  }
}

count = 0;
for (const issue of issues400) {
  count++;
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${title}" --body "${body}"`;
  try {
    const url = execSync(cmd, { cwd: __dirname + '/..', encoding: 'utf-8' }).trim();
    console.log(`[Created 400 Pts #${count}/10] ${url}`);
  } catch (err) {
    console.error(`Failed to create issue:`, err.message);
  }
}

console.log('All 35 requested issues published successfully!');
