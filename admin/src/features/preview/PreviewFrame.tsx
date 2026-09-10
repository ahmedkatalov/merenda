import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet, TriangleAlert } from 'lucide-react';
import type { PreviewMessage } from '@merenda/shared';
import { PREVIEW_URL, SITE_ORIGIN, SITE_URL } from '@/lib/env';
import { cn } from '@/lib/utils';
import { Button, IconButton, SegmentedControl, Spinner } from '@/components/ui';

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<PreviewDevice, number | null> = { desktop: null, tablet: 820, mobile: 390 };

export interface PreviewFrameHandle {
  /** Post a message to the site iframe; remembered per type and re-sent when the iframe (re)loads. */
  post: (msg: PreviewMessage) => void;
  reload: () => void;
}

export interface PreviewFrameProps {
  className?: string;
  /** Extra toolbar content (left side). */
  toolbarExtra?: React.ReactNode;
}

const READY_TIMEOUT_MS = 8000;

/**
 * Live preview of the client site (`${VITE_SITE_URL}/?preview=1`) with a device switcher.
 * Messages posted through the ref are cached per `type` and replayed on `merenda:preview:ready`.
 */
export const PreviewFrame = forwardRef<PreviewFrameHandle, PreviewFrameProps>(function PreviewFrame({ className, toolbarExtra }, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastByType = useRef(new Map<PreviewMessage['type'], PreviewMessage>());
  const [device, setDevice] = useState<PreviewDevice>('desktop');
  const [nonce, setNonce] = useState(0);
  const [ready, setReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const send = useCallback((msg: PreviewMessage) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    try {
      win.postMessage(msg, SITE_ORIGIN);
    } catch {
      /* iframe not reachable */
    }
  }, []);

  const replay = useCallback(() => {
    for (const msg of lastByType.current.values()) send(msg);
  }, [send]);

  useImperativeHandle(
    ref,
    () => ({
      post: (msg) => {
        if (msg.type !== 'merenda:preview:scroll') lastByType.current.set(msg.type, msg);
        send(msg);
      },
      reload: () => {
        setReady(false);
        setTimedOut(false);
        setNonce((n) => n + 1);
      },
    }),
    [send],
  );

  useEffect(() => {
    const onMessage = (e: MessageEvent<unknown>) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as { type?: unknown } | null;
      if (data && data.type === 'merenda:preview:ready') {
        setReady(true);
        setTimedOut(false);
        replay();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [replay]);

  useEffect(() => {
    if (ready) return;
    const t = setTimeout(() => setTimedOut(true), READY_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [ready, nonce]);

  const width = DEVICE_WIDTH[device];

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col bg-zinc-100', className)}>
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-white px-3">
        <div className="flex min-w-0 items-center gap-2">
          {toolbarExtra}
          <SegmentedControl<PreviewDevice>
            aria-label="Устройство"
            size="sm"
            value={device}
            onChange={setDevice}
            options={[
              { value: 'desktop', label: <span className="hidden lg:inline">Компьютер</span>, icon: <Monitor />, title: 'Компьютер' },
              { value: 'tablet', label: <span className="hidden lg:inline">Планшет</span>, icon: <Tablet />, title: 'Планшет · 820px' },
              { value: 'mobile', label: <span className="hidden lg:inline">Телефон</span>, icon: <Smartphone />, title: 'Телефон · 390px' },
            ]}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className={cn('mr-1 hidden items-center gap-1.5 text-[12px] sm:inline-flex', ready ? 'text-emerald-700' : 'text-zinc-400')}>
            <span className={cn('size-1.5 rounded-full', ready ? 'bg-emerald-500' : 'bg-zinc-300')} />
            {ready ? 'Подключено' : 'Ожидание сайта…'}
          </span>
          <IconButton
            label="Перезагрузить предпросмотр"
            size="sm"
            onClick={() => {
              setReady(false);
              setTimedOut(false);
              setNonce((n) => n + 1);
            }}
          >
            <RefreshCw />
          </IconButton>
          <a href={SITE_URL} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-zinc-700 hover:bg-zinc-100 focus-ring">
            <span className="hidden sm:inline">Открыть сайт</span>
            <ExternalLink className="size-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto scrollbar-thin [background-image:radial-gradient(rgb(0_0_0/0.06)_1px,transparent_1px)] [background-size:16px_16px]">
        <div className={cn('flex min-h-full justify-center', width ? 'p-4 sm:p-6' : 'p-0')}>
          <div
            className={cn(
              'relative flex min-h-0 flex-1 flex-col bg-white transition-[max-width] duration-300',
              width && 'max-w-full overflow-hidden rounded-[28px] border-[10px] border-zinc-900 shadow-pop',
              width && device === 'mobile' && 'h-[min(844px,calc(100%-0px))]',
              width && device === 'tablet' && 'h-[min(1080px,calc(100%-0px))]',
            )}
            style={width ? { width: width + 20 } : undefined}
          >
            {!ready && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-[1px]" aria-live="polite">
                {timedOut ? (
                  <div className="pointer-events-auto mx-6 max-w-sm rounded-xl border border-amber-200 bg-amber-50 p-4 text-center shadow-soft">
                    <TriangleAlert className="mx-auto size-5 text-amber-600" />
                    <div className="mt-2 text-sm font-semibold text-zinc-900">Сайт не отвечает</div>
                    <p className="mt-1 text-[12.5px] text-zinc-600">
                      Убедитесь, что клиентский сайт запущен по адресу <span className="font-mono">{SITE_URL}</span>. Изменения всё равно можно сохранить.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="mt-3"
                      icon={<RefreshCw />}
                      onClick={() => {
                        setTimedOut(false);
                        setNonce((n) => n + 1);
                      }}
                    >
                      Попробовать снова
                    </Button>
                  </div>
                ) : (
                  <>
                    <Spinner size={22} className="text-zinc-400" />
                    <span className="text-[12.5px] text-zinc-500">Загружаем предпросмотр…</span>
                  </>
                )}
              </div>
            )}
            <iframe
              key={nonce}
              ref={iframeRef}
              src={PREVIEW_URL}
              title="Предпросмотр сайта"
              className="size-full min-h-[480px] flex-1 border-0 bg-white"
              onLoad={() => replay()}
              allow="clipboard-write"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
