import * as fs from 'fs';
import * as path from 'path';

export function generateVaultProjectConfig(
  vaultId: string = 'my-rwa-vault-01',
  name: string = 'Custom RWA Yield Vault',
  assetCode: string = 'USDC',
  apy: number = 0.05
): string {
  const config = {
    vaultId,
    name,
    symbol: `rwa${assetCode}`,
    assetCode,
    assetIssuer: 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D',
    decimals: 7,
    vaultAddress: 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012',
    initialApy: apy
  };

  const outputDir = process.cwd();
  const filePath = path.join(outputDir, 'vault-config.json');
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
  return filePath;
}

if (require.main === module) {
  console.log('===================================================');
  console.log('  Stellar RWA Vault SDK — Developer CLI Toolkit');
  console.log('===================================================\n');

  const args = process.argv.slice(2);
  const command = args[0] || 'init';

  if (command === 'init') {
    const filePath = generateVaultProjectConfig();
    console.log(`[Success] Vault configuration initialized: ${filePath}`);
    console.log('You can now instantiate RWAStandardVault using this configuration file.');
  } else {
    console.log(`Unknown command '${command}'. Usage: npx ts-node src/cli.ts init`);
  }
}
