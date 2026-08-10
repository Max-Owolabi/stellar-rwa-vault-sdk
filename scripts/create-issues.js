const { execSync } = require('child_process');

const issues = [
  { title: 'feat(sdk): Add fixed-point interest compounding rate calculation over arbitrary intervals', body: 'Drips Wave 8 - Medium (150 Pts). Implement compounded APY interest calculations over customizable block/time intervals.' },
  { title: 'refactor(math): Add safe zero-checking math wrapper for share price division', body: 'Drips Wave 8 - Trivial (100 Pts). Prevent division-by-zero edge cases during zero liquidity vault states.' },
  { title: 'feat(compliance): Implement jurisdiction geo-fencing IP location compliance hook', body: 'Drips Wave 8 - Medium (150 Pts). Integrate geo-IP validation hook to enforce regional legal restrictions.' },
  { title: 'feat(adapters): Implement Centrifuge RWA pool token asset adapter', body: 'Drips Wave 8 - High (200 Pts). Build adapter for Centrifuge tokenized RWA pools and real estate assets.' },
  { title: 'feat(telemetry): Add Prometheus metrics exporter for vault TVL and share price', body: 'Drips Wave 8 - Medium (150 Pts). Export standard Prometheus metrics endpoint for monitoring vault health.' },
  { title: 'docs(api): Generate OpenAPI/Swagger documentation for REST API wrapper', body: 'Drips Wave 8 - Trivial (100 Pts). Provide Swagger JSON spec for developers hosting SDK REST proxies.' },
  { title: 'feat(security): Implement multi-sig emergency circuit breaker withdrawal pause hook', body: 'Drips Wave 8 - High (200 Pts). Add emergency pause capability requiring 2-of-3 multi-sig approval.' },
  { title: 'feat(soroban): Write Soroban Smart Contract Rust bindings for on-chain RWA vault', body: 'Drips Wave 8 - High (200 Pts). Develop native Rust Soroban smart contract logic for on-chain vaults.' },
  { title: 'refactor(validation): Add strict check for Stellar Memo field length validation', body: 'Drips Wave 8 - Trivial (100 Pts). Sanitize Stellar memo strings to ensure max 28-byte limit compliance.' },
  { title: 'feat(adapters): Implement Maple Finance credit pool asset adapter', body: 'Drips Wave 8 - High (200 Pts). Create asset adapter interfacing with credit pool yields.' },
  { title: 'feat(analytics): Build historical APY yield performance tracking module', body: 'Drips Wave 8 - Medium (150 Pts). Track time-weighted yield return rate over 7d, 30d, 90d, 365d periods.' },
  { title: 'fix(types): Export missing TypeScript interface for VaultEventFilter', body: 'Drips Wave 8 - Trivial (100 Pts). Export event filter types in main src/index.ts.' },
  { title: 'feat(compliance): Add automatic accredited investor re-verification reminder hook', body: 'Drips Wave 8 - Medium (150 Pts). Emit warning events 30 days prior to investor accreditation expiry.' },
  { title: 'feat(cli): Add interactive vault balance query command to CLI', body: 'Drips Wave 8 - Medium (150 Pts). Add `npx stellar-rwa-vault balance <address>` command to CLI.' },
  { title: 'feat(adapters): Support Stellar SEP-24 deposit/withdrawal anchor protocol', body: 'Drips Wave 8 - High (200 Pts). Integrate SEP-24 interactive anchor flows for fiat on/off ramps.' },
  { title: 'refactor(errors): Define custom error hierarchy for SDK exceptions', body: 'Drips Wave 8 - Trivial (100 Pts). Create specialized VaultError, ComplianceError, and MathError classes.' },
  { title: 'feat(insurance): Implement vault loss-coverage / default reserve fund accounting', body: 'Drips Wave 8 - High (200 Pts). Allocate percentage of yield to first-loss reserve pool.' },
  { title: 'feat(webhooks): Add webhook event emitter for vault deposit and withdrawal events', body: 'Drips Wave 8 - Medium (150 Pts). Emit HTTP webhook payloads on vault state changes.' },
  { title: 'docs(examples): Add React & Next.js frontend integration code snippet examples', body: 'Drips Wave 8 - Trivial (100 Pts). Provide sample React hooks for rendering vault balances.' },
  { title: 'feat(soroban): Implement Soroban event indexer for real-time vault state sync', body: 'Drips Wave 8 - High (200 Pts). Listen to Soroban event logs to sync off-chain SDK state.' }
];

console.log(`Creating ${issues.length} Drips Wave 8 GitHub issues...`);

for (let i = 0; i < issues.length; i++) {
  const issue = issues[i];
  const title = issue.title.replace(/"/g, '\\"');
  const body = issue.body.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${title}" --body "${body}"`;
  
  try {
    const url = execSync(cmd, { cwd: __dirname + '/..', encoding: 'utf-8' }).trim();
    console.log(`[Created ${i + 1}/${issues.length}] ${url}`);
  } catch (err) {
    console.error(`Failed to create issue #${i + 1}:`, err.message);
  }
}

console.log('All 20 issues created successfully!');
