import type { ReactNode } from 'react';
import {
  Building2,
  CircleCheckBig,
  Clock,
  Construction,
  Database,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import type { DashboardSummary } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { MiniDonut, Skeleton, SparkBars } from '@/shared/ui';
import { MONTHS_UZ_CAP } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';

/**
 * Plitka ranglari — TO‘LIQ yozilgan klass nomlari.
 *
 * ⚠️ `bg-${tone}-100` kabi yig‘ilmaydi: Tailwind klasslarni fayl
 * MATNIDAN qidiradi va yig‘ilgan nomni topa olmaydi — plitka rangsiz,
 * shaffof bo‘lib qolardi.
 */
const TILE = {
  brand: 'bg-brand-100 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300',
  ok: 'bg-ok-100 text-ok-600 dark:bg-ok-500/15 dark:text-ok-300',
  warn: 'bg-warn-100 text-warn-600 dark:bg-warn-500/15 dark:text-warn-300',
  danger: 'bg-danger-100 text-danger-500 dark:bg-danger-500/15 dark:text-danger-300',
  done: 'bg-done-100 text-done-600 dark:bg-done-500/15 dark:text-done-300',
} as const;

/**
 * Yorliq va izoh rangi — plitka bilan BITTA oiladan.
 *
 * ⚠️ Kulrang yorliq (`t-label`) ishlatilmaydi: oltita karta yonma-yon
 * turganda faqat plitka rangli bo‘lsa, ko‘z ularni «bir xil oltita
 * karta» deb o‘qiydi. Yorliq ham bo‘yalganda har kartaning MA’NOSI
 * (yaxshi / ogohlantirish / xavf) bir qarashda ko‘rinadi.
 *
 * ⚠️ `neutral` — «Jami obyektlar» uchun: u holat EMAS, shuning uchun
 * holat rangini olmaydi.
 */
const LABEL = {
  brand: 'text-brand-700 dark:text-brand-300',
  ok: 'text-ok-700 dark:text-ok-300',
  warn: 'text-warn-700 dark:text-warn-300',
  danger: 'text-danger-600 dark:text-danger-300',
  done: 'text-done-700 dark:text-done-300',
} as const;

const CAPTION = {
  brand: 'text-brand-600/80 dark:text-brand-300/70',
  ok: 'text-ok-600/85 dark:text-ok-300/70',
  warn: 'text-warn-600/85 dark:text-warn-300/70',
  danger: 'text-danger-500/85 dark:text-danger-300/70',
  done: 'text-done-600/80 dark:text-done-300/70',
} as const;

type Tone = keyof typeof TILE;

interface KpiCardProps {
  label: string;
  value: ReactNode;
  /** Qiymatdan keyingi kichik birlik — «so‘m», «%». */
  unit?: string;
  caption?: ReactNode;
  icon: LucideIcon;
  tone: Tone;
  visual?: ReactNode;
}

/**
 * Ko‘rsatkich kartasi: rangli ikonka plitkasi + yorliq + raqam + izoh,
 * o‘ng chekkada kichik grafika (halqa yoki ustunchalar).
 *
 * ⚠️ Plitka rangi — KARTANING MA’NOSI, bezak emas: yashil «reja
 * asosida», qahrabo «kechikayotgan», qizil «xavfli». Shuning uchun u
 * `HEALTH_META` bilan bitta oiladan olinadi; yangi karta qo‘shilsa,
 * rangni ixtiyoriy tanlamang — ma’nosiga qarab tanlang.
 *
 * ⚠️ Raqam yonidagi izoh MAJBURIY emas, lekin foiz ko‘rsatilganda u
 * «nimaning foizi» ekanini aytishi shart: 72.8% o‘zicha hech nima
 * demaydi.
 */
function KpiCard({ label, value, unit, caption, icon: Icon, tone, visual }: KpiCardProps) {
  return (
    <div className="card card-hover flex items-center gap-2.5 px-3 py-3">
      <span className={cn('tile', TILE[tone])} aria-hidden>
        <Icon className="size-[19px]" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-meta font-medium', LABEL[tone])}>{label}</p>
        <p className="num mt-0.5 flex min-w-0 items-baseline gap-1 text-[25px] leading-none whitespace-nowrap text-strong">
          {value}
          {unit ? <span className="text-meta font-normal text-muted">{unit}</span> : null}
        </p>
        {caption ? (
          <p className={cn('mt-0.5 truncate text-micro font-medium', CAPTION[tone])}>{caption}</p>
        ) : null}
      </div>

      {visual ? <span className="shrink-0">{visual}</span> : null}
    </div>
  );
}

export function KpiCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card flex items-center gap-3 px-3.5 py-3">
          <Skeleton className="size-[38px] rounded-[10px]" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="mt-2 h-5 w-14" />
            <Skeleton className="mt-2 h-2 w-16" />
          </div>
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
        icon={Building2}
        tone="brand"
      />

      <KpiCard
        label="Reja asosida"
        value={formatCount(cards.onPlan.count)}
        caption={formatPercent(cards.onPlan.percent)}
        icon={CircleCheckBig}
        tone="ok"
        visual={
          <MiniDonut
            size={38}
            thickness={4}
            value={cards.onPlan.percent}
            color={statusHex(HEALTH_META.on_schedule)}
            label={`Reja asosida ${cards.onPlan.percent}%`}
          />
        }
      />

      <KpiCard
        label="Kechikayotgan"
        value={formatCount(cards.delayed.count)}
        caption={formatPercent(cards.delayed.percent)}
        icon={Clock}
        tone="warn"
        visual={
          <MiniDonut
            size={38}
            thickness={4}
            value={cards.delayed.percent}
            color={statusHex(HEALTH_META.delayed)}
            label={`Kechikayotgan ${cards.delayed.percent}%`}
          />
        }
      />

      <KpiCard
        label="Xavfli holatda"
        value={formatCount(cards.atRisk.count)}
        caption={formatPercent(cards.atRisk.percent)}
        icon={ShieldAlert}
        tone="danger"
        visual={
          <MiniDonut
            size={38}
            thickness={4}
            value={cards.atRisk.percent}
            color={statusHex(HEALTH_META.at_risk)}
            label={`Xavfli ${cards.atRisk.percent}%`}
          />
        }
      />

      <KpiCard
        label="Joriy yil yakunlanadi"
        value={formatCount(completingThisYear.count)}
        caption={`${completingThisYear.year}-yil oxirigacha`}
        icon={Construction}
        tone="done"
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
        icon={Database}
        tone="brand"
        visual={<SparkBars className="w-14" values={costByYear} labels={costYearLabels} />}
      />
    </>
  );
}
