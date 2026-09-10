import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, CheckCheck, Copy, MessageCircle, Phone, RotateCcw, Trash2, UserRound, X } from 'lucide-react';
import { formatMoney, ORDER_TYPE_LABELS, type Order, type OrderStatus } from '@merenda/shared';
import { copyToClipboard, formatDateTime, formatRelative, pluralize } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge, Button, Card, ConfirmDialog, ErrorState, PageHeader, Skeleton } from '@/components/ui';
import { useDeleteOrder, useOrder, useSetOrderStatus } from '../hooks';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderTypeBadge } from './OrdersPage';

interface Transition {
  status: OrderStatus;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
  icon: React.ReactNode;
}

const TRANSITIONS: Record<OrderStatus, Transition[]> = {
  new: [
    { status: 'confirmed', label: 'Подтвердить', variant: 'primary', icon: <Check /> },
    { status: 'cancelled', label: 'Отменить', variant: 'secondary', icon: <X /> },
  ],
  confirmed: [
    { status: 'completed', label: 'Выполнен', variant: 'primary', icon: <CheckCheck /> },
    { status: 'cancelled', label: 'Отменить', variant: 'secondary', icon: <X /> },
  ],
  completed: [{ status: 'confirmed', label: 'Вернуть в подтверждённые', variant: 'secondary', icon: <RotateCcw /> }],
  cancelled: [{ status: 'new', label: 'Вернуть в новые', variant: 'secondary', icon: <RotateCcw /> }],
};

function ItemsCard({ order }: { order: Order }) {
  const count = order.items.reduce((n, i) => n + i.quantity, 0);
  return (
    <Card title="Состав заказа" description={pluralize(count, ['позиция', 'позиции', 'позиций'])} padding="none">
      <table className="w-full text-sm">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-zinc-100 text-[12px] uppercase tracking-wide text-zinc-500">
            <th className="px-5 py-2 text-left font-medium">Блюдо</th>
            <th className="px-3 py-2 text-right font-medium">Цена</th>
            <th className="px-3 py-2 text-center font-medium">Кол-во</th>
            <th className="px-5 py-2 text-right font-medium">Сумма</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-b border-zinc-100 last:border-b-0">
              <td className="px-5 py-3">
                <div className="font-medium text-zinc-900">{i.name}</div>
                <div className="text-[12.5px] text-zinc-500 sm:hidden">
                  {formatMoney(i.priceMinor)} × {i.quantity}
                </div>
              </td>
              <td className="hidden px-3 py-3 text-right tabular-nums text-zinc-600 sm:table-cell">{formatMoney(i.priceMinor)}</td>
              <td className="hidden px-3 py-3 text-center tabular-nums text-zinc-600 sm:table-cell">× {i.quantity}</td>
              <td className="px-5 py-3 text-right font-semibold tabular-nums text-zinc-900">{formatMoney(i.totalMinor)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {order.subtotalMinor !== order.totalMinor && (
            <tr className="border-t border-zinc-100 text-zinc-600">
              <td className="px-5 py-2" colSpan={3}>
                Подытог
              </td>
              <td className="px-5 py-2 text-right tabular-nums">{formatMoney(order.subtotalMinor)}</td>
            </tr>
          )}
          <tr className="border-t border-zinc-200 bg-zinc-50/60">
            <td className="px-5 py-3 text-[15px] font-semibold text-zinc-900" colSpan={3}>
              Итого
            </td>
            <td className="px-5 py-3 text-right text-[15px] font-semibold tabular-nums text-zinc-900">{formatMoney(order.totalMinor)}</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useOrder(id);
  const setStatus = useSetOrderStatus();
  const remove = useDeleteOrder();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const order = query.data;

  const copyMessage = async () => {
    if (!order) return;
    const ok = await copyToClipboard(order.whatsappMessage);
    if (ok) {
      setCopied(true);
      toast.success('Сообщение скопировано');
      setTimeout(() => setCopied(false), 1500);
    } else toast.error('Не удалось скопировать');
  };

  if (query.isError) {
    return (
      <>
        <PageHeader backTo="/orders" backLabel="Заказы" title="Заказ" />
        <ErrorState error={query.error} onRetry={() => void query.refetch()} title="Не удалось загрузить заказ" />
      </>
    );
  }

  return (
    <>
      <PageHeader
        backTo="/orders"
        backLabel="Заказы"
        title={
          order ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              Заказ №{order.number}
              <OrderStatusBadge status={order.status} size="md" />
            </span>
          ) : (
            'Заказ'
          )
        }
        description={order ? `${formatDateTime(order.createdAt)} · ${formatRelative(order.createdAt)}` : undefined}
        actions={
          order && (
            <>
              {TRANSITIONS[order.status].map((t) => (
                <Button key={t.status} variant={t.variant} icon={t.icon} loading={setStatus.isPending && setStatus.variables?.status === t.status} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: order.id, status: t.status })}>
                  {t.label}
                </Button>
              ))}
            </>
          )
        }
      />

      {!order ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Skeleton className="h-72 rounded-xl" />
          <div className="space-y-5">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-40 rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="space-y-5">
            <ItemsCard order={order} />
            <Card
              title="Сообщение в WhatsApp"
              description="Текст, который гость отправил (или должен был отправить) вам."
              actions={
                <Button variant="secondary" size="sm" icon={copied ? <Check /> : <Copy />} onClick={() => void copyMessage()}>
                  {copied ? 'Скопировано' : 'Копировать'}
                </Button>
              }
            >
              {order.whatsappMessage ? (
                <pre className="whitespace-pre-wrap rounded-xl bg-[#E7FFDB] px-4 py-3 font-sans text-[13.5px] leading-relaxed text-zinc-800 ring-1 ring-inset ring-emerald-200/60">{order.whatsappMessage}</pre>
              ) : (
                <p className="text-sm text-zinc-500">Сообщение не сформировано.</p>
              )}
            </Card>
          </div>

          <div className="space-y-5">
            <Card title="Гость">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                  <div>
                    <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Имя</dt>
                    <dd className="text-zinc-900">{order.customerName || <span className="text-zinc-400">не указано</span>}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                  <div>
                    <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Телефон</dt>
                    <dd className="text-zinc-900">
                      {order.customerPhone ? (
                        <a href={`tel:${order.customerPhone.replace(/[^\d+]/g, '')}`} className="font-medium hover:underline">
                          {order.customerPhone}
                        </a>
                      ) : (
                        <span className="text-zinc-400">не указан</span>
                      )}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageCircle className="mt-0.5 size-4 shrink-0 text-zinc-400" />
                  <div>
                    <dt className="text-[12px] uppercase tracking-wide text-zinc-500">Тип заказа</dt>
                    <dd className="mt-0.5">
                      <OrderTypeBadge type={order.type} size="md" />
                    </dd>
                  </div>
                </div>
              </dl>
              {order.comment && (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
                  <div className="text-[12px] font-medium uppercase tracking-wide text-amber-700">Комментарий</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950">{order.comment}</p>
                </div>
              )}
            </Card>

            <Card title="Хронология">
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-zinc-300" />
                  <div>
                    <div className="text-zinc-900">Заказ создан</div>
                    <div className="text-[12.5px] text-zinc-500">{formatDateTime(order.createdAt)}</div>
                  </div>
                </li>
                {order.updatedAt !== order.createdAt && (
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-zinc-900" />
                    <div>
                      <div className="flex items-center gap-2 text-zinc-900">
                        Статус изменён <OrderStatusBadge status={order.status} />
                      </div>
                      <div className="text-[12.5px] text-zinc-500">{formatDateTime(order.updatedAt)}</div>
                    </div>
                  </li>
                )}
              </ol>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <Badge tone="neutral">{ORDER_TYPE_LABELS[order.type]}</Badge>
                <Badge tone="neutral">{formatMoney(order.totalMinor)}</Badge>
              </div>
            </Card>

            <Card title="Опасная зона" className="border-red-200">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-zinc-600">Удаление заказа необратимо. Обычно достаточно отменить заказ.</p>
                <Button variant="danger" icon={<Trash2 />} onClick={() => setDeleteOpen(true)} className="self-start">
                  Удалить заказ
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        tone="danger"
        title={`Удалить заказ №${order?.number ?? ''}?`}
        description="Заказ будет удалён без возможности восстановления."
        confirmLabel="Удалить"
        loading={remove.isPending}
        onConfirm={() => {
          if (!id) return;
          remove.mutate(id, { onSuccess: () => navigate('/orders', { replace: true }) });
        }}
      />
    </>
  );
}
