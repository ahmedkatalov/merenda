import { useEffect, useState } from 'react';
import type { StatusSettings } from '@merenda/shared';
import { Button, Dialog, FormField, Textarea } from '@/components/ui';
import { useSetVenueStatus } from '../hooks';

/** Ask for a message and switch the venue to «temporarily closed» (or back). */
export function VenueStatusDialog({ open, onClose, current }: { open: boolean; onClose: () => void; current: StatusSettings | undefined }) {
  const closing = current?.mode !== 'temporarily_closed';
  const [message, setMessage] = useState(current?.message ?? '');
  const mutation = useSetVenueStatus();

  useEffect(() => {
    if (open) setMessage(current?.message || (closing ? 'Сегодня мы закрыты. Ждём вас снова!' : ''));
  }, [open, current?.message, closing]);

  const submit = () => {
    mutation.mutate(closing ? { mode: 'temporarily_closed', message: message.trim() } : { mode: 'auto', message: '' }, { onSuccess: onClose });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={closing ? 'Временно закрыть заведение' : 'Открыть заведение'}
      description={closing ? 'Посетители увидят сообщение, а заказы будут заблокированы до отмены.' : 'Заведение снова будет работать по расписанию.'}
      locked={mutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Отмена
          </Button>
          <Button variant={closing ? 'danger' : 'primary'} loading={mutation.isPending} onClick={submit}>
            {closing ? 'Закрыть заведение' : 'Открыть'}
          </Button>
        </>
      }
    >
      {closing && (
        <FormField label="Сообщение для посетителей" help="Например: «Сегодня закрыто по техническим причинам».">
          {(id) => <Textarea id={id} value={message} onChange={(e) => setMessage(e.target.value)} rows={3} data-autofocus maxLength={300} />}
        </FormField>
      )}
    </Dialog>
  );
}
