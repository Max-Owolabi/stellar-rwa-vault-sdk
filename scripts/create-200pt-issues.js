const { execSync } = require('child_process');

const issues = [
  {
    title: 'feat(adapters): Implement Circle EURC Asset Adapter with minting and burning helpers',
    body: 'Drips Wave 8 - High (200 Pts). Implement dedicated asset adapter for Euro Coin (EURC) on Stellar with minting/burning test helpers.'
  },
  {
    title: 'feat(compliance): Implement automatic KYC renewal expiration warning hook',
    body: 'Drips Wave 8 - High (200 Pts). Create compliance hook that flags accounts approaching annual KYC re-verification deadlines.'
  },
  {
    title: 'feat(analytics): Build time-weighted average price (TWAP) calculation module',
    body: 'Drips Wave 8 - High (200 Pts). Implement TWAP share price calculator over configurable historical rolling windows.'
  },
  {
    title: 'feat(cli): Add automated vault configuration wizard CLI command',
    body: 'Drips Wave 8 - High (200 Pts). Add interactive `npx stellar-rwa-vault wizard` CLI command prompting developers for APY, asset code, and compliance settings.'
  },
  {
    title: 'feat(security): Implement emergency deposit lock time delay mechanism',
    body: 'Drips Wave 8 - High (200 Pts). Add configurable timelock delay on large deposits before shares become transferable.'
  },
  {
    title: 'feat(adapters): Implement tokenized real estate yield adapter with monthly distribution math',
    body: 'Drips Wave 8 - High (200 Pts). Create asset adapter for tokenized real estate rental yields with monthly distribution schedules.'
  },
  {
    title: 'feat(soroban): Build client SDK helper for reading Soroban contract events',
    body: 'Drips Wave 8 - High (200 Pts). Develop event listener utility for parsing and decoding Soroban smart contract log topics.'
  },
  {
    title: 'feat(telemetry): Build JSON health-check endpoint exporter for vault monitoring',
    body: 'Drips Wave 8 - High (200 Pts). Export structured HTTP JSON endpoint displaying total assets, total supply, share price, and compliance status.'
  },
  {
    title: 'feat(compliance): Implement multi-country jurisdiction restriction compliance matrix',
    body: 'Drips Wave 8 - High (200 Pts). Extend compliance hook with jurisdiction matrix supporting ISO country code whitelists and blacklists.'
  },
  {
    title: 'feat(sdk): Add automated performance fee deduction & treasury fee receiver module',
    body: 'Drips Wave 8 - High (200 Pts). Implement high-water mark performance fee calculation and minting to protocol treasury address.'
  }
];

console.log(`Publishing ${issues.length} High-Complexity (200 Pts) issues to GitHub...`);

for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${title}" --body "${body}"`;
  
  try {
    const url = execSync(cmd, { cwd: __dirname + '/..', encoding: 'utf-8' }).trim();
    console.log(`[Created 200 Pts Issue #${i + 1}] ${url}`);
  } catch (err) {
    console.error(`Failed to create issue #${i + 1}:`, err.message);
  }
}

console.log('All 200 Pts issues published successfully!');
