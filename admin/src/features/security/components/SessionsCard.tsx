import { useMemo, useState } from 'react';
import { LogOut, Monitor, ShieldCheck, Smartphone } from 'lucide-react';
import type { AdminSession } from '@merenda/shared';
import { cn, formatDateTime, pluralize } from '@/lib/utils';
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, SkeletonRows } from '@/components/ui';
import { useRevokeOtherSessions, useRevokeSession, useSessions } from '../hooks';
import { parseUserAgent } from '../userAgent';

export function SessionsCard({ className }: { className?: string }) {
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Current session first, then newest first.
  const sorted = useMemo(
    () =>
      [...(sessions.data ?? [])].sort(
        (a, b) => Number(b.current) - Number(a.current) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [sessions.data],
  );
  const others = sorted.filter((s) => !s.current);

  return (
    <>
      <Card
        className={className}
        padding="none"
        title="Активные сессии"
        description="Устройства, с которых выполнен вход в панель управления."
        actions={
          <Button variant="secondary" icon={<LogOut />} disabled={others.length === 0} onClick={() => setConfirmOpen(true)}>
            <span className="sm:hidden">Завершить другие</span>
            <span className="hidden sm:inline">Завершить все остальные</span>
          </Button>
        }
      >
        {sessions.isPending ? (
          <div className="px-5 pb-5 pt-1">
            <SkeletonRows rows={3} height="h-16" />
          </div>
        ) : sessions.isError ? (
          <div className="px-5 pb-5 pt-1">
            <ErrorState error={sessions.error} onRetry={() => void sessions.refetch()} />
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState compact icon={<Monitor />} title="Активных сессий нет" description="Список обновится после следующего входа." />
        ) : (
          <ul className="divide-y divide-zinc-100 border-t border-zinc-100">
            {sorted.map((s) => (
              <SessionRow key={s.id} session={s} revoking={revoke.isPending && revoke.variables === s.id} onRevoke={() => revoke.mutate(s.id)} />
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        tone="danger"
        title="Завершить все остальные сессии?"
        description={`На других устройствах потребуется войти заново (${pluralize(others.length, ['сессия', 'сессии', 'сессий'])}).`}
        confirmLabel="Завершить"
        loading={revokeOthers.isPending}
        onConfirm={() => {
          if (others.length === 0) {
            setConfirmOpen(false);
            return;
          }
          revokeOthers.mutate(
            others.map((s) => s.id),
            { onSuccess: () => setConfirmOpen(false) },
          );
        }}
      />
    </>
  );
}

function SessionRow({ session, revoking, onRevoke }: { session: AdminSession; revoking: boolean; onRevoke: () => void }) {
  const ua = parseUserAgent(session.userAgent);
  const Icon = ua.isMobile ? Smartphone : Monitor;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600', session.current && 'bg-emerald-50 text-emerald-600')}>
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold text-zinc-900" title={session.userAgent || undefined}>
              {ua.label}
            </span>
            {session.current && (
              <Badge tone="success" size="sm" icon={<ShieldCheck />}>
                Текущая
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-zinc-500">
            {session.ip && <span className="tabular-nums">{session.ip}</span>}
            <span>Вход: {formatDateTime(session.createdAt)}</span>
            <span>Истекает: {formatDateTime(session.expiresAt)}</span>
          </p>
        </div>
      </div>
      {!session.current && (
        <Button variant="ghost" icon={<LogOut />} loading={revoking} onClick={onRevoke} className="ml-13 self-start text-zinc-600 hover:text-red-600 sm:ml-0 sm:self-center">
          Завершить
        </Button>
      )}
    </li>
  );
}
