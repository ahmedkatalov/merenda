import type { ApiError, LoginResponse } from '@merenda/shared';
import { API_URL } from './env';
import { ERROR_MESSAGES } from './i18n';
import { useAuthStore } from '@/features/auth/store';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string> | undefined;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function isApiError(e: unknown): e is ApiRequestError {
  return e instanceof ApiRequestError;
}

/** Human readable Russian message for any thrown error. */
export function errorMessage(e: unknown, fallback = 'Что-то пошло не так'): string {
  if (isApiError(e)) {
    if (e.code === 'validation_error' && e.fields) {
      const first = Object.values(e.fields)[0];
      if (first) return first;
    }
    if (e.message && e.code !== 'internal') return e.message;
    return ERROR_MESSAGES[e.code] ?? e.message ?? fallback;
  }
  if (e instanceof TypeError) return ERROR_MESSAGES.network;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}

async function toError(res: Response): Promise<ApiRequestError> {
  let payload: ApiError | null = null;
  try {
    payload = (await res.json()) as ApiError;
  } catch {
    payload = null;
  }
  const code = payload?.error?.code ?? (res.status === 429 ? 'rate_limited' : res.status >= 500 ? 'internal' : 'error');
  const message = payload?.error?.message || ERROR_MESSAGES[code] || `Ошибка ${res.status}`;
  return new ApiRequestError(res.status, code, message, payload?.error?.fields);
}

/* ------------------------------------------------------------------ */
/* Session refresh (single-flight)                                     */
/* ------------------------------------------------------------------ */

let refreshInFlight: Promise<LoginResponse | null> | null = null;

async function doRefresh(): Promise<LoginResponse | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/admin/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      useAuthStore.getState().clearSession();
      return null;
    }
    const data = (await res.json()) as LoginResponse;
    useAuthStore.getState().setSession(data);
    return data;
  } catch {
    return null;
  }
}

export function refreshSession(): Promise<LoginResponse | null> {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/* ------------------------------------------------------------------ */
/* Request                                                             */
/* ------------------------------------------------------------------ */

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: Method;
  body?: unknown;
  formData?: FormData;
  /** Attach Bearer token and refresh on 401 (default true). */
  auth?: boolean;
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | null | undefined>;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${API_URL}/api/v1${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, auth = true, signal, query } = opts;
  const url = buildUrl(path, query);

  const doFetch = (token: string | null) => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined && !formData) headers['Content-Type'] = 'application/json';
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    return fetch(url, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      credentials: 'include',
      signal,
    });
  };

  let res = await doFetch(useAuthStore.getState().accessToken);

  if (res.status === 401 && auth) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      useAuthStore.getState().clearSession();
      throw new ApiRequestError(401, 'unauthorized', ERROR_MESSAGES.unauthorized);
    }
    res = await doFetch(refreshed.accessToken);
    if (res.status === 401) {
      useAuthStore.getState().clearSession();
      throw new ApiRequestError(401, 'unauthorized', ERROR_MESSAGES.unauthorized);
    }
  }

  if (!res.ok) throw await toError(res);
  if (res.status === 204 || res.headers.get('content-length') === '0') return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Shorthands for `/api/v1/admin/...` */
export const admin = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(`/admin${path}`, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(`/admin${path}`, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(`/admin${path}`, { method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown) => request<T>(`/admin${path}`, { method: 'PUT', body }),
  delete: <T = void>(path: string) => request<T>(`/admin${path}`, { method: 'DELETE' }),
};

/** Public endpoints (`/api/v1/...`), no auth. */
export const pub = {
  get: <T>(path: string) => request<T>(path, { method: 'GET', auth: false }),
};

/* ------------------------------------------------------------------ */
/* Upload with progress (XHR)                                          */
/* ------------------------------------------------------------------ */

export function uploadWithProgress<T>(
  path: string,
  formData: FormData,
  onProgress?: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<T> {
  const attempt = (token: string | null) =>
    new Promise<{ status: number; text: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_URL}/api/v1/admin${path}`);
      xhr.withCredentials = true;
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && onProgress) onProgress(ev.loaded / ev.total);
      };
      xhr.onload = () => resolve({ status: xhr.status, text: xhr.responseText });
      xhr.onerror = () => reject(new TypeError('network'));
      xhr.onabort = () => reject(new DOMException('Aborted', 'AbortError'));
      if (signal) signal.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.send(formData);
    });

  const parse = (r: { status: number; text: string }): T => {
    if (r.status >= 200 && r.status < 300) return (r.text ? JSON.parse(r.text) : undefined) as T;
    let payload: ApiError | null = null;
    try {
      payload = JSON.parse(r.text) as ApiError;
    } catch {
      payload = null;
    }
    const code = payload?.error?.code ?? (r.status === 413 ? 'payload_too_large' : r.status === 415 ? 'unsupported_media' : 'error');
    throw new ApiRequestError(r.status, code, payload?.error?.message || ERROR_MESSAGES[code] || `Ошибка ${r.status}`, payload?.error?.fields);
  };

  return attempt(useAuthStore.getState().accessToken).then(async (r) => {
    if (r.status === 401) {
      const refreshed = await refreshSession();
      if (!refreshed) throw new ApiRequestError(401, 'unauthorized', ERROR_MESSAGES.unauthorized);
      return parse(await attempt(refreshed.accessToken));
    }
    return parse(r);
  });
}
