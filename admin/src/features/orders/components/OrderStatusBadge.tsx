import { ORDER_STATUS_LABELS, type OrderStatus } from '@merenda/shared';
import { Badge, type BadgeTone } from '@/components/ui';

const tones: Record<OrderStatus, BadgeTone> = { new: 'accent', confirmed: 'info', completed: 'success', cancelled: 'neutral' };

export function OrderStatusBadge({ status, size }: { status: OrderStatus; size?: 'sm' | 'md' }) {
  return (
    <Badge tone={tones[status]} size={size}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
