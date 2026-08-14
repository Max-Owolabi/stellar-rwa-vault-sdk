/**
 * Timestamp conversion helpers for Stellar Horizon / Soroban RPC ledger
 * close times (Issue #60).
 *
 * Horizon and the Soroban RPC surface ledger close times as ISO-8601
 * strings (e.g. `ledger.closed_at`, `event.ledgerClosedAt`). SDK internals
 * work with unix-seconds timestamps (matching `Vault.deposit`/`withdraw`
 * and `YieldMath`), so this module is the single place that bridges the
 * two representations.
 */

/**
 * Convert a Horizon/Soroban RPC ISO-8601 ledger close time into a unix
 * timestamp in whole seconds.
 *
 * Returns `0` for an unparsable input rather than throwing, matching the
 * "best effort" semantics expected of streaming event decoders where a
 * single malformed record shouldn't halt an indexing run.
 */
export function closeTimeToUnixSeconds(closeTimeIso: string): number {
  const parsedMs = Date.parse(closeTimeIso);
  return Number.isNaN(parsedMs) ? 0 : Math.floor(parsedMs / 1000);
}

/**
 * Convert a Horizon/Soroban RPC ISO-8601 ledger close time into a unix
 * timestamp in milliseconds. Returns `0` for an unparsable input.
 */
export function closeTimeToUnixMillis(closeTimeIso: string): number {
  const parsedMs = Date.parse(closeTimeIso);
  return Number.isNaN(parsedMs) ? 0 : parsedMs;
}

/**
 * Convert a unix-seconds timestamp back into the ISO-8601 string format
 * used by Horizon/Soroban RPC ledger close times.
 */
export function unixSecondsToCloseTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString();
}

/**
 * Returns true if the given string parses as a valid ledger close time.
 */
export function isValidCloseTime(closeTimeIso: string): boolean {
  return !Number.isNaN(Date.parse(closeTimeIso));
}

/**
 * How many seconds old a ledger close time is relative to a reference
 * timestamp (defaults to now). Useful for staleness checks on indexer
 * state or RPC responses. Returns a negative number if the close time is
 * in the future relative to the reference.
 */
export function closeTimeAgeSeconds(
  closeTimeIso: string,
  referenceUnixSeconds: number = Math.floor(Date.now() / 1000)
): number {
  return referenceUnixSeconds - closeTimeToUnixSeconds(closeTimeIso);
}
