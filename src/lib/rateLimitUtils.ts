import { NextRequest, NextResponse } from 'next/server';

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try different headers in order
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip', // Cloudflare
    'true-client-ip'
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // Take first IP from comma-separated list
      const ips = value.split(',').map(ip => ip.trim());
      return ips[0] || 'unknown';
    }
  }

  // Fallback to connection remote address
  return 'unknown';
}

/**
 * Generate rate limit identifier
 */
export function getRateLimitIdentifier(
  request: NextRequest, 
  type: string = 'global'
): string {
  const ip = getClientIP(request);
  
  // Include user ID if available (for authenticated endpoints)
  const authHeader = request.headers.get('authorization');
  let userId = 'anonymous';
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Extract user ID from token if needed
    // You can decode JWT here if you want user-based limiting
    userId = 'authenticated';
  }
  
  return `${type}:${ip}:${userId}`;
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  result: any
): void {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
  
  if (result.retryAfter) {
    response.headers.set('Retry-After', result.retryAfter.toString());
  }
}