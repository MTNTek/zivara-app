import { apiClient } from '../api-client';
import { setTokens } from '../auth';

export interface RegisterProfessionalData {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  primaryIndustry: string;
}

export interface RegisterEmployerData {
  fullName: string;
  companyName: string;
  tradeLicenseNumber: string;
  industry: string;
  operatingCountry: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface RegisterResponse {
  message: string;
  requiresEmailVerification: boolean;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    role: string;
    employerId?: string;
  };
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  languagePreference: string;
  isVerifiedEmail: boolean;
  createdAt: string;
}

export async function registerProfessional(data: RegisterProfessionalData): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>('/auth/register/professional', data);
}

export async function registerEmployer(data: RegisterEmployerData): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>('/auth/register/employer', data);
}

export async function login(data: LoginData): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  // Store the access token after successful login
  // The refresh token is set as an HTTP-only cookie by the server
  setTokens(response.accessToken, ''); // refresh token is in cookie
  return response;
}

export async function logout(): Promise<void> {
  await apiClient.post<void>('/auth/logout');
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>('/auth/reset-password', { token, password });
}

export async function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  return apiClient.patch<{ message: string }>('/auth/password', data);
}

export async function refreshTokens(): Promise<{ accessToken: string; expiresIn: number }> {
  return apiClient.post<{ accessToken: string; expiresIn: number }>('/auth/refresh');
}

export async function getCurrentUser(): Promise<CurrentUser> {
  return apiClient.get<CurrentUser>('/auth/me');
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiClient.get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`);
}
