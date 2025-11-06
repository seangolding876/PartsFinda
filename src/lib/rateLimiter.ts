import { redis } from './redis';

export interface RateLimitOptions {
  windowMs: number;        // Time window in milliseconds
  max: number;            // Maximum requests per window
  keyPrefix?: string;     // Redis key prefix
  message?: string;       // Custom error message
  skipFailedRequests?: boolean; // Don't count failed requests
  skipSuccessfulRequests?: boolean; // Don't count successful requests
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
  message?: string;
}

export class RateLimiter {
  private defaultOptions: Required<RateLimitOptions> = {
    windowMs: 15 * 60 * 1000, // 15 minutes default
    max: 100, // 100 requests default
    keyPrefix: 'rl:',
    message: 'Too many requests, please try again later.',
    skipFailedRequests: false,
    skipSuccessfulRequests: false
  };

  /**
   * Check rate limit for a specific identifier
   */
  async check(
    identifier: string, 
    customOptions?: Partial<RateLimitOptions>
  ): Promise<RateLimitResult> {
    const options = { ...this.defaultOptions, ...customOptions };
    const key = `${options.keyPrefix}${identifier}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    try {
      // Use Redis pipeline for better performance
      const pipeline = redis.pipeline();
      
      // Remove old requests outside current window
      pipeline.zremrangebyscore(key, 0, windowStart);
      
      // Get current request count
      pipeline.zcard(key);
      
      // Add current request timestamp
      pipeline.zadd(key, now, `${now}_${Math.random()}`);
      
      // Set expiry
      pipeline.expire(key, Math.ceil(options.windowMs / 1000));
      
      const results = await pipeline.exec();
      
      if (!results) {
        throw new Error('Redis pipeline failed');
      }

      const currentRequests = results[1][1] as number;
      const remaining = Math.max(0, options.max - currentRequests);
      const resetTime = now + options.windowMs;

      return {
        success: currentRequests < options.max,
        limit: options.max,
        remaining,
        resetTime,
        retryAfter: currentRequests >= options.max ? Math.ceil(options.windowMs / 1000) : undefined,
        message: currentRequests >= options.max ? options.message : undefined
      };

    } catch (error) {
      console.error('❌ Rate limiter error:', error);
      // Fail open - allow requests if Redis is down
      return {
        success: true,
        limit: options.max,
        remaining: options.max,
        resetTime: now + options.windowMs
      };
    }
  }

  /**
   * Clean up old entries for a specific identifier
   */
  async cleanup(identifier: string, keyPrefix: string = 'rl:'): Promise<void> {
    const key = `${keyPrefix}${identifier}`;
    try {
      await redis.del(key);
    } catch (error) {
      console.error('❌ Rate limiter cleanup error:', error);
    }
  }
}

// Create global instance
export const rateLimiter = new RateLimiter();

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // Global API rate limiting
  global: (identifier: string) => 
    rateLimiter.check(identifier, {
      windowMs: 60 * 1000, // 1 minute
      max: 60, // 60 requests per minute
      keyPrefix: 'global:',
      message: 'Too many API requests. Please slow down.'
    }),

  // Part requests - strict limiting
  partRequests: (identifier: string) =>
    rateLimiter.check(identifier, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per 15 minutes
      keyPrefix: 'part_req:',
      message: 'Too many part requests. Please try again after 15 minutes.'
    }),

  // Authentication endpoints
  auth: (identifier: string) =>
    rateLimiter.check(identifier, {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // 10 login attempts per hour
      keyPrefix: 'auth:',
      message: 'Too many authentication attempts. Please try again later.'
    }),

  // File uploads
  upload: (identifier: string) =>
    rateLimiter.check(identifier, {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 uploads per hour
      keyPrefix: 'upload:',
      message: 'Too many file uploads. Please try again later.'
    })
};