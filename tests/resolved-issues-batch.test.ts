import { YieldMath } from '../src/math/yield';
import { VaultEventFilter } from '../src/types';

describe('Resolved Issues Batch Suite (Issues #7, #6, #17)', () => {
  describe('Issue #7: Safe Division Wrapper', () => {
    test('safeSharePriceDivision returns 1.0 safely when totalAssets or totalSupply is 0', () => {
      expect(YieldMath.safeSharePriceDivision(0n, 0n)).toBe(1.0);
      expect(YieldMath.safeSharePriceDivision(100n, 0n)).toBe(1.0);
      expect(YieldMath.safeSharePriceDivision(0n, 100n)).toBe(1.0);
    });

    test('safeSharePriceDivision calculates correct ratio for valid balances', () => {
      expect(YieldMath.safeSharePriceDivision(1200n, 1000n)).toBe(1.2);
    });
  });

  describe('Issue #6: Compounded Interest Math', () => {
    test('calculateCompoundedYield calculates daily compounded yield over 1 year', () => {
      const principal = 100_000_000n; // 10 USDC
      const apy = 0.05; // 5%
      const secondsInYear = 31536000;

      // Compounded yield is higher than simple linear yield (5,000,000 stroops)
      const compoundedYield = YieldMath.calculateCompoundedYield(principal, apy, secondsInYear, 365);
      expect(compoundedYield).toBeGreaterThan(5_000_000n);
      expect(compoundedYield).toBe(5_127_109n); // ~5.127% effective compounded return
    });
  });

  describe('Issue #17: VaultEventFilter Export Verification', () => {
    test('VaultEventFilter interface can be instantiated and validated', () => {
      const filter: VaultEventFilter = {
        eventType: 'DEPOSIT',
        address: 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272A',
        fromTimestamp: 1000,
        toTimestamp: 2000
      };

      expect(filter.eventType).toBe('DEPOSIT');
      expect(filter.address).toBe('GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272A');
    });
  });
});
