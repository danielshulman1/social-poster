import IORedis, { type RedisOptions } from "ioredis";

let redisClient: IORedis | null | undefined;

const normalizeEnv = (value?: string | null) =>
  (value || "").trim().replace(/^["']|["']$/g, "");

export function getRedisConnectionOptions(): string | RedisOptions | null {
  const redisUrl = normalizeEnv(process.env.REDIS_URL);
  if (redisUrl) {
    return redisUrl;
  }

  const host = normalizeEnv(process.env.REDIS_HOST);
  if (!host) {
    return null;
  }

  const port = Number.parseInt(normalizeEnv(process.env.REDIS_PORT) || "6379", 10);
  const password = normalizeEnv(process.env.REDIS_PASSWORD);
  const username = normalizeEnv(process.env.REDIS_USERNAME);
  const tlsEnabled = normalizeEnv(process.env.REDIS_TLS).toLowerCase() === "true";

  return {
    host,
    port: Number.isFinite(port) ? port : 6379,
    ...(password ? { password } : {}),
    ...(username ? { username } : {}),
    ...(tlsEnabled ? { tls: {} } : {}),
    maxRetriesPerRequest: null,
  } satisfies RedisOptions;
}

export function getRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const connection = getRedisConnectionOptions();
  if (!connection) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new IORedis(connection as any);
  redisClient.on("error", (error) => {
    console.error("Redis client error:", error);
  });

  return redisClient;
}
