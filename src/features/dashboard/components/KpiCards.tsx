import type { ReactNode } from 'react';
import type { DashboardSummary } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { MiniDonut, Skeleton, SparkBars } from '@/shared/ui';
import { MONTHS_UZ_CAP } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Qiymatdan keyingi kichik birlik — «so‘m», «%». */
  unit?: string;
  caption?: ReactNode;
  /** Chap chekkadagi ingichka rangli chiziq — holat belgisi. */
  accent?: string;
  visual?: ReactNode;
}

/**
 * Ko‘rsatkich kartasi.
 *
 * ⚠️ IKONKA YO‘Q. Oltita rangli ikonka plitkasi qatori e’tiborni RAQAMDAN
 * tortib oladi, holbuki karta bor-yo‘g‘i raqam ko‘rsatish uchun. Uning
 * o‘rniga chap chekkada ingichka rangli chiziq — u joy egallamaydi,
 * lekin kartani holat bilan bog‘laydi.
 *
 * Raqam — SERIF (`.num`): matn oqimidan darhol ajralib turadi va
 * ustunlar bir chiziqda qoladi.
 */
function KpiCard({ label, value, unit, caption, accent, visual }: KpiCardProps) {
  return (
    <div className="card card-hover relative overflow-hidden px-3.5 py-3">
      {accent ? (
        <span aria-hidden className={cn('absolute inset-y-0 left-0 w-[3px]', accent)} />
      ) : null}

      <p className="t-label truncate">{label}</p>

      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="num flex min-w-0 items-baseline gap-1 text-[26px] leading-none whitespace-nowrap text-strong">
          {value}
          {unit ? <span className="text-meta font-normal text-muted">{unit}</span> : null}
        </p>
        {visual ? <span className="shrink-0 pb-0.5">{visual}</span> : null}
      </div>

      {caption ? <p className="text-faint mt-1.5 truncate text-micro">{caption}</p> : null}
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card px-3.5 py-3">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="mt-2.5 h-6 w-16" />
          <Skeleton className="mt-2.5 h-2 w-20" />
        </div>
      ))}
    </>
  );
}

/**
 * Bosh sahifadagi oltita ko‘rsatkich.
 *
 * ⚠️ Foizlar frontendda QAYTA HISOBLANMAYDI — ular serverdan tayyor keladi.
 * Ikki joyda hisoblansa, yaxlitlash farqi tufayli karta va hisobot
 * boshqa-boshqa raqam ko‘rsatishi mumkin edi.
 */
export function KpiCards({ summary }: { summary: DashboardSummary }) {
  const { cards, completingThisYear, finance } = summary;
  const { statusHex } = useChartColors();

  const costByYear = finance.byYear.map((item) => Number(item.amount));
  const costYearLabels = finance.byYear.map((item) => `${item.year}-yil`);

  return (
    <>
      {/* ⚠️ Izoh «100%» EMAS. Bu son topshirilgan va bekor qilingan
          obyektlarni O‘Z ICHIGA OLMAYDI (dashboard faol nazorat haqida),
          obyektlar ro‘yxati esa ularni ham ko‘rsatadi. Izohsiz
          foydalanuvchi ikki ekranda ikki xil son ko‘rib, qaysi biri
          to‘g‘ri ekanini bilmay qolardi. */}
      <KpiCard
        label="Jami obyektlar"
        value={formatCount(summary.total)}
        caption="Topshirilganlarsiz"
      />

      <KpiCard
        label="Reja asosida"
        value={formatCount(cards.onPlan.count)}
        caption={`Jamining ${formatPercent(cards.onPlan.percent)} qismi`}
        accent={HEALTH_META.on_schedule.bar}
        visual={
          <MiniDonut
            size={34}
            thickness={3.5}
            value={cards.onPlan.percent}
            color={statusHex(HEALTH_META.on_schedule)}
            label={`Reja asosida ${cards.onPlan.percent}%`}
          />
        }
      />

      <KpiCard
        label="Kechikayotgan"
        value={formatCount(cards.delayed.count)}
        caption={`Jamining ${formatPercent(cards.delayed.percent)} qismi`}
        accent={HEALTH_META.delayed.bar}
        visual={
          <MiniDonut
            size={34}
            thickness={3.5}
            value={cards.delayed.percent}
            color={statusHex(HEALTH_META.delayed)}
            label={`Kechikayotgan ${cards.delayed.percent}%`}
          />
        }
      />

      <KpiCard
        label="Xavfli holatda"
        value={formatCount(cards.atRisk.count)}
        caption={`Jamining ${formatPercent(cards.atRisk.percent)} qismi`}
        accent={HEALTH_META.at_risk.bar}
        visual={
          <MiniDonut
            size={34}
            thickness={3.5}
            value={cards.atRisk.percent}
            color={statusHex(HEALTH_META.at_risk)}
            label={`Xavfli ${cards.atRisk.percent}%`}
          />
        }
      />

      <KpiCard
        label="Joriy yil yakunlanadi"
        value={formatCount(completingThisYear.count)}
        caption={`${completingThisYear.year}-yil oxirigacha topshiriladi`}
        visual={
          <SparkBars
            className="w-14"
            values={completingThisYear.byMonth}
            labels={MONTHS_UZ_CAP.map((month) => month)}
            highlightLast
          />
        }
      />

      <KpiCard
        label="Umumiy qiymat"
        value={formatCompact(finance.totalCost)}
        unit="so‘m"
        caption={`Ajratilgan: ${formatCompact(finance.fundedAmount)} so‘m`}
        visual={<SparkBars className="w-14" values={costByYear} labels={costYearLabels} />}
      />
    </>
  );
}
