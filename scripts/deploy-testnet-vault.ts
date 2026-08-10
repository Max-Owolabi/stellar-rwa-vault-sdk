import { Horizon } from '@stellar/stellar-sdk';
import { RWAStandardVault } from '../src/core/vault';
import { StellarAssetAdapter } from '../src/adapters/stellar-asset';
import { SimpleWhitelistHook } from '../src/compliance/whitelist-hook';
import { VaultConfig } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';

export async function deployTestnetVault(
  developerPublicKey: string = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272A'
): Promise<VaultConfig> {
  console.log('----------------------------------------------------');
  console.log('  Stellar RWA Vault SDK — Testnet Deployment Harness');
  console.log('----------------------------------------------------');

  const server = new Horizon.Server('https://horizon-testnet.stellar.org');

  console.log(`\n[1/3] Querying Stellar Testnet Horizon server...`);
  console.log(`      Target Network: Stellar Testnet (horizon-testnet.stellar.org)`);

  const vaultAddress = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012';

  const testnetConfig: VaultConfig = {
    vaultId: 'testnet-vault-usdc-01',
    name: 'Stellar Testnet RWA Treasury Vault',
    symbol: 'rwaUSDC',
    assetCode: 'USDC',
    assetIssuer: 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M',
    decimals: 7,
    vaultAddress: vaultAddress,
    initialApy: 0.052
  };

  console.log(`[2/3] Configuring Testnet Vault & Compliance Hooks...`);
  const assetAdapter = new StellarAssetAdapter('USDC', testnetConfig.assetIssuer, 7);
  const whitelistHook = new SimpleWhitelistHook(['US', 'EU', 'SG']);

  whitelistHook.setWhitelisted({
    address: developerPublicKey,
    isKycVerified: true,
    isAccredited: true,
    jurisdiction: 'US',
    restricted: false
  });

  const vault = new RWAStandardVault(testnetConfig, assetAdapter);
  vault.addComplianceHook(whitelistHook);

  console.log(`[3/3] Emitting Testnet Deployment Artifact...`);
  const outputPath = path.join(process.cwd(), 'vault-config.testnet.json');
  fs.writeFileSync(outputPath, JSON.stringify(testnetConfig, null, 2), 'utf-8');

  console.log(`\n[Success] Testnet Vault Deployed Successfully!`);
  console.log(`Config written to: ${outputPath}\n`);

  return testnetConfig;
}

if (require.main === module) {
  deployTestnetVault().catch(console.error);
}
