import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, rateLimiter } from './rateLimiter';
import { getRateLimitIdentifier, addRateLimitHeaders } from './rateLimitUtils';

export type RateLimitType = 'global' | 'partRequests' | 'auth' | 'upload' | 'custom';

export interface RateLimitConfig {
  type?: RateLimitType;
  windowMs?: number;
  max?: number;
  message?: string;
  keyPrefix?: string;
}

/**
 * Higher-order function to wrap API routes with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { type = 'global', ...customConfig } = config;
    
    try {
      // Get rate limit identifier
      const identifier = getRateLimitIdentifier(request, type);
      
      let rateLimitResult;
      
      if (type === 'custom') {
        // Use custom configuration
        rateLimitResult = await rateLimiter.check(identifier, {
          windowMs: customConfig.windowMs || 60000,
          max: customConfig.max || 60,
          keyPrefix: customConfig.keyPrefix || 'custom:',
          message: customConfig.message
        });
      } else {
        // Use pre-configured rate limiter
        rateLimitResult = await rateLimiters[type](identifier);
      }
      
      // Check if rate limited
      if (!rateLimitResult.success) {
        const response = NextResponse.json({
          success: false,
          error: rateLimitResult.message || 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        }, { status: 429 });
        
        addRateLimitHeaders(response, rateLimitResult);
        return response;
      }
      
      // Execute the original handler
      const response = await handler(request);
      
      // Add rate limit headers to successful response
      addRateLimitHeaders(response, rateLimitResult);
      
      return response;
      
    } catch (error) {
      console.error('❌ Rate limit middleware error:', error);
      
      // If rate limiting fails, still execute the handler (fail-open)
      return await handler(request);
    }
  };
}