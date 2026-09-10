import type { AdminSession, AdminUser, ChangePasswordRequest, LoginRequest, LoginResponse, UpdateProfileRequest } from '@merenda/shared';
import { admin, request } from '@/lib/api';

export const authApi = {
  login: (body: LoginRequest) => request<LoginResponse>('/admin/auth/login', { method: 'POST', body, auth: false }),
  logout: () => request<void>('/admin/auth/logout', { method: 'POST', auth: false }),
  me: () => admin.get<AdminUser>('/auth/me'),
  updateMe: (body: UpdateProfileRequest) => admin.patch<AdminUser>('/auth/me', body),
  changePassword: (body: ChangePasswordRequest) => admin.post<void>('/auth/password', body),
  sessions: () => admin.get<AdminSession[]>('/auth/sessions'),
  deleteSession: (id: string) => admin.delete(`/auth/sessions/${id}`),
};
