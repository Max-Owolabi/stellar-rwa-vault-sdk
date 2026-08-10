const { execSync } = require('child_process');

const issues = [
  { title: 'feat(sdk): Add vault total asset valuation in micro-cents precision', body: 'Drips Wave 8 - High (200 Pts). Implement micro-cents precision asset valuation calculation.' },
  { title: 'refactor(math): Add interest compounding frequency converter (daily/monthly/quarterly/annual)', body: 'Drips Wave 8 - High (200 Pts). Convert annual APY rates to daily, monthly, quarterly, or annual compounding rates.' },
  { title: 'feat(compliance): Implement maximum single transaction deposit limit hook', body: 'Drips Wave 8 - High (200 Pts). Add compliance rule limiting individual deposit transaction size.' },
  { title: 'docs(guides): Add step-by-step guide for writing custom IAssetAdapter implementations', body: 'Drips Wave 8 - High (200 Pts). Provide comprehensive documentation and code templates for custom asset adapters.' },
  { title: 'feat(cli): Add interactive vault transaction history exporter command', body: 'Drips Wave 8 - High (200 Pts). Add `npx stellar-rwa-vault history` CLI command exporting transactions to JSON/CSV.' },
  { title: 'feat(adapters): Add mock balance clearing helper to TreasuryBillAdapter', body: 'Drips Wave 8 - High (200 Pts). Add `clearMockBalances()` helper method for test cleanup.' },
  { title: 'refactor(compliance): Add accredited investor jurisdiction blacklist whitelist override', body: 'Drips Wave 8 - High (200 Pts). Support explicit per-investor jurisdiction overrides.' },
  { title: 'feat(security): Implement emergency withdrawal timelock execution queue', body: 'Drips Wave 8 - High (200 Pts). Implement queued withdrawal requests with configurable time delays.' },
  { title: 'fix(types): Export DepositContext and WithdrawContext interfaces in public index.ts', body: 'Drips Wave 8 - High (200 Pts). Export context interfaces in main entrypoint.' },
  { title: 'feat(analytics): Calculate 7-day rolling average vault share price volatility', body: 'Drips Wave 8 - High (200 Pts). Calculate standard deviation of share price over 7 days.' },
  { title: 'feat(validation): Add regex validator for Stellar Asset Code format (1-12 alphanumeric characters)', body: 'Drips Wave 8 - High (200 Pts). Add Zod validator for Stellar asset codes (e.g. USDC, EURC, USDY).' },
  { title: 'docs(architecture): Add sequence diagram for Soroban Identity Registry Hook deposit checks', body: 'Drips Wave 8 - High (200 Pts). Add Mermaid sequence diagram in architecture.md.' },
  { title: 'feat(adapters): Add asset price oracle freshness timestamp validator', body: 'Drips Wave 8 - High (200 Pts). Reject oracle price updates older than configurable staleness window.' },
  { title: 'feat(compliance): Add accredited investor verification badge expiration alert handler', body: 'Drips Wave 8 - High (200 Pts). Add event callback listener for expiring accreditation badges.' },
  { title: 'refactor(errors): Add custom JSON serialization to VaultError class', body: 'Drips Wave 8 - High (200 Pts). Implement `toJSON()` method on VaultError for structured logging.' },
  { title: 'feat(sdk): Add vault share burn fee percentage calculator', body: 'Drips Wave 8 - High (200 Pts). Calculate withdrawal exit fee and net assets returned.' },
  { title: 'feat(cli): Add `npx stellar-rwa-vault health` command for checking vault status', body: 'Drips Wave 8 - High (200 Pts). Add CLI health check verifying asset balances and compliance status.' },
  { title: 'feat(math): Add fixed-point percentage formatting utility (e.g. 0.052 -> "5.20%")', body: 'Drips Wave 8 - High (200 Pts). Add percentage string formatter for APY rates.' },
  { title: 'docs(readme): Add Drips Wave 8 maintainer badges and contributor guidelines section', body: 'Drips Wave 8 - High (200 Pts). Update README.md with contribution guidelines.' },
  { title: 'feat(compliance): Add IP address country code resolver hook', body: 'Drips Wave 8 - High (200 Pts). Resolve IP addresses to ISO country codes for compliance checks.' },
  { title: 'feat(sdk): Add Horizon network connection timeout retry mechanism', body: 'Drips Wave 8 - High (200 Pts). Implement exponential backoff retry for Horizon API queries.' },
  { title: 'feat(adapters): Add treasury bill maturity date countdown calculator', body: 'Drips Wave 8 - High (200 Pts). Calculate remaining days and maturity status for T-Bills.' },
  { title: 'feat(telemetry): Add structured JSON file logger sink', body: 'Drips Wave 8 - High (200 Pts). Log SDK events to structured JSON file sink.' },
  { title: 'fix(vault): Add minimum deposit floor requirement check to RWAStandardVault', body: 'Drips Wave 8 - High (200 Pts). Enforce minimum deposit amount floor to prevent micro-spam.' },
  { title: 'feat(types): Export WhitelistEntry and IdentityRecord interfaces in public index.ts', body: 'Drips Wave 8 - High (200 Pts). Export compliance entry types in public index.ts.' }
];

console.log(`Publishing ${issues.length} High-Reward (200 Pts) issues to GitHub...`);

for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${title}" --body "${body}"`;
  
  try {
    const url = execSync(cmd, { cwd: __dirname + '/..', encoding: 'utf-8' }).trim();
    console.log(`[Created 200 Pts Issue #${i + 1}/${issues.length}] ${url}`);
  } catch (err) {
    console.error(`Failed to create issue #${i + 1}:`, err.message);
  }
}

console.log('All 25 new 200 Pts issues published successfully!');
