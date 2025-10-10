import jwt from 'jsonwebtoken';

// ✅ Server-side secret
const JWT_SECRET = process.env.JWT_SECRET!;
if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');

// Payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

// Generate JWT token (server-side only)
export function generateToken(payload: JwtPayload): string {
  console.log('🔐 Generating token with payload:', payload);

  const options: jwt.SignOptions = {
    expiresIn: '7d',
    issuer: 'partsfinda-api',
    algorithm: 'HS256',
  };

  const token = jwt.sign(payload, JWT_SECRET, options);
  console.log('✅ Token generated:', token);
  return token;
}

// Verify JWT token (server-side only)
export function verifyToken(token: string): JwtPayload {
  try {
    console.log('🔍 Verifying token:', token);

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('✅ Token verified successfully:', decoded);

    return decoded;
  } catch (error: any) {
    console.error('❌ Token verification failed:', error?.message);

    // Proper error handling
    switch (error?.name) {
      case 'TokenExpiredError':
        throw new Error('Token expired');
      case 'JsonWebTokenError':
        throw new Error('Invalid token signature');
      case 'NotBeforeError':
        throw new Error('Token not active yet');
      default:
        throw new Error('Token verification failed: ' + error?.message);
    }
  }
}
