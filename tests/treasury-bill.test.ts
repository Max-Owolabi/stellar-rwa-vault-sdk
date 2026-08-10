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

describe('TreasuryBillAdapter Maturity Date Countdown (Issue #61)', () => {
  let adapter: TreasuryBillAdapter;

  beforeEach(() => {
    adapter = new TreasuryBillAdapter('USDY', 'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M', 1.0, 7);
  });

  test('Has no maturity date by default', () => {
    expect(adapter.getMaturityDate()).toBeNull();
    expect(adapter.isMatured()).toBe(false);
  });

  test('Throws when checking days until maturity before it is set', () => {
    expect(() => adapter.getDaysUntilMaturity()).toThrow(
      'Maturity date has not been set for this T-Bill adapter'
    );
  });

  test('Accepts a Date object and calculates remaining days', () => {
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysFromNow = new Date((now + 30 * 86400) * 1000);
    adapter.setMaturityDate(thirtyDaysFromNow);

    expect(adapter.getMaturityDate()).toBe(Math.floor(thirtyDaysFromNow.getTime() / 1000));
    expect(adapter.getDaysUntilMaturity(now)).toBe(30);
  });

  test('Accepts a Unix timestamp and calculates remaining days', () => {
    const now = Math.floor(Date.now() / 1000);
    const maturity = now + 10 * 86400;
    adapter.setMaturityDate(maturity);

    expect(adapter.getDaysUntilMaturity(now)).toBe(10);
  });

  test('Rounds up partial days so a bond is not shown as already matured', () => {
    const now = Math.floor(Date.now() / 1000);
    adapter.setMaturityDate(now + 3600); // 1 hour from now

    expect(adapter.getDaysUntilMaturity(now)).toBe(1);
  });

  test('Returns 0 remaining days once the maturity date has passed', () => {
    const now = Math.floor(Date.now() / 1000);
    adapter.setMaturityDate(now - 86400); // yesterday

    expect(adapter.getDaysUntilMaturity(now)).toBe(0);
  });

  test('isMatured reflects whether the maturity timestamp has been reached', () => {
    const now = Math.floor(Date.now() / 1000);
    adapter.setMaturityDate(now + 86400);

    expect(adapter.isMatured(now)).toBe(false);
    expect(adapter.isMatured(now + 86400)).toBe(true);
    expect(adapter.isMatured(now + 2 * 86400)).toBe(true);
  });

  test('Rejects an invalid maturity date', () => {
    expect(() => adapter.setMaturityDate(NaN)).toThrow(
      'Maturity date must resolve to a valid positive timestamp'
    );
    expect(() => adapter.setMaturityDate(-100)).toThrow(
      'Maturity date must resolve to a valid positive timestamp'
    );
  });

  test('Constructor accepts an optional initial maturity date', () => {
    const now = Math.floor(Date.now() / 1000);
    const withMaturity = new TreasuryBillAdapter(
      'USDY',
      'GBND24XF3V43PR3GOMPAOGB5LTY54WCH0H3M',
      1.0,
      7,
      now + 5 * 86400
    );

    expect(withMaturity.getDaysUntilMaturity(now)).toBe(5);
  });
});
