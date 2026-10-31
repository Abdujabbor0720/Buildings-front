import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiGet, apiPost, tokenStore } from '@/shared/api/client';
import type { AuthResponse, AuthTokens, AuthUser } from '@/shared/api/types';

/**
 * SESSIYA HOLATI.
 *
 * ⚠️ `tokens` aynan shu `persist` kalitida saqlanadi va `api/client.ts`
 * uni to‘g‘ridan-to‘g‘ri o‘qiydi. Ikkita ombor bo‘lsa, token yangilangach
 * biri eskirib qolardi.
 */
interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  /** Ilova ochilganda sessiya tekshirilyaptimi. */
  isBootstrapping: boolean;
  isLoggingIn: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
  /** 401 dan keyin — tokenlar yaroqsiz, foydalanuvchini tozalaymiz. */
  clearSession: () => void;
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isBootstrapping: true,
      isLoggingIn: false,

      async login(email, password) {
        set({ isLoggingIn: true });
        try {
          const result = await apiPost<AuthResponse>('/auth/login', { email, password });
          tokenStore.write(result.tokens);
          set({ user: result.user, tokens: result.tokens, isBootstrapping: false });
        } finally {
          set({ isLoggingIn: false });
        }
      },

      async logout() {
        const refreshToken = get().tokens?.refreshToken;
        // Serverga xabar berish MUVAFFAQIYATSIZ bo‘lsa ham mahalliy
        // sessiya tozalanadi: aks holda foydalanuvchi tarmoq uzilganda
        // tizimdan umuman chiqa olmasdi.
        if (refreshToken) {
          try {
            await apiPost('/auth/logout', { refreshToken });
          } catch {
            /* e'tiborsiz */
          }
        }
        get().clearSession();
      },

      clearSession() {
        tokenStore.write(null);
        set({ user: null, tokens: null, isBootstrapping: false });
      },

      async bootstrap() {
        const tokens = tokenStore.read();
        if (!tokens?.accessToken) {
          set({ user: null, tokens: null, isBootstrapping: false });
          return;
        }
        try {
          // ⚠️ Foydalanuvchi SERVERDAN qayta o‘qiladi: roli yoki ruxsatlari
          // o‘zgargan bo‘lishi mumkin, `localStorage` dagi nusxa esa eski.
          const user = await apiGet<AuthUser>('/auth/me');
          set({ user, tokens, isBootstrapping: false });
        } catch {
          get().clearSession();
        }
      },

      can(permission) {
        return get().user?.permissions.includes(permission) ?? false;
      },

      canAny(...permissions) {
        const granted = get().user?.permissions ?? [];
        return permissions.some((p) => granted.includes(p));
      },
    }),
    {
      name: 'qnt.auth',
      // ⚠️ Faqat `tokens` saqlanadi. `user` har ochilishda serverdan
      // olinadi — eskirgan rol bilan ishlashning oldi olinadi.
      partialize: (state) => ({ tokens: state.tokens }),
    },
  ),
);
