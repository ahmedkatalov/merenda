import type {
  ApiError,
  CreateOrderRequest,
  CreateOrderResponse,
  PublicMenuResponse,
  SiteBootstrap,
  SiteStatus,
} from '@merenda/shared';

const rawBase: unknown = import.meta.env.VITE_API_URL;
export const API_BASE: string = typeof rawBase === 'string' ? rawBase.replace(/\/+$/, '') : '';

export class ApiRequestError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== 'object' || value === null) return false;
  const err = (value as { error?: unknown }).error;
  return typeof err === 'object' && err !== null && typeof (err as { message?: unknown }).message === 'string';
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    });
  } catch {
    throw new ApiRequestError(0, 'network', 'Нет соединения с сервером');
  }
  if (res.status === 204) return undefined as T;
  let payload: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }
  if (!res.ok) {
    if (isApiError(payload)) {
      throw new ApiRequestError(res.status, payload.error.code, payload.error.message, payload.error.fields ?? {});
    }
    throw new ApiRequestError(res.status, 'http_error', `Ошибка сервера (${res.status})`);
  }
  return payload as T;
}

export const api = {
  site: (signal?: AbortSignal) => request<SiteBootstrap>('/api/v1/site', { signal }),
  menu: (signal?: AbortSignal) => request<PublicMenuResponse>('/api/v1/menu', { signal }),
  status: (signal?: AbortSignal) => request<SiteStatus>('/api/v1/status', { signal }),
  createOrder: (body: CreateOrderRequest) =>
    request<CreateOrderResponse>('/api/v1/orders', { method: 'POST', body: JSON.stringify(body) }),
};

/** Prefixes root-relative media paths (/uploads/…) with the API base. */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}
