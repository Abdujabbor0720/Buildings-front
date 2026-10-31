import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiEnvelope, ApiError, AuthTokens } from './types';

/**
 * API MIJOZI.
 *
 * Uchta mas’uliyat:
 *   1. Har so‘rovga `Authorization` sarlavhasini qo‘shish;
 *   2. 401 holatida tokenni BIR MARTA yangilab, so‘rovni qaytarish;
 *   3. Server konvertini (`{ success, data, meta }`) ochib berish.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? '').trim() || '/api/v1';
const STORAGE_KEY = 'qnt.auth';

interface StoredAuth {
  state?: { tokens?: AuthTokens | null };
}

/* ───────────────────────── Token ombori ───────────────────────── */

/**
 * ⚠️ Tokenlar `localStorage` da — zustand `persist` bilan AYNI kalitda.
 * Mijoz store'ga to‘g‘ridan-to‘g‘ri murojaat qilmaydi: aylanma bog‘liqlik
 * paydo bo‘lardi (store → client → store).
 */
export const tokenStore = {
  read(): AuthTokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return (JSON.parse(raw) as StoredAuth).state?.tokens ?? null;
    } catch {
      return null;
    }
  },
  write(tokens: AuthTokens | null): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as StoredAuth) : { state: {} };
      parsed.state = { ...parsed.state, tokens };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      /* xotira to‘lgan yoki privat rejim — sessiya shunchaki saqlanmaydi */
    }
  },
};

/** Sessiya tugaganda ilova qayta login'ga yo‘naltirishi uchun. */
type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler = () => undefined;
export const setSessionExpiredHandler = (handler: SessionExpiredHandler): void => {
  onSessionExpired = handler;
};

/* ───────────────────────── Instansiya ───────────────────────── */

export const http: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  /*
   * ⚠️ `FormData` uchun `Content-Type` O‘CHIRILADI.
   * Mijozda standart sarlavha `application/json` turibdi; u FormData
   * ustiga qolsa, brauzer `multipart/form-data; boundary=…` ni yoza
   * olmaydi va server so‘rovni umuman ajrata olmay 400 qaytaradi.
   * Bu yerda — chunki yuklov yo‘li bittadan ko‘p bo‘lishi mumkin va
   * har birida eslab qolish shart bo‘lmasligi kerak.
   */
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }

  const tokens = tokenStore.read();
  if (tokens?.accessToken) config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  return config;
});

/**
 * ⚠️ Yangilash BIR MARTA bajariladi.
 * Sahifa ochilganda 8 ta so‘rov bir vaqtda 401 olsa, 8 ta yangilash
 * yuborilardi — ularning 7 tasi rotatsiya tufayli bekor qilingan token
 * bilan ketib, foydalanuvchini tizimdan chiqarib yuborardi.
 */
let refreshPromise: Promise<AuthTokens | null> | null = null;

async function refreshTokens(): Promise<AuthTokens | null> {
  const current = tokenStore.read();
  if (!current?.refreshToken) return null;

  try {
    // Alohida `axios` — interceptor zanjiriga tushmasligi uchun.
    const { data } = await axios.post<ApiEnvelope<{ tokens: AuthTokens }>>(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: current.refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 },
    );
    tokenStore.write(data.data.tokens);
    return data.data.tokens;
  } catch {
    tokenStore.write(null);
    return null;
  }
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;

    const isAuthCall = original?.url?.includes('/auth/login') || original?.url?.includes('/auth/refresh');

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshPromise ??= refreshTokens().finally(() => {
        refreshPromise = null;
      });

      const tokens = await refreshPromise;
      if (tokens) {
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return http(original);
      }
      onSessionExpired();
    }

    return Promise.reject(error);
  },
);

/* ───────────────────────── Yordamchilar ───────────────────────── */

/** Serverning o‘zbekcha xato xabarini chiqaradi. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.code === 'ECONNABORTED') return 'So‘rov vaqti tugadi. Internetni tekshiring.';
    if (!error.response) return 'Serverga ulanib bo‘lmadi. Internetni tekshiring.';
    return error.response.data?.error?.message ?? `Xatolik yuz berdi (${error.response.status})`;
  }
  if (error instanceof Error) return error.message;
  return 'Noma’lum xatolik yuz berdi';
}

/** Konvertni ochadi: `{ success, data }` → `data`. */
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<ApiEnvelope<T>>(url, config);
  return data.data;
}

/** Sahifalangan javob: `data` + `meta` birga qaytadi. */
export async function apiGetPaginated<T>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<{ items: T[]; meta: ApiEnvelope<T[]>['meta'] }> {
  const { data } = await http.get<ApiEnvelope<T[]>>(url, config);
  return { items: data.data, meta: data.meta };
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.post<ApiEnvelope<T>>(url, body, config);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.patch<ApiEnvelope<T>>(url, body);
  return data.data;
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await http.put<ApiEnvelope<T>>(url, body);
  return data.data;
}

export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await http.delete<ApiEnvelope<T>>(url);
  return data.data;
}

/** Faylni yuklab olish (Excel eksporti). Konvertga o‘ralmaydi. */
/**
 * Fayl(lar)ni yuklash.
 *
 * ⚠️ `Content-Type` QO‘LDA QO‘YILMAYDI. `FormData` uchun brauzer uni
 * `boundary` bilan birga o‘zi yozadi; qo‘lda yozilsa `boundary` tushib
 * qolib, server so‘rovni umuman o‘qiy olmaydi.
 *
 * ⚠️ `onProgress` — 100 MB lik videoda majburiy: progressiz foydalanuvchi
 * ilova qotib qolgan deb o‘ylab, sahifani yangilaydi.
 */
export async function apiUpload<T>(
  url: string,
  files: File[],
  options: { field?: string; subdir?: string; onProgress?: (percent: number) => void } = {},
): Promise<T> {
  const form = new FormData();
  const field = options.field ?? (files.length > 1 ? 'files' : 'file');
  for (const file of files) form.append(field, file);

  const { data } = await http.post<ApiEnvelope<T>>(url, form, {
    params: options.subdir ? { subdir: options.subdir } : undefined,
    // Katta fayl sekin tarmoqda uzoq ketadi — standart timeout yetmaydi.
    timeout: 10 * 60 * 1000,
    onUploadProgress: (event) => {
      if (!options.onProgress || !event.total) return;
      options.onProgress(Math.round((event.loaded / event.total) * 100));
    },
  });

  return data.data;
}

export async function apiDownload(url: string, fallbackName: string): Promise<void> {
  const response = await http.get<Blob>(url, { responseType: 'blob' });

  // Fayl nomi serverdan keladi — `Content-Disposition` sarlavhasidan.
  const disposition = response.headers['content-disposition'] as string | undefined;
  const match = disposition?.match(/filename="?([^";]+)"?/);
  const fileName = match?.[1] ?? fallbackName;

  const href = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // ⚠️ `revokeObjectURL` majburiy: busiz blob xotirada qolib ketadi va
  // bir necha eksportdan keyin sahifa sezilarli og‘irlashadi.
  URL.revokeObjectURL(href);
}

/** Server bergan nisbiy fayl yo‘lini to‘liq URL'ga aylantiradi. */
export function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
}
