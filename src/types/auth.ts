export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'buyer' | 'seller';
  created_at: Date;
  updated_at: Date;
}

export interface UserResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: 'admin' | 'buyer' | 'seller';
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  authToken?: string;
  user?: UserResponse;
}

export interface JwtPayload {
  userId: number;
  email: string;
  name: string;
  role: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

export interface DatabaseUser {
  id: number;
  email: string;
  password: string;
  name: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}