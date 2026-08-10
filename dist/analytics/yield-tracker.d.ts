export interface SharePriceSnap {
    timestamp: number;
    sharePrice: number;
}
export declare class YieldPerformanceTracker {
    private snapshots;
    /**
     * Record a new share price snapshot
     */
    recordSnapshot(sharePrice: number, timestamp?: number): void;
    /**
     * Calculate historical return rate over rolling duration (in seconds)
     * e.g. 7 days (604800s), 30 days (2592000s), 365 days (31536000s)
     */
    calculateReturnRate(durationSeconds: number, currentTimestamp?: number): number;
}
