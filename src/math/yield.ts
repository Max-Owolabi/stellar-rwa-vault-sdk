import BigNumber from 'bignumber.js';

// Set default BigNumber precision to 18 decimals and round down for financial safety
BigNumber.config({ DECIMAL_PLACES: 18, ROUNDING_MODE: BigNumber.ROUND_DOWN });

export class YieldMath {
  private static SECONDS_PER_YEAR = new BigNumber(31536000); // 365 days in seconds

  /**
   * Convert underlying asset amount to vault share count.
   * If totalAssets or totalSupply is 0, shares = assetAmount (1:1 base).
   * Formula: floor((assets * totalShares) / totalAssets)
   */
  public static convertToShares(
    assetAmount: bigint,
    totalAssets: bigint,
    totalSupply: bigint
  ): bigint {
    if (assetAmount <= 0n) return 0n;
    if (totalAssets <= 0n || totalSupply <= 0n) {
      return assetAmount;
    }

    const assetsBN = new BigNumber(assetAmount.toString());
    const totalAssetsBN = new BigNumber(totalAssets.toString());
    const totalSupplyBN = new BigNumber(totalSupply.toString());

    const sharesBN = assetsBN.times(totalSupplyBN).dividedToIntegerBy(totalAssetsBN);
    return BigInt(sharesBN.toFixed(0));
  }

  /**
   * Convert vault share count to underlying asset amount.
   * Formula: floor((shares * totalAssets) / totalShares)
   */
  public static convertToAssets(
    shareAmount: bigint,
    totalAssets: bigint,
    totalSupply: bigint
  ): bigint {
    if (shareAmount <= 0n || totalSupply <= 0n) return 0n;
    if (totalAssets <= 0n) return 0n;

    const sharesBN = new BigNumber(shareAmount.toString());
    const totalAssetsBN = new BigNumber(totalAssets.toString());
    const totalSupplyBN = new BigNumber(totalSupply.toString());

    const assetsBN = sharesBN.times(totalAssetsBN).dividedToIntegerBy(totalSupplyBN);
    return BigInt(assetsBN.toFixed(0));
  }

  /**
   * Calculate accrued yield over a time delta given an APY rate.
   * Linear simple interest formula: principal * APY * (dt / SECONDS_PER_YEAR)
   */
  public static calculateLinearYield(
    principalAssets: bigint,
    apy: number,
    durationSeconds: number
  ): bigint {
    if (principalAssets <= 0n || apy <= 0 || durationSeconds <= 0) return 0n;

    const principalBN = new BigNumber(principalAssets.toString());
    const apyBN = new BigNumber(apy);
    const timeBN = new BigNumber(durationSeconds);

    const yieldBN = principalBN
      .times(apyBN)
      .times(timeBN)
      .dividedToIntegerBy(this.SECONDS_PER_YEAR);

    return BigInt(yieldBN.toFixed(0));
  }

  /**
   * Calculate current price per share.
   * Standard 1.0 = 1 share equals 1 asset unit (scaled by decimal places e.g. 1e7 or 1e18)
   */
  public static calculateSharePrice(totalAssets: bigint, totalSupply: bigint): number {
    if (totalSupply <= 0n || totalAssets <= 0n) return 1.0;

    const totalAssetsBN = new BigNumber(totalAssets.toString());
    const totalSupplyBN = new BigNumber(totalSupply.toString());

    return totalAssetsBN.dividedBy(totalSupplyBN).toNumber();
  }
}
