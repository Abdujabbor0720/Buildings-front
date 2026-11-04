import { Menu as MenuIcon, Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/store/ui.store';
import { GlobalSearch } from './GlobalSearch';
import { NotificationsBell } from './NotificationsBell';
import { ScopeFilters } from './ScopeFilters';
import { UserMenu } from './UserMenu';

/**
 * Yuqori panel — 56px, SHAFFOF orqa fonli (blur bilan).
 * Kontent ostidan o‘tib ketganda panel «suzib turadi»; qattiq oq fon
 * ekranni ikkiga bo‘lib tashlardi.
 */
export function Header() {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const setMobileNav = useUiStore((state) => state.setMobileNav);

  return (
    /* ⚠️ Pastdagi chegaraga YUMSHOQ soya qo'shilgan: shaffof panel
       ostidan kontent o'tganda faqat 1px chiziq uni ushlab turolmas,
       panel «suzayotgan» emas, «kesilgan» bo'lib ko'rinardi. */
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-subtle surface-blur px-3 shadow-[0_6px_18px_-16px_rgb(16_42_76/0.5)] backdrop-blur-xl sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={() => setMobileNav(true)}
        aria-label="Menyuni ochish"
        className="grid size-9 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong lg:hidden dark:hover:bg-white/8"
      >
        <MenuIcon className="size-[18px]" />
      </button>

      <ScopeFilters />

      {/* ⚠️ Qidiruv tor ekranda YASHIRILADI. 430px da sarlavhada oltita
          element bo‘ladi va qidiruv maydoni bir necha piksel qolib,
          bildirishnoma belgisi ustiga chiqib ketgan edi. Tor ekranda
          kerakli joy — kontekst (viloyat, yil), qidiruv emas. */}
      <div className="hidden min-w-0 flex-1 justify-center px-1 md:flex md:px-2">
        <GlobalSearch />
      </div>
      <span className="flex-1 md:hidden" aria-hidden />

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <NotificationsBell />

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Yorug‘ rejimga o‘tish' : 'Qorong‘i rejimga o‘tish'}
          className="grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
        >
          {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>

        <span className="mx-1.5 hidden h-5 w-px bg-line sm:block" aria-hidden />

        <UserMenu />
      </div>
    </header>
  );
}
