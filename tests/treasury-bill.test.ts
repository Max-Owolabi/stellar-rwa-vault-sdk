import { TreasuryBillAdapter } from '../src/adapters/treasury-bill';

describe('TreasuryBillAdapter & Oracle NAV Feed', () => {
  let adapter: TreasuryBillAdapter;

  beforeEach(() => {
    adapter = new TreasuryBillAdapter('USDY', 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M', 1.0, 7);
  });

  test('Initializes with default $1.00 NAV price', () => {
    const nav = adapter.getOracleNav();
    expect(nav.symbol).toBe('USDY');
    expect(nav.navPriceUsd).toBe(1.0);
  });

  test('Updates Oracle NAV feed and calculates USD valuation', () => {
    adapter.updateOracleNav(1.05); // T-Bill accrued yield to $1.05

    const nav = adapter.getOracleNav();
    expect(nav.navPriceUsd).toBe(1.05);

    const tokenAmount = 1_000_000_000n; // 100 USDY
    const usdVal = adapter.getUsdValue(tokenAmount);
    expect(usdVal).toBe(1_050_000_000n); // 105 USD
  });

  test('Rejects negative NAV update', () => {
    expect(() => adapter.updateOracleNav(-0.5)).toThrow('NAV price must be greater than zero');
  });
});
