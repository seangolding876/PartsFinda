// /lib/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role?: string; // ✅ Optional bana dein
  iat?: number;
  exp?: number;
  iss?: string;
}

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>): string {
  if (!JWT_SECRET || JWT_SECRET === 'your-fallback-secret-key-for-development-only') {
    console.warn('⚠️  Using fallback JWT secret - set JWT_SECRET environment variable in production');
  }

const options: jwt.SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any,
    issuer: 'partsfinda-api'
};

  return jwt.sign(payload, JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Validate required fields (role optional)
    if (!decoded.userId || !decoded.email) {
      throw new Error('Invalid token payload');
    }

    return decoded;
  } catch (error: any) {
    console.error('JWT verification error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}