/**
 * Authentication and User Types
 */

export interface UserResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF' | string;
  profileImage?: string | null;
  createdAt: string;
}

export interface AuthResponseData {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: {
    id?: string | number;
    name?: string;
    fullName?: string;
    email?: string;
    role?: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  referralCode?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  token?: string;
  user: UserResponse;
}

export interface AuthPageProps {
  mode: 'login' | 'register';
}
