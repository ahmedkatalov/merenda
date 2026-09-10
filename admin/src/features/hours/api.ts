import type { Schedule, ScheduleException, ScheduleExceptionInput, ScheduleHoursInput, ScheduleInput } from '@merenda/shared';
import { admin } from '@/lib/api';

/** Schedules + exceptions. Reading the list goes through `useSchedules()` (menus feature, GET /schedules). */
export const hoursApi = {
  create: (body: ScheduleInput) => admin.post<Schedule>('/schedules', body),
  rename: (id: string, body: ScheduleInput) => admin.patch<Schedule>(`/schedules/${id}`, body),
  remove: (id: string) => admin.delete(`/schedules/${id}`),
  saveHours: (id: string, body: ScheduleHoursInput) => admin.put<Schedule>(`/schedules/${id}/hours`, body),
  addException: (id: string, body: ScheduleExceptionInput) => admin.post<ScheduleException>(`/schedules/${id}/exceptions`, body),
  removeException: (id: string, exceptionId: string) => admin.delete(`/schedules/${id}/exceptions/${exceptionId}`),
};
