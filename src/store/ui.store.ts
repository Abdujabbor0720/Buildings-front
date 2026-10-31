import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarCollapsed: boolean;
  /** Mobil qurilmada yon menyu ochiqmi (saqlanmaydi). */
  mobileNavOpen: boolean;

  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
}

/** `<html>` ga klass qo‘yish — Tailwind `dark:` varianti shunga tayanadi. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.style.colorScheme = theme;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      mobileNavOpen: false,

      toggleTheme() {
        const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        set({ theme: next });
      },

      setTheme(theme) {
        applyTheme(theme);
        set({ theme });
      },

      toggleSidebar() {
        set({ sidebarCollapsed: !get().sidebarCollapsed });
      },

      setMobileNav(open) {
        set({ mobileNavOpen: open });
      },
    }),
    {
      name: 'qnt.ui',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
      // Sahifa yangilanganda saqlangan mavzu DARHOL qo‘llanadi, aks holda
      // oq fon bir lahza "chaqnab" ketadi.
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
