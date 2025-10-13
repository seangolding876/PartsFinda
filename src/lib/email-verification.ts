import { query } from '@/lib/db';
import crypto from 'crypto';

// Generate verification token
export async function generateVerificationToken(userId: number, email: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

  // Delete any existing tokens for this user
  await query(
    'DELETE FROM email_verification_tokens WHERE user_id = $1',
    [userId]
  );

  // Insert new token
  await query(
    `INSERT INTO email_verification_tokens (user_id, email, token, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, email, token, expiresAt]
  );

  return token;
}

// Verify token
export async function verifyEmailToken(token: string) {
  const result = await query(
    `SELECT user_id, email, expires_at 
     FROM email_verification_tokens 
     WHERE token = $1 AND used = false`,
    [token]
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired verification token');
  }

  const tokenData = result.rows[0];
  
  // Check if token is expired
  if (new Date() > new Date(tokenData.expires_at)) {
    await query(
      'UPDATE email_verification_tokens SET used = true WHERE token = $1',
      [token]
    );
    throw new Error('Verification token has expired');
  }

  return tokenData;
}

// Mark token as used
export async function markTokenAsUsed(token: string) {
  await query(
    'UPDATE email_verification_tokens SET used = true WHERE token = $1',
    [token]
  );
}