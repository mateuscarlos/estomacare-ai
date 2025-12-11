/**
 * Rate Limiting Middleware for Cloud Functions
 * Prevents abuse by limiting requests per user
 */

import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Get Firestore instance (lazy initialization)
 */
const getDb = () => {
  return admin.firestore();
};

/**
 * Rate limiter middleware
 * Limits requests per user per time window
 * 
 * @param config - Rate limit configuration
 * @returns Function that checks rate limit for a user
 * 
 * @example
 * const checkRateLimit = rateLimiter({ maxRequests: 100, windowMs: 60000 });
 * await checkRateLimit(userId);
 */
export const rateLimiter = (config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }) => {
  return async (userId: string): Promise<void> => {
    const db = getDb();
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    const rateLimitDoc = db.collection('rateLimits').doc(userId);
    
    try {
      await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(rateLimitDoc);
        
        if (!doc.exists) {
          // First request
          transaction.set(rateLimitDoc, {
            requests: [now],
            lastCleanup: now
          });
          return;
        }
        
        const data = doc.data()!;
        let requests: number[] = data.requests || [];
        
        // Remove old requests outside the window
        requests = requests.filter(timestamp => timestamp > windowStart);
        
        if (requests.length >= config.maxRequests) {
          throw new HttpsError(
            'resource-exhausted',
            `Limite de ${config.maxRequests} requisições por minuto excedido. Tente novamente em alguns instantes.`
          );
        }
        
        // Add new request
        requests.push(now);
        
        transaction.update(rateLimitDoc, {
          requests,
          lastCleanup: now
        });
      });
    } catch (error: any) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error('Rate limiter error:', error);
      // Don't block on rate limiter errors
    }
  };
};

/**
 * Cleanup old rate limit records
 * Should be called periodically (e.g., via scheduled function)
 */
export const cleanupRateLimits = async (): Promise<void> => {
  const db = getDb();
  const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
  
  const snapshot = await db.collection('rateLimits')
    .where('lastCleanup', '<', cutoff)
    .limit(100)
    .get();
  
  const batch = db.batch();
  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`Cleaned up ${snapshot.size} old rate limit records`);
};
