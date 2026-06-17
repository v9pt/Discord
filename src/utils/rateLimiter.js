'use strict';

/**
 * Simple in-memory rate limiter using sliding window
 */
class RateLimiter {
  constructor() {
    /** @type {Map<string, number[]>} */
    this.buckets = new Map();
  }

  /**
   * Check if a key has exceeded rate limit
   * @param {string} key - Unique identifier (userId:action)
   * @param {number} maxRequests - Max requests in window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} true if rate limited
   */
  isRateLimited(key, maxRequests = 5, windowMs = 10000) {
    const now = Date.now();
    const timestamps = (this.buckets.get(key) || []).filter(
      (t) => now - t < windowMs
    );
    timestamps.push(now);
    this.buckets.set(key, timestamps);
    return timestamps.length > maxRequests;
  }

  /**
   * Clear stale entries (call periodically)
   */
  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.buckets.entries()) {
      const recent = timestamps.filter((t) => now - t < 60000);
      if (recent.length === 0) {
        this.buckets.delete(key);
      } else {
        this.buckets.set(key, recent);
      }
    }
  }
}

module.exports = new RateLimiter();
