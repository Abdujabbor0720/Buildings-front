import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';

export interface DistRow {
  key: string;
  label: string;
  count: number;
  percent: number;
  /** Guruhdagi loyiha qiymati — `showAmount` bilan birga ko‘rinadi. */
  amount?: string;
  /** Belgi va chiziq rangi (HEX) — holat/turkum palitrasidan. */
  color?: string;
  /** HEX o‘rniga Tailwind klassi (bajarilish shkalasi shunday ishlaydi). */
  barClass?: string;
  /** Qator bosilganda — jadvalni shu guruh bo‘yicha filtrlaydi. */
  onClick?: () => void;
  /** Hozir tanlangan qator — filtr yoqilganini ko‘rsatadi. */
  active?: boolean;
}

interface Props {
  rows: DistRow[];
  /**
   * Chiziq va asosiy raqam NIMANI o‘lchaydi.
   *
   * ⚠️ `amount` rejimida foiz KO‘RSATILMAYDI. Serverdan kelgan foiz
   * SONGA nisbatan hisoblangan; uni summa uzunligidagi chiziq yoniga
   * qo‘yish «40% — 2.1 trln» degan yolg‘on juftlikni hosil qilardi.
   * Summa ulushini bu yerda qayta hisoblash ham mumkin emas: foizlar
   * frontendda hisoblanmaydi (`money.utils.ts`).
   */
  measure?: 'count' | 'amount';
  /** `count` rejimida qiymat ustunini ham ko‘rsatadi (keng kartalarda). */
  showAmount?: boolean;
  empty?: ReactNode;
}

/**
 * TAQSIMOT RO‘YXATI — belgi, nom, soni, chiziq, foiz.
 *
 * ⚠️ RANG — YAGONA BELGI EMAS. Har qatorda nom ham, son ham, foiz ham
 * bor: rang ko‘rmaydigan foydalanuvchi uchun ro‘yxat baribir to‘liq
 * o‘qiladi (`health.ts` dagi palitra qoidasi).
 *
 * ⚠️ Chiziq uzunligi ENG KATTA qiymatga nisbatan, 100% ga emas.
 * Foizga nisbatan chizilsa, 3% va 5% li ikki guruh ikkalasi ham
 * ko‘rinmas chiziqcha bo‘lib qolardi va ro‘yxat bo‘sh ko‘rinardi.
 */
export function KpiDistribution({ rows, measure = 'count', showAmount, empty }: Props) {
  if (rows.length === 0) {
    return <p className="t-meta py-6 text-center">{empty ?? 'Ma’lumot yo‘q'}</p>;
  }

  const valueOf = (row: DistRow) =>
    measure === 'amount' ? Number(row.amount ?? 0) : row.count;
  const max = Math.max(1, ...rows.map(valueOf));

  return (
    <ul className="space-y-0.5">
      {rows.map((row) => {
        const width = `${Math.max(valueOf(row) > 0 ? 3 : 0, (valueOf(row) / max) * 100)}%`;
        const inner = (
          <>
            <span
              className={cn('size-2 shrink-0 rounded-full', row.barClass)}
              style={
                row.color
                  ? { backgroundColor: row.color, boxShadow: `0 0 0 2.5px ${row.color}26` }
                  : undefined
              }
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-micro text-strong" title={row.label}>
              {row.label}
            </span>

            {/* ⚠️ ASOSIY RAQAM — CHIZIQ BILAN BIR NARSANI o‘lchaydi.
                Ilgari qiymat rejimida chiziq summani, qalin raqam esa
                sonini ko‘rsatardi: ikkita eng ko‘zga tashlanadigan
                element bir-biriga zid turardi. */}
            {measure === 'amount' ? (
              <>
                <span className="num text-faint w-12 shrink-0 text-right text-micro">
                  {formatCount(row.count)} ta
                </span>
                <span className="num w-[78px] shrink-0 text-right text-micro font-semibold text-strong">
                  {formatCompact(row.amount ?? 0)}
                </span>
              </>
            ) : (
              <>
                {showAmount ? (
                  <span className="num text-faint w-[72px] shrink-0 text-right text-micro">
                    {formatCompact(row.amount ?? 0)}
                  </span>
                ) : null}
                <span className="num w-8 shrink-0 text-right text-micro font-semibold text-strong">
                  {formatCount(row.count)}
                </span>
              </>
            )}

            <span className="bar-track h-2 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <span
                className={cn('bar-fill block h-full rounded-full transition-[width] duration-500', row.barClass)}
                style={{ width, ...(row.color ? { backgroundColor: row.color } : {}) }}
              />
            </span>

            {measure === 'count' ? (
              <span className="num text-faint w-[42px] shrink-0 text-right text-micro">
                {formatPercent(row.percent)}
              </span>
            ) : null}
          </>
        );

        /*
         * ⚠️ Bosiladigan qator `button`, `div onClick` emas: u
         * klaviatura bilan ham ishlashi va ekran o‘qiyotgan dasturga
         * «bosiladigan» deb ko‘rinishi kerak.
         */
        return (
          <li key={row.key}>
            {row.onClick ? (
              <button
                type="button"
                onClick={row.onClick}
                aria-pressed={row.active}
                className={cn(
                  'flex w-full items-center gap-1.5 rounded-md px-1 py-[3px] text-left transition-colors',
                  row.active
                    ? 'bg-brand-500/10 dark:bg-brand-400/12'
                    : 'hover:bg-neutral-100/70 dark:hover:bg-white/6',
                )}
              >
                {inner}
              </button>
            ) : (
              <span className="flex w-full items-center gap-1.5 px-1 py-[3px]">{inner}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
