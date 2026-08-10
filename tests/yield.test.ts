import { YieldMath } from '../src/math/yield';

describe('YieldMath Fixed-Point Precision Calculations', () => {
  test('convertToShares returns 1:1 ratio when pool is empty', () => {
    const shares = YieldMath.convertToShares(1000n, 0n, 0n);
    expect(shares).toBe(1000n);
  });

  test('convertToShares calculates share price increase after yield accrual', () => {
    // 1000 assets, 1000 shares (share price = 1.0)
    // Assets grow to 1100 via yield accrual (share price = 1.1)
    // New deposit of 550 assets should receive floor(550 * 1000 / 1100) = 500 shares
    const shares = YieldMath.convertToShares(550n, 1100n, 1000n);
    expect(shares).toBe(500n);
  });

  test('convertToAssets converts shares to underlying asset correctly', () => {
    // 500 shares out of 1500 total shares when total assets = 1650
    // floor(500 * 1650 / 1500) = 550 assets
    const assets = YieldMath.convertToAssets(500n, 1650n, 1500n);
    expect(assets).toBe(550n);
  });

  test('calculateLinearYield handles 5% APY over 1 year accurately', () => {
    const principal = 100_000_000n; // 10 USDC (7 decimals)
    const apy = 0.05; // 5%
    const secondsInYear = 31536000;

    const yieldAmount = YieldMath.calculateLinearYield(principal, apy, secondsInYear);
    expect(yieldAmount).toBe(5_000_000n); // 0.5 USDC accrued yield
  });

  test('calculateSharePrice returns correct floating ratio', () => {
    expect(YieldMath.calculateSharePrice(1100n, 1000n)).toBe(1.1);
    expect(YieldMath.calculateSharePrice(0n, 0n)).toBe(1.0);
  });
});
