import type { ReactNode } from 'react';
import { Headset, PanelLeftClose, PanelLeftOpen, Send, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/shared/constants/nav';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';

interface SidebarProps {
  /** Mobil rejimda ko‘chma panel sifatida ishlaydi. */
  mobile?: boolean;
}

/**
 * Yon menyu — TO‘Q DENGIZ KO‘KI.
 *
 * Panel ranglari `index.css` dagi `--rail-*` to‘plamidan keladi, oddiy
 * `--ink-*` dan EMAS: panel to‘q, sahifa yorug‘ — bitta matn rangi
 * to‘plami ikkalasiga yaramaydi. Qorong‘i rejimga o‘tganda sahifa
 * o‘zgaradi, panel esa deyarli o‘zgarmaydi; shu sababli ular ajratilgan.
 *
 * Faol band — TO‘LDIRILGAN ko‘k to‘rtburchak + oq matn. To‘q fonda
 * nozik ko‘rsatkich chizig‘i (yorug‘ paneldagi yechim) ko‘rinmay
 * qolardi, shuning uchun bu yerda butun band bo‘yaladi.
 */
export function Sidebar({ mobile = false }: SidebarProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed) && !mobile;
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const setMobileNav = useUiStore((state) => state.setMobileNav);
  const can = useAuthStore((state) => state.can);
  const user = useAuthStore((state) => state.user);

  // Ruxsati yo‘q bo‘lim umuman ko‘rsatilmaydi.
  const items = NAV_ITEMS.filter((item) => !item.permission || can(item.permission) || !user);

  return (
    <aside
      className={cn(
        'rail flex h-full flex-col transition-[width] duration-200',
        collapsed ? 'w-[72px]' : 'w-[228px]',
      )}
    >
      {/* ───── Logotip ───── */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 px-4 pt-4 pb-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <BuildingMark />
        {!collapsed ? (
          <div className="min-w-0 flex-1">
            <p className="rail-ink truncate text-ui leading-[1.2] font-semibold tracking-[-0.015em]">
              Andijon viloyati
              <br />
              hokimligi
            </p>
            <p className="rail-ink-muted truncate text-nano leading-[1.35]">
              Qurilish obyektlari
              <br />
              nazorati tizimi
            </p>
          </div>
        ) : null}

        {mobile ? (
          <button
            type="button"
            onClick={() => setMobileNav(false)}
            aria-label="Menyuni yopish"
            className="rail-ink-muted grid size-8 place-items-center rounded-lg transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {/* ───── Menyu ───── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Asosiy menyu">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={() => mobile && setMobileNav(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn('rail-item', collapsed && 'justify-center px-0', isActive && 'rail-item-active')
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.1 : 1.7} />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ───── Yordam markazi ───── */}
      <div className="px-3 pb-2">
        {collapsed ? (
          <a
            href="tel:1148"
            title="Yordam markazi · 1148"
            className="rail-ink-muted grid h-10 place-items-center rounded-lg bg-white/8 transition-colors hover:bg-white/14 hover:text-white"
          >
            <Headset className="size-[18px]" />
          </a>
        ) : (
          <a
            href="tel:1148"
            className="flex items-center gap-2.5 rounded-xl bg-brand-500 px-3 py-2.5 transition-colors hover:bg-brand-600"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-white">
              <Headset className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-nano text-white/75">Yordam markazi · 24/7</span>
              <span className="num block text-lede leading-tight text-white">1148</span>
            </span>
          </a>
        )}
      </div>

      {/* ───── Mobil ilova ───── */}
      {!collapsed ? (
        <div className="px-4 pt-1 pb-3">
          <p className="rail-ink-muted mb-2 text-nano">Mobil ilovani yuklab oling</p>
          <div className="flex items-center gap-1.5">
            <StoreLink href="https://t.me/shaffofqurilish_bot" label="Telegram">
              <Send className="size-[15px]" />
            </StoreLink>
            <StoreLink href="https://apps.apple.com/" label="App Store">
              <AppleMark />
            </StoreLink>
            <StoreLink href="https://play.google.com/" label="Google Play">
              <PlayMark />
            </StoreLink>
          </div>
        </div>
      ) : null}

      {/* ───── Yig‘ish tugmasi (faqat desktop) ───── */}
      {!mobile ? (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Menyuni yoyish' : 'Menyuni yig‘ish'}
          className="rail-ink-muted rail-line flex items-center justify-center gap-2 border-t py-2.5 text-micro font-medium transition-colors hover:bg-white/8 hover:text-white"
        >
          {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed ? 'Yig‘ish' : null}
        </button>
      ) : null}
    </aside>
  );
}

function StoreLink({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={label}
      aria-label={label}
      className="rail-ink-muted grid size-8 place-items-center rounded-lg bg-white/8 transition-colors hover:bg-white/16 hover:text-white"
    >
      {children}
    </a>
  );
}

/** Brend belgisi — to‘q sariq kvadrat + oq bino silueti.
 *  ⚠️ To‘q sariq — panelda YAGONA iliq rang. U logotipni ko‘k menyudan
 *  ajratib turadi; boshqa joyda ishlatilsa, bu vazifani yo‘qotadi. */
function BuildingMark() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-warn-500 shadow-[0_2px_6px_rgb(226_112_28/0.4)]">
      <svg viewBox="0 0 24 24" className="size-[20px]" fill="none" aria-hidden>
        <path d="M3.5 21V8.6l6.2-3.6 6.2 3.6V21H3.5Z" fill="#fff" fillOpacity="0.95" />
        <path d="M16.2 21v-8.1l4.3-2.5v10.6h-4.3Z" fill="#fff" fillOpacity="0.6" />
        <g fill="#C25A13">
          <rect x="5.9" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="5.9" y="14.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="14.6" width="2.1" height="2.1" rx="0.4" />
        </g>
      </svg>
    </span>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor" aria-hidden>
      <path d="M16.37 12.78c.03 2.9 2.55 3.87 2.58 3.88-.02.07-.4 1.38-1.33 2.73-.8 1.17-1.64 2.33-2.96 2.35-1.3.03-1.71-.77-3.2-.77-1.48 0-1.94.75-3.17.8-1.27.05-2.24-1.26-3.05-2.42-1.65-2.4-2.91-6.77-1.22-9.72.84-1.47 2.35-2.4 3.98-2.42 1.25-.03 2.43.84 3.2.84.76 0 2.2-1.04 3.7-.89.63.03 2.4.26 3.54 1.92-.09.06-2.11 1.24-2.09 3.7M14.1 4.3c.68-.82 1.14-1.96 1.01-3.1-.98.04-2.16.65-2.86 1.47-.63.72-1.18 1.88-1.03 2.99 1.09.08 2.2-.55 2.88-1.36" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="currentColor" aria-hidden>
      <path d="M3.6 1.84a1.5 1.5 0 0 0-.6 1.2v17.92a1.5 1.5 0 0 0 .6 1.2l.1.06L13.8 12.1v-.22L3.7 1.78l-.1.06ZM17.2 15.5l-3.4-3.4v-.22l3.4-3.4.08.05 4.03 2.29c1.15.65 1.15 1.72 0 2.38l-4.03 2.29-.08.01ZM17.28 15.49 13.8 12 3.6 22.2c.38.4 1 .45 1.71.05l11.97-6.76M17.28 8.51 5.31 1.75c-.7-.4-1.33-.35-1.71.05L13.8 12l3.48-3.49Z" />
    </svg>
  );
}
