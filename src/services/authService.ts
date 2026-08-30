import { api } from './api';
import type { LoginRequest, TokenResponse } from '../types/api';

export const authService = {
  login: (data: LoginRequest) => api.post<TokenResponse>('/api/auth/login', data).then((r) => r.data),
};
