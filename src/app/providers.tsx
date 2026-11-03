import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { setSessionExpiredHandler } from '@/shared/api/client';
import { useAuthStore } from '@/store/auth.store';
import { queryClient } from './query-client';

export function AppProviders({ children }: { children: ReactNode }) {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    // Token yangilash ham muvaffaqiyatsiz bo‘lsa — sessiya tugadi.
    // Mijoz store'ni bilmaydi, shuning uchun ishlov beruvchi shu yerda
    // ro‘yxatdan o‘tkaziladi (aylanma bog‘liqlikning oldi olinadi).
    setSessionExpiredHandler(() => {
      clearSession();
      queryClient.clear();
    });
    void bootstrap();
  }, [bootstrap, clearSession]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        // ⚠️ 72px — sarlavha balandligi. Busiz toast qo‘ng‘iroq va
        // profil menyusini to‘sib qo‘yadi.
        containerStyle={{ top: 74, right: 18 }}
        gutter={10}
        toastOptions={{
          duration: 4000,
          className:
            '!rounded-xl !border !border-subtle !bg-[var(--surface)] !text-strong !text-sm !shadow-[var(--shadow-pop)]',
          // ⚠️ Toast kutubxonasi CSS o‘zgaruvchisini qabul qilmaydi —
          // HEX majburiy. Qiymatlar `health.ts` dagi `ok`/`danger`
          // 500-pog‘onasi bilan AYNI bo‘lishi kerak; u yerda o‘zgarsa,
          // bu yer ham qo‘lda yangilanadi.
          success: { iconTheme: { primary: '#0A924B', secondary: '#fff' } },
          error: { duration: 6000, iconTheme: { primary: '#AC1730', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
