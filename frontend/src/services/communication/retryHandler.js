/**
 * MediMind AI — Phase 9 Communication Platform
 * Bounded Retry Handler with Exponential Backoff & Jitter
 * Strictly prevents infinite loops and distinguishes transient network failures from fatal client errors.
 */

import { DELIVERY_STATUS } from './provider.types.js';

export class RetryHandler {
  constructor({ maxAttempts = 3, initialDelayMs = 250, backoffFactor = 2, maxDelayMs = 2000 } = {}) {
    this.maxAttempts = maxAttempts;
    this.initialDelayMs = initialDelayMs;
    this.backoffFactor = backoffFactor;
    this.maxDelayMs = maxDelayMs;
  }

  isTransientError(error) {
    if (!error) return false;
    const msg = String(error.message || error).toLowerCase();
    return (
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('rate limit') ||
      msg.includes('429') ||
      msg.includes('503') ||
      msg.includes('502') ||
      msg.includes('gateway')
    );
  }

  calculateBackoff(attempt) {
    const exp = Math.min(this.maxDelayMs, this.initialDelayMs * Math.pow(this.backoffFactor, attempt - 1));
    const jitter = Math.floor(Math.random() * (exp * 0.2));
    return exp + jitter;
  }

  async executeWithRetry(fn, { onRetry = null } = {}) {
    let lastError = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const result = await fn(attempt);
        // If result explicitly has a non-fatal status or succeeded
        return {
          success: true,
          attempts: attempt,
          result
        };
      } catch (err) {
        lastError = err;

        if (!this.isTransientError(err) || attempt === this.maxAttempts) {
          // Permanent failure or max attempts reached
          break;
        }

        const delay = this.calculateBackoff(attempt);
        if (onRetry) {
          onRetry({
            attempt,
            maxAttempts: this.maxAttempts,
            delay,
            error: err.message,
            status: DELIVERY_STATUS.RETRYING
          });
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return {
      success: false,
      attempts: this.maxAttempts,
      status: DELIVERY_STATUS.FAILED,
      error: lastError?.message || 'Operation failed after retries'
    };
  }
}

export const retryHandler = new RetryHandler();
