import jwt from 'jsonwebtoken';

// IMPORTANT: Same secret use karein jo login API mein use kar rahe hain
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-at-least-32-chars';

export interface JwtPayload {
  userId: string; // string rahega, UUID nahi required
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

export function generateToken(payload: JwtPayload): string {
  console.log('🔐 Generating token with payload:', payload);
  
  // Sign options properly define karein
  const options: jwt.SignOptions = {
    expiresIn: '7d',
    issuer: 'partsfinda-api'
  };

  const token = jwt.sign(payload, JWT_SECRET, options);
  console.log('✅ Token generated:', token);
  return token;
}

export function verifyToken(token: string): JwtPayload {
  try {
    console.log('🔍 Verifying token:', token);
    
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    console.log('✅ Token verified successfully:', decoded);
    
    return decoded;
  } catch (error: any) {
    console.error('❌ Token verification failed:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token signature');
    } else if (error.name === 'NotBeforeError') {
      throw new Error('Token not active');
    } else {
      throw new Error('Token verification failed: ' + error.message);
    }
  }
}