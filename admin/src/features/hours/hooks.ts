import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Schedule, ScheduleDay, ScheduleException, ScheduleExceptionInput, ScheduleInput } from '@merenda/shared';
import { errorMessage } from '@/lib/api';
import { qk } from '@/lib/queryKeys';
import { hoursApi } from './api';

export { useSchedules } from '@/features/menus/hooks';
export { useSiteStatus } from '@/features/dashboard/hooks';

/** Everything derived from schedules: the list, the public status and the dashboard (topbar pill). */
function invalidateSchedules(qc: QueryClient) {
  void qc.invalidateQueries({ queryKey: qk.schedules });
  void qc.invalidateQueries({ queryKey: qk.siteStatus });
  void qc.invalidateQueries({ queryKey: qk.dashboard });
}

function patchSchedule(qc: QueryClient, id: string, patch: (s: Schedule) => Schedule) {
  qc.setQueryData<Schedule[]>(qk.schedules, (prev) => prev?.map((s) => (s.id === id ? patch(s) : s)));
}

/** POST /schedules — field errors are handled by the form (applyServerErrors). */
export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ScheduleInput) => hoursApi.create(body),
    onSuccess: (created) => {
      qc.setQueryData<Schedule[]>(qk.schedules, (prev) => (prev && !prev.some((s) => s.id === created.id) ? [...prev, created] : prev));
      invalidateSchedules(qc);
      toast.success('Расписание создано');
    },
  });
}

/** PATCH /schedules/:id — field errors are handled by the form. */
export function useRenameSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ScheduleInput }) => hoursApi.rename(id, body),
    onSuccess: (saved) => {
      patchSchedule(qc, saved.id, (s) => ({ ...s, ...saved }));
      invalidateSchedules(qc);
      toast.success('Сохранено');
    },
  });
}

export function useDeleteSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hoursApi.remove(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Schedule[]>(qk.schedules, (prev) => prev?.filter((s) => s.id !== id));
      invalidateSchedules(qc);
      // Menus bound to the schedule fall back to venue hours.
      void qc.invalidateQueries({ queryKey: qk.menus });
      toast.success('Расписание удалено');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

export function useSaveHours() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: ScheduleDay[] }) => hoursApi.saveHours(id, { hours }),
    onSuccess: (saved) => {
      patchSchedule(qc, saved.id, (s) => ({ ...s, ...saved }));
      invalidateSchedules(qc);
      toast.success('Часы сохранены');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}

/** POST /schedules/:id/exceptions (upsert by date) — field errors are handled by the form. */
export function useAddException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, body }: { scheduleId: string; body: ScheduleExceptionInput }) => hoursApi.addException(scheduleId, body),
    onSuccess: (created: ScheduleException, { scheduleId }) => {
      patchSchedule(qc, scheduleId, (s) => ({
        ...s,
        exceptions: [...s.exceptions.filter((e) => e.id !== created.id && e.date !== created.date), created],
      }));
      invalidateSchedules(qc);
      toast.success('Дата добавлена');
    },
  });
}

export function useRemoveException() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, exceptionId }: { scheduleId: string; exceptionId: string }) => hoursApi.removeException(scheduleId, exceptionId),
    onSuccess: (_, { scheduleId, exceptionId }) => {
      patchSchedule(qc, scheduleId, (s) => ({ ...s, exceptions: s.exceptions.filter((e) => e.id !== exceptionId) }));
      invalidateSchedules(qc);
      toast.success('Дата удалена');
    },
    onError: (e) => toast.error(errorMessage(e)),
  });
}
