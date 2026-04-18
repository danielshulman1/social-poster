import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  ttl: number; // Time to live in milliseconds
  limit: number; // Max requests within TTL
}

export const RATE_LIMIT_KEY = 'rateLimit';

/**
 * Rate Limit Decorator
 * Applies rate limiting to individual routes
 * Usage: @RateLimit({ ttl: 60000, limit: 100 })
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
