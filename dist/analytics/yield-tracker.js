"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.YieldPerformanceTracker = void 0;
class YieldPerformanceTracker {
    snapshots = [];
    /**
     * Record a new share price snapshot
     */
    recordSnapshot(sharePrice, timestamp = Math.floor(Date.now() / 1000)) {
        if (sharePrice <= 0)
            return;
        this.snapshots.push({ timestamp, sharePrice });
    }
    /**
     * Calculate historical return rate over rolling duration (in seconds)
     * e.g. 7 days (604800s), 30 days (2592000s), 365 days (31536000s)
     */
    calculateReturnRate(durationSeconds, currentTimestamp = Math.floor(Date.now() / 1000)) {
        if (this.snapshots.length < 2)
            return 0.0;
        const currentSnap = this.snapshots[this.snapshots.length - 1];
        const cutoff = currentTimestamp - durationSeconds;
        // Find closest historical snapshot at or before cutoff
        let pastSnap = this.snapshots[0];
        for (const snap of this.snapshots) {
            if (snap.timestamp <= cutoff) {
                pastSnap = snap;
            }
            else {
                break;
            }
        }
        if (pastSnap.sharePrice <= 0)
            return 0.0;
        return (currentSnap.sharePrice - pastSnap.sharePrice) / pastSnap.sharePrice;
    }
}
exports.YieldPerformanceTracker = YieldPerformanceTracker;
