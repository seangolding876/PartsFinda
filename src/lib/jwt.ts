import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types/auth';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-fallback-secret';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp' | 'iss'>): string {
  return jwt.sign(
    payload, 
    JWT_SECRET, 
    { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'partsfinda-api'
    } as jwt.SignOptions
  );
}

export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}