import { YieldPerformanceTracker } from '../src/analytics/yield-tracker';
import { AccreditationReminderHook } from '../src/compliance/accreditation-reminder-hook';
import { validateStellarMinReserve } from '../src/utils/validation';
import * as swaggerDoc from '../src/docs/swagger.json';

describe('Batch 5 More Resolved Issues Test Suite (#11, #16, #18, #19, #41)', () => {
  const mockUser = 'GAAZI4TCR3TY5OJHCTJC2A4ZXSYBZFM6W7V6D8O4D62P23F2OR36272A';

  test('Issue #11: OpenAPI Swagger specification validity', () => {
    expect(swaggerDoc.openapi).toBe('3.0.0');
    expect(swaggerDoc.info.title).toContain('Stellar RWA Vault');
    expect(swaggerDoc.paths['/vault/deposit']).toBeDefined();
    expect(swaggerDoc.paths['/vault/withdraw']).toBeDefined();
    expect(swaggerDoc.paths['/vault/state']).toBeDefined();
  });

  test('Issue #16: Historical APY Yield Performance Tracker', () => {
    const tracker = new YieldPerformanceTracker();
    const t0 = 1000000;

    // Share price grows from 1.0 to 1.1 over 30 days
    tracker.recordSnapshot(1.0, t0);
    tracker.recordSnapshot(1.05, t0 + 15 * 86400);
    tracker.recordSnapshot(1.10, t0 + 30 * 86400);

    const returnRate30d = tracker.calculateReturnRate(30 * 86400, t0 + 30 * 86400);
    expect(returnRate30d).toBeCloseTo(0.10); // 10% return rate
  });

  test('Issue #18: Accreditation Expiry Reminder Hook', () => {
    const hook = new AccreditationReminderHook(30); // 30 day warning window
    const t0 = 1000000;

    // Expiry in 15 days (15 * 86400 seconds)
    hook.setRecord({
      address: mockUser,
      accreditationExpiry: t0 + 15 * 86400
    });

    const status = hook.checkExpiryWarning(mockUser, t0);
    expect(status.isExpiringSoon).toBe(true);
    expect(status.daysRemaining).toBe(15);
  });

  test('Issue #41: Stellar Account Minimum XLM Base Reserve Validation', () => {
    // 0 subentries requires 1.0 XLM (0.5 * 2)
    expect(() => validateStellarMinReserve(1.5, 0)).not.toThrow();

    // 0.8 XLM fails for 0 subentries
    expect(() => validateStellarMinReserve(0.8, 0)).toThrow('Stellar minimum base reserve');

    // 2 subentries requires 2.0 XLM (0.5 * (2 + 2))
    expect(() => validateStellarMinReserve(1.8, 2)).toThrow('Stellar minimum base reserve');
  });
});
