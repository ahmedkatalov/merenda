import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { AdminSession, ChangePasswordRequest, UpdateProfileRequest } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { authApi } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store';

/** Fresh profile from the server on every mount; keeps the auth store in sync. */
export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useQuery({ queryKey: qk.me, queryFn: authApi.me, staleTime: 0 });
  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);
  return query;
}

export function useSessions() {
  return useQuery({ queryKey: qk.sessions, queryFn: authApi.sessions });
}

/**
 * Field errors are mapped onto the form by the caller (`applyServerErrors`),
 * so this hook intentionally has no `onError` toast.
 */
export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => authApi.updateMe(body),
    onSuccess: (user) => {
      useAuthStore.getState().setUser(user);
      qc.setQueryData(qk.me, user);
      toast.success('Профиль обновлён');
    },
  });
}

/** The server revokes every other session on success, hence the invalidation. */
export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ChangePasswordRequest) => authApi.changePassword(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.sessions });
      toast.success('Пароль изменён');
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => authApi.deleteSession(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<AdminSession[]>(qk.sessions, (prev) => prev?.filter((s) => s.id !== id));
      toast.success('Сессия завершена');
    },
    onError: (e) => toast.error(errorMessage(e)),
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.sessions }),
  });
}

/** Revokes the given sessions one by one (the API has no bulk endpoint). */
export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await authApi.deleteSession(id);
    },
    onSuccess: () => toast.success('Остальные сессии завершены'),
    onError: (e) => toast.error(errorMessage(e)),
    // Also runs after a partial failure so the list reflects what was actually revoked.
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.sessions }),
  });
}
