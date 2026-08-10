#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('===================================================');
console.log('  Stellar RWA Vault SDK — Developer CLI Generator');
console.log('===================================================\n');

const args = process.argv.slice(2);
const command = args[0] || 'init';

if (command === 'init') {
  const vaultConfig = {
    vaultId: 'vault-usdc-01',
    name: 'Stellar RWA Treasury Bill Vault',
    symbol: 'rwaUSDC',
    assetCode: 'USDC',
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7,
    vaultAddress: 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012',
    initialApy: 0.052
  };

  const targetPath = path.join(process.cwd(), 'vault-config.json');
  fs.writeFileSync(targetPath, JSON.stringify(vaultConfig, null, 2), 'utf-8');

  console.log(`[Success] Vault configuration template created at:`);
  console.log(`          ${targetPath}\n`);
  console.log('Next steps:');
  console.log('  1. Import RWAStandardVault from "stellar-rwa-vault-sdk"');
  console.log('  2. Pass this configuration file to initialize your vault.');
} else if (command === 'help') {
  console.log('Usage:');
  console.log('  npx stellar-rwa-vault init   # Generate vault-config.json template');
  console.log('  npx stellar-rwa-vault help   # Display this help menu');
} else {
  console.log(`Unknown command '${command}'. Run 'npx stellar-rwa-vault help' for usage.`);
}
