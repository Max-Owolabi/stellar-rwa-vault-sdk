import {
  closeTimeAgeSeconds,
  closeTimeToUnixMillis,
  closeTimeToUnixSeconds,
  isValidCloseTime,
  unixSecondsToCloseTime
} from '../src/utils/timestamp';

describe('Ledger close-time converter (Issue #60)', () => {
  test('closeTimeToUnixSeconds converts a Horizon ISO close time to unix seconds', () => {
    expect(closeTimeToUnixSeconds('2024-01-01T00:00:00Z')).toBe(1704067200);
  });

  test('closeTimeToUnixSeconds truncates sub-second precision', () => {
    expect(closeTimeToUnixSeconds('2024-01-01T00:00:00.999Z')).toBe(1704067200);
  });

  test('closeTimeToUnixSeconds returns 0 for an unparsable string', () => {
    expect(closeTimeToUnixSeconds('not-a-date')).toBe(0);
  });

  test('closeTimeToUnixMillis converts a Horizon ISO close time to unix millis', () => {
    expect(closeTimeToUnixMillis('2024-01-01T00:00:00.500Z')).toBe(1704067200500);
  });

  test('closeTimeToUnixMillis returns 0 for an unparsable string', () => {
    expect(closeTimeToUnixMillis('garbage')).toBe(0);
  });

  test('unixSecondsToCloseTime converts unix seconds back to ISO-8601', () => {
    expect(unixSecondsToCloseTime(1704067200)).toBe('2024-01-01T00:00:00.000Z');
  });

  test('round-trips through both conversion directions', () => {
    const original = '2025-06-15T12:30:45.000Z';
    const seconds = closeTimeToUnixSeconds(original);
    expect(unixSecondsToCloseTime(seconds)).toBe(original);
  });

  test('isValidCloseTime accepts well-formed ISO strings', () => {
    expect(isValidCloseTime('2024-01-01T00:00:00Z')).toBe(true);
  });

  test('isValidCloseTime rejects malformed strings', () => {
    expect(isValidCloseTime('not-a-date')).toBe(false);
  });

  test('closeTimeAgeSeconds computes elapsed time against a reference timestamp', () => {
    const closeTime = '2024-01-01T00:00:00Z';
    const reference = 1704067200 + 3600; // one hour later
    expect(closeTimeAgeSeconds(closeTime, reference)).toBe(3600);
  });

  test('closeTimeAgeSeconds defaults to comparing against the current time', () => {
    const nowIso = new Date().toISOString();
    const age = closeTimeAgeSeconds(nowIso);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(5);
  });
});
