import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'default';
  loading?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Подтвердить', cancelLabel = 'Отмена', tone = 'default', loading }: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      locked={loading}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => void onConfirm()} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        {tone === 'danger' && (
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <TriangleAlert className="size-5" />
          </div>
        )}
        <div className="min-w-0 pt-1">
          <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
          {description && <div className="mt-1.5 text-sm leading-relaxed text-zinc-600">{description}</div>}
        </div>
      </div>
    </Dialog>
  );
}
