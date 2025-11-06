import { redis } from "./redis";

export async function rateLimit(
  ip: string,
  limit = 60,
  ttl = 60
): Promise<boolean> {
  const key = `rate:${ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, ttl);
  }

  return current <= limit;
}


