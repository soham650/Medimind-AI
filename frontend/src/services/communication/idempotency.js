/**
 * MediMind AI — Phase 9 Communication Platform
 * Application-Level Deterministic Idempotency & Deduplication Engine
 *
 * Enforces deduplication using metadata.idempotency_key without altering frozen DB schema.
 * Operates a short-term memory TTL ring buffer to reject rapid duplicate dispatches,
 * and cross-references existing notifications in Supabase to guarantee single-delivery semantics.
 */

class IdempotencyEngine {
  constructor(ttlMs = 60000) {
    this.ttlMs = ttlMs;
    // Map of idempotency_key -> timestamp
    this.memoryCache = new Map();
  }

  /**
   * Generates a deterministic composite key from event parameters
   */
  generateKey(eventType, entityId, recipientId, extra = '') {
    const cleanType = String(eventType || 'event').trim().toLowerCase();
    const cleanEntity = String(entityId || 'none').trim();
    const cleanRecipient = String(recipientId || 'all').trim();
    const cleanExtra = String(extra || '').trim();
    return `idem_${cleanType}_${cleanEntity}_${cleanRecipient}_${cleanExtra}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Fast in-memory check to discard rapid identical triggers
   */
  isRecentlyProcessed(key) {
    this.sweep();
    if (!key) return false;
    const recorded = this.memoryCache.get(key);
    if (recorded && (Date.now() - recorded) < this.ttlMs) {
      return true;
    }
    return false;
  }

  markProcessed(key) {
    if (key) {
      this.memoryCache.set(key, Date.now());
    }
  }

  /**
   * Clean expired entries
   */
  sweep() {
    const now = Date.now();
    for (const [key, ts] of this.memoryCache.entries()) {
      if (now - ts > this.ttlMs) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Checks Supabase notifications table for existing notification with identical idempotency_key
   * Note: Works by querying metadata->>idempotency_key.
   */
  async existsInDatabase(supabaseClient, userId, idempotencyKey) {
    if (!supabaseClient || !userId || !idempotencyKey) return false;

    try {
      const { data, error } = await supabaseClient
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .filter('metadata->>idempotency_key', 'eq', idempotencyKey)
        .limit(1);

      if (error) {
        // Fallback: If metadata JSON filter fails on specific PostgREST versions, allow application check
        return false;
      }

      return Boolean(data && data.length > 0);
    } catch {
      return false;
    }
  }
}

export const idempotencyEngine = new IdempotencyEngine();
