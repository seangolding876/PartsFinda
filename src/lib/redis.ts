import Redis from 'ioredis';

const getRedisConfig = () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redisPassword = process.env.REDIS_PASSWORD || '123@123';
  
  return {
    url: redisUrl,
    password: redisPassword,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    connectTimeout: 10000,
    commandTimeout: 5000
  };
};

class RedisClient {
  private static instance: Redis;
  
  static getInstance(): Redis {
    if (!RedisClient.instance) {
      const config = getRedisConfig();
      // Use the single-options overload (includes `url`) and omit unknown properties.
      RedisClient.instance = new Redis({
        url: config.url,
        password: config.password,
        maxRetriesPerRequest: config.maxRetriesPerRequest,
        lazyConnect: config.lazyConnect,
        connectTimeout: config.connectTimeout,
        commandTimeout: config.commandTimeout
      } as any);

      RedisClient.instance.on('error', (err) => {
        console.error('❌ Redis error:', err);
      });

      RedisClient.instance.on('connect', () => {
        console.log('✅ Connected to Redis');
      });
    }
    
    return RedisClient.instance;
  }
}

export const redis = RedisClient.getInstance();