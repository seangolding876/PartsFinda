import Redis from "ioredis";

declare global {
  // avoid multiple connections in dev
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

export const redis =
  global._redis ||
  new Redis({
    host: "127.0.0.1",
    port: 6379,
    password: "123@123", // ✅ your redis password
    db: 1, // ✅ separate DB for rate limit
  });

if (process.env.NODE_ENV !== "production") global._redis = redis;
