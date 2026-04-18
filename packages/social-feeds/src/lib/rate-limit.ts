import { getRedisClient } from "@/lib/redis";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

const getNow = () => Date.now();

const getClientIpFromHeaders = (headers: Headers) => {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-client-ip") ||
    "unknown"
  );
};

export const getRequestClientIp = (req: Request) => getClientIpFromHeaders(req.headers);

function consumeInMemoryRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = getNow();
  const { key, limit, windowMs } = options;

  for (const [entryKey, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(entryKey);
    }
  }

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - 1, 0),
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  return {
    allowed: true,
    limit,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
  };
}

export async function consumeRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return consumeInMemoryRateLimit(options);
  }

  const now = getNow();
  const { key, limit, windowMs } = options;

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }

    const ttlMs = await redis.pttl(key);
    const normalizedTtlMs = ttlMs > 0 ? ttlMs : windowMs;

    if (count > limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt: now + normalizedTtlMs,
        retryAfterSeconds: Math.max(Math.ceil(normalizedTtlMs / 1000), 1),
      };
    }

    return {
      allowed: true,
      limit,
      remaining: Math.max(limit - count, 0),
      resetAt: now + normalizedTtlMs,
      retryAfterSeconds: Math.max(Math.ceil(normalizedTtlMs / 1000), 1),
    };
  } catch (error) {
    console.error("Redis rate limit failed, falling back to memory:", error);
    return consumeInMemoryRateLimit(options);
  }
}

export const buildRateLimitHeaders = (result: RateLimitResult) => ({
  "Retry-After": String(result.retryAfterSeconds),
  "X-RateLimit-Limit": String(result.limit),
  "X-RateLimit-Remaining": String(result.remaining),
  "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
});
