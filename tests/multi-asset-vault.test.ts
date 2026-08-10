import { MultiAssetVaultEngine } from '../src/core/multi-asset-vault';
import { StellarAssetAdapter } from '../src/adapters/stellar-asset';
import { TreasuryBillAdapter } from '../src/adapters/treasury-bill';

describe('MultiAssetVaultEngine Portfolio Accounting & Rebalancing', () => {
  let engine: MultiAssetVaultEngine;
  let usdcAdapter: StellarAssetAdapter;
  let tbillAdapter: TreasuryBillAdapter;
  const vaultAddress = 'GBRPYHIL2CI3FNSRH4A3PR3GOMPAOGB5LTY54WCH0H3M123456789012';

  beforeEach(() => {
    usdcAdapter = new StellarAssetAdapter('USDC', 'GA5ZSEEXB36GYBHA273EM7VVLSNGFQZOR24W5C6Z3G73TF42G6KCVH6D', 7);
    tbillAdapter = new TreasuryBillAdapter('USDY', 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M', 1.0, 7);

    // 50% USDC, 50% T-Bills (USDY)
    engine = new MultiAssetVaultEngine([
      { adapter: usdcAdapter, targetWeight: 0.5 },
      { adapter: tbillAdapter, targetWeight: 0.5 }
    ]);
  });

  test('Validates target weights must sum to 1.0', () => {
    expect(() => {
      new MultiAssetVaultEngine([
        { adapter: usdcAdapter, targetWeight: 0.4 },
        { adapter: tbillAdapter, targetWeight: 0.4 }
      ]);
    }).toThrow('Target allocation weights must sum to 1.0');
  });

  test('Calculates total portfolio valuation correctly across multi-asset balances', async () => {
    usdcAdapter.setMockBalance(vaultAddress, 5_000_000_000n); // 500 USDC
    tbillAdapter.setMockBalance(vaultAddress, 5_000_000_000n); // 500 USDY

    const totalUsd = await engine.calculateTotalPortfolioUsd(vaultAddress);
    expect(totalUsd).toBe(1000);
  });

  test('Evaluates portfolio weight drift and recommends rebalancing', async () => {
    // Portfolio is currently 800 USDC (80%) and 200 USDY (20%) -> Drifted from 50/50 target!
    usdcAdapter.setMockBalance(vaultAddress, 8_000_000_000n); // 800 USDC
    tbillAdapter.setMockBalance(vaultAddress, 2_000_000_000n); // 200 USDY

    const recs = await engine.evaluateRebalance(vaultAddress);
    expect(recs.length).toBe(2);

    const usdcRec = recs.find(r => r.assetCode === 'USDC');
    const usdyRec = recs.find(r => r.assetCode === 'USDY');

    expect(usdcRec?.currentWeight).toBeCloseTo(0.8);
    expect(usdcRec?.action).toBe('SELL'); // Sell 300 USDC to reach 50%

    expect(usdyRec?.currentWeight).toBeCloseTo(0.2);
    expect(usdyRec?.action).toBe('BUY'); // Buy 300 USDY to reach 50%
  });
});
