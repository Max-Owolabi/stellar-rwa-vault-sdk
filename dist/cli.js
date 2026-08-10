"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVaultProjectConfig = generateVaultProjectConfig;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function generateVaultProjectConfig(vaultId = 'my-rwa-vault-01', name = 'Custom RWA Yield Vault', assetCode = 'USDC', apy = 0.05) {
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
    }
    else {
        console.log(`Unknown command '${command}'. Usage: npx ts-node src/cli.ts init`);
    }
}
