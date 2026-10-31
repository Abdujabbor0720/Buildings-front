import { QueryClient } from '@tanstack/react-query';
import axios from 'axios';

/**
 * ⚠️ 401/403/404 da QAYTA URINILMAYDI.
 * Standart `retry: 3` bu holatlarda foydasiz: ruxsat yo‘qligi uch marta
 * so‘rashdan paydo bo‘lmaydi, lekin foydalanuvchi xato xabarini
 * uch barobar kechroq ko‘radi.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status ?? 0;
          if (status === 401 || status === 403 || status === 404 || status === 422) return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    },
    mutations: { retry: false },
  },
});
