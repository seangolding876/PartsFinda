// /lib/jwt.ts - Fixed version
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'jkOaaCueEwXf38JVKeH1hDMXKHBvYbS4LE1ZXniFIGen1gVSAK0djz9qKVzqbtztzXYpPJBAqBr9m1bpz0YzUppHQl2IIFkLswfbao6bEdxqo1ChXDbggyjkwhHOmSFmwMwK8j7M5bcpl0u6NOLsNbyuxl9Nzlrz0dY1bICdYX1z5f5bgXTNiRYkesdDtlSF8dAkSTqJocKG19T89qox1QUg8DAiHRGaDpel5MOp07RehHVKu7xZlxoRb7Xx7J2R';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

export function verifyToken(token: string): JwtPayload {
  try {
    console.log('🔍 Verifying token...');
    
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    // Clean the token
    const cleanToken = token.trim();
    
    // Check token structure
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      throw new Error(`Invalid token structure: Expected 3 parts, got ${parts.length}`);
    }

    // Use try-catch without instanceof checks
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    
    console.log('✅ Token verified successfully');
    
    // Type assertion
    return decoded as JwtPayload;
    
  } catch (error: unknown) {
    // Simple error handling without instanceof
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    console.error('❌ Token verification failed:', errorMessage);
    
    // Check error type without instanceof
    if (error && typeof error === 'object' && 'name' in error) {
      const errorName = (error as any).name;
      
      if (errorName === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (errorName === 'JsonWebTokenError') {
        throw new Error('Invalid token signature');
      } else if (errorName === 'NotBeforeError') {
        throw new Error('Token not active');
      }
    }
    
    throw new Error('Token verification failed: ' + errorMessage);
  }
}

// Simple decode function
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}