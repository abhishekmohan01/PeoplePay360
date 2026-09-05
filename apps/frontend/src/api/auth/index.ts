import { apiClient } from '../client';
import type { User } from '../../stores/auth.store';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', { email, password });
}
