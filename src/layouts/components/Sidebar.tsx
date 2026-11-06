import type { ReactNode } from 'react';
import { Headset, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from '@/shared/constants/nav';
import { BrandMark } from '@/shared/ui';
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
        collapsed ? 'w-[72px]' : 'w-[196px]',
      )}
    >
      {/* ───── Logotip ───── */}
      <div
        className={cn(
          'flex shrink-0 items-center gap-2.5 px-4 pt-4 pb-3',
          collapsed && 'justify-center px-2',
        )}
      >
        <BrandMark size={36} />
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
                    <item.icon className="size-[17px] shrink-0" strokeWidth={isActive ? 2.1 : 1.7} />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/*
        ───── Yordam markazi ─────

        ⚠️ Bu blok HAVOLA EMAS va `tel:` manzili YO'Q. Ilgari u
        «1148» raqamiga qo'ng'iroq qilardi; raqam olib tashlangach,
        ko'rinmaydigan manzilga olib boradigan havola qolardi —
        bosgan odam nima bo'lganini tushunmasdi. Manzil aniq bo'lsa
        (raqam yoki qo'llab-quvvatlash kanali), shu blok qaytadan
        `a` ga aylantiriladi.
      */}
      <div className="px-3 pb-2">
        {collapsed ? (
          <div
            title="Yordam markazi · 24/7"
            className="rail-ink-muted grid h-10 place-items-center rounded-lg bg-white/8"
          >
            <Headset className="size-[18px]" />
          </div>
        ) : (
          <div
            /* ⚠️ Asosiy tugma va faol tab bilan AYNI shakl (gradient +
               o'z rangidagi soya). To'q panel ustida yassi ko'k
               to'rtburchak «yopishtirilgan» bo'lib ko'rinardi. */
            className="flex items-center gap-2.5 rounded-xl bg-linear-to-b from-brand-400 to-brand-600 px-3 py-2.5 shadow-[0_2px_6px_rgb(0_18_56/0.4),0_8px_18px_-8px_rgb(10_108_240/0.6)]"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20 text-white">
              <Headset className="size-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-ui leading-tight font-semibold text-white">
                Yordam markazi
              </span>
              {/* ⚠️ Izoh BITTA qatorga sig'ishi kerak. Panel 196px va
                  ikonka 36px ni olgach, matnga ~100px qoladi:
                  «Kuniga 24 soat, haftada 7 kun» ikkiga bo'linib,
                  kartani bir qator balandlashtirib yuborardi. */}
              <span className="block text-nano text-white/75">24/7 ishlaydi</span>
            </span>
          </div>
        )}
      </div>

      {/* ───── Mobil ilova ───── */}
      {!collapsed ? (
        <div className="px-4 pt-1 pb-3">
          <p className="rail-ink-muted mb-2 text-nano">Mobil ilovani yuklab oling</p>
          {/*
            ⚠️ Belgilar — HAQIQIY brend markalari, lucide'ning umumiy
            ikonkalari emas. Ilgari Telegram o'rnida oddiy «qog'oz
            samolyot» (`Send`) turardi: u Telegram logotipi EMAS va
            yonidagi ikkita haqiqiy marka (Apple, Google Play) bilan
            bir qatorda turganda farq darhol bilinardi.

            ⚠️ Ranglar ham brendniki: Telegram — o'z ko'ki, Google
            Play — to'rt rangli uchburchak, Apple — oq (to'q fonda
            Apple qoidasi aynan shunday). Shuning uchun plitka foni
            neytral (`bg-white/8`) qoldi: rang BELGIDA, plitkada emas —
            aks holda uchta har xil rangli kvadrat yonma-yon turib,
            panelning pastki qismi chalkash bo'lib ketardi.
          */}
          <div className="flex items-center gap-1.5">
            <StoreLink href="https://t.me/shaffofqurilish_bot" label="Telegram">
              <TelegramMark />
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

/**
 * TELEGRAM — rasmiy marka: ko'k doira + oq samolyot.
 *
 * ⚠️ Samolyot doiradan ALOHIDA shakl sifatida chiziladi. Tayyor
 * «doira + o'yilgan samolyot» yo'li (bitta `path`) to'q panel ustida
 * ishlamaydi: o'yilgan joydan fon ko'rinib, samolyot oq emas, QORA
 * bo'lib chiqardi.
 */
function TelegramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[17px]" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#229ED9" />
      <path
        fill="#fff"
        transform="translate(12 12) scale(0.82) translate(-12 -12)"
        d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"
      />
    </svg>
  );
}

/** APPLE — rasmiy silueti. To'q fonda OQ (brend qoidasi). */
function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-[15px]" fill="#ffffff" aria-hidden>
      <path d="M16.37 12.78c.03 2.9 2.55 3.87 2.58 3.88-.02.07-.4 1.38-1.33 2.73-.8 1.17-1.64 2.33-2.96 2.35-1.3.03-1.71-.77-3.2-.77-1.48 0-1.94.75-3.17.8-1.27.05-2.24-1.26-3.05-2.42-1.65-2.4-2.91-6.77-1.22-9.72.84-1.47 2.35-2.4 3.98-2.42 1.25-.03 2.43.84 3.2.84.76 0 2.2-1.04 3.7-.89.63.03 2.4.26 3.54 1.92-.09.06-2.11 1.24-2.09 3.7M14.1 4.3c.68-.82 1.14-1.96 1.01-3.1-.98.04-2.16.65-2.86 1.47-.63.72-1.18 1.88-1.03 2.99 1.09.08 2.2-.55 2.88-1.36" />
    </svg>
  );
}

/**
 * GOOGLE PLAY — rasmiy TO'RT RANGLI uchburchak.
 *
 * ⚠️ Bitta rangdagi variant Google brend qoidalarida yo'q: belgi
 * to'rtta bo'lakdan iborat va har biri o'z rangida. Ilgari bu yerda
 * bitta `currentColor` li yo'l turardi — u Play belgisiga o'xshardi,
 * lekin Play belgisi EMAS edi.
 */
function PlayMark() {
  return (
    <svg viewBox="0 0 512 512" className="size-[15px]" aria-hidden>
      {/* chap tana */}
      <path
        fill="#00A0FF"
        d="M47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0z"
      />
      {/* yuqori qanot */}
      <path fill="#00E676" d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1z" />
      {/* o'ng uchi */}
      <path
        fill="#FFCE00"
        d="m472.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8z"
      />
      {/* pastki qanot */}
      <path fill="#FF3A44" d="M104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  );
}
