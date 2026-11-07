import type { ReactNode } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardSummary, KpiMetricKey } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import {
  KPI_CAPTION,
  KPI_LABEL,
  KPI_SURFACE,
  KPI_TILE,
  type KpiTone,
} from '@/shared/constants/kpi-tone';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { MiniDonut, Skeleton, SparkBars } from '@/shared/ui';
import { MONTHS_UZ_CAP } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';
import { KPI_META, kpiPath } from '@/features/kpi/kpi.meta';

/**
 * ⚠️ Tus jadvallari (`KPI_SURFACE`, `KPI_TILE`, …) endi
 * `shared/constants/kpi-tone.ts` da. Ular batafsil sahifaning
 * sarlavhasida ham ishlatiladi: ikki nusxa bo‘lsa, kartani bosgan
 * odam ichkarida boshqa tusdagi ekran ko‘rardi.
 */

interface KpiCardProps {
  /** Batafsil sahifa — karta BOSILADIGAN bo‘ladi. */
  metric: KpiMetricKey;
  label: string;
  value: ReactNode;
  /** Qiymatdan keyingi kichik birlik — «so‘m», «%». */
  unit?: string;
  caption?: ReactNode;
  icon: LucideIcon;
  tone: KpiTone;
  visual?: ReactNode;
  /**
   * Grafikani pastki o‘ng burchakka SUZDIRADI (oqimdan chiqaradi).
   *
   * ⚠️ Uzun yorliqli kartalar uchun («Joriy yil yakunlanadi»,
   * «Umumiy qiymat»): yonma-yon joylashganda grafika 44px joy yeb,
   * yorliq «Joriy yil yakunla…» bo‘lib qirqilardi. Suzganda yorliqqa
   * butun kenglik qoladi, grafika esa izoh satrining bo‘sh o‘ng
   * tomonida turadi.
   */
  floatVisual?: boolean;
}

/**
 * Ko‘rsatkich kartasi: rangli ikonka plitkasi + yorliq + raqam + izoh,
 * o‘ng chekkada kichik grafika (halqa yoki ustunchalar).
 *
 * ⚠️ KARTA — HAVOLA (`<Link>`), `div` emas. Ichida o‘sha ko‘rsatkichning
 * batafsil sahifasi ochiladi. `button` bilan qilinmaydi: havola bo‘lsa
 * sichqonchaning o‘rta tugmasi bilan yangi oynada ochiladi, manzili
 * ko‘rinadi va saqlab qo‘yish mumkin — hokimlikda bu kundalik ish.
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
function KpiCard({
  metric,
  label,
  value,
  unit,
  caption,
  icon: Icon,
  tone,
  visual,
  floatVisual,
}: KpiCardProps) {
  return (
    /*
     * ⚠️ `min-w-0` MAJBURIY. Grid yacheykasi sukut bo‘yicha
     * `min-width: auto` — ya’ni u ICHIDAGI eng keng elementdan
     * kichrayolmaydi. «7.4 trln so‘m» kabi uzun qiymat tufayli
     * oltinchi karta yacheykani kengaytirib, butun qatorni ekrandan
     * chiqarib yuborardi (gorizontal skroll). `min-w-0` + `truncate`
     * uni qisqartiradi.
     *
     * ⚠️ Halqa `outline` BILAN, `ring` bilan EMAS. `.card` o'zining
     * `box-shadow` ini belgilaydi va Tailwind halqasi ham AYNI
     * xossani ishlatadi: ikkalasi bir elementda uchrashganda halqa
     * butunlay yo'qolardi. `outline` boshqa xossa, `-outline-offset-1`
     * esa uni chegaraning o'ziga qo'yadi va o'lchamni o'zgartirmaydi.
     *
     * ⚠️ Halqa KARTANING O'Z TUSIDA. Neytral halqa bilan rangli karta
     * «kulrang ramkaga solingan» bo'lib ko'rinardi; o'z rangidagi
     * halqa esa tusni yopib, kartani butun qiladi.
     */
    /*
     * ⚠️ `aria-label` QO‘YILMAYDI. U kartaning butun matnini (yorliq,
     * raqam, izoh) ekran o‘qiyotgan dastur uchun ALMASHTIRIB yuborardi
     * va foydalanuvchi aynan o‘sha raqamni eshitmay qolardi. Havola
     * ekani `a` elementining o‘zidan ma’lum.
     */
    <Link
      to={kpiPath(metric)}
      className={cn(
        'card card-hover group relative flex min-w-0 items-center gap-2 px-2 py-2',
        'outline-1 -outline-offset-1',
        'focus-visible:outline-2 focus-visible:outline-brand-500',
        KPI_SURFACE[tone],
      )}
    >
      <span className={cn('tile size-8 shrink-0 rounded-lg', KPI_TILE[tone])} aria-hidden>
        <Icon className="size-[17px]" strokeWidth={2.1} />
      </span>

      <div className="min-w-0 flex-1">
        {/*
          ⚠️ Yorliq QIRQILMAYDI (`truncate` yo‘q) — kerak bo‘lsa ikkinchi
          qatorga o‘tadi. «Joriy yil yakunla…» degan yorliq hech narsa
          tushuntirmaydi, ikki qatorli yorliq esa tushuntiradi; grid
          yacheykalari baribir bir xil balandlikka cho‘ziladi, shuning
          uchun qator ko‘rinishi buzilmaydi.
        */}
        <p className={cn('text-nano leading-[1.25] font-semibold', KPI_LABEL[tone])}>{label}</p>
        <p className="num mt-0.5 flex min-w-0 items-baseline gap-1 text-[21px] leading-none whitespace-nowrap text-strong">
          {value}
          {unit ? <span className="text-micro font-normal text-muted">{unit}</span> : null}
        </p>
        {caption ? (
          <p className={cn('mt-0.5 truncate text-nano font-medium', floatVisual && 'pr-10', KPI_CAPTION[tone])}>
            {caption}
          </p>
        ) : null}
      </div>

      {visual ? (
        <span className={cn('shrink-0', floatVisual && 'absolute right-2 bottom-2')}>{visual}</span>
      ) : null}

      {/*
        ⚠️ Strelka FAQAT sichqoncha ostida ko‘rinadi va `aria-hidden`:
        kartada allaqachon oltita element bor, doimiy strelka ettinchisi
        bo‘lib, raqamdan e’tiborni tortardi. Bosilishini esa butun
        kartaning ko‘tarilishi (`card-hover`) aytib turadi.
      */}
      <ArrowUpRight
        className={cn(
          'absolute top-1.5 right-1.5 size-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100',
          KPI_CAPTION[tone],
        )}
        aria-hidden
      />
    </Link>
  );
}

export function KpiCardsSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="card flex min-w-0 items-center gap-2 px-2 py-2">
          <Skeleton className="size-7 rounded-lg" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-2 w-16" />
            <Skeleton className="mt-1.5 h-4 w-12" />
            <Skeleton className="mt-1.5 h-1.5 w-14" />
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
 *
 * ⚠️ Yorliq va ikonka `KPI_META` dan olinadi — batafsil sahifaning
 * sarlavhasi ham o‘sha yerdan. Ikki joyda yozilsa, karta «Xavfli
 * holatda», ichkaridagi sahifa esa boshqa nom ko‘rsatishi mumkin edi.
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
        metric="total"
        label={KPI_META.total.label}
        value={formatCount(summary.total)}
        caption="Topshirilganlarsiz"
        icon={KPI_META.total.icon}
        tone={KPI_META.total.tone}
      />

      <KpiCard
        metric="on-plan"
        label={KPI_META['on-plan'].label}
        value={formatCount(cards.onPlan.count)}
        caption={formatPercent(cards.onPlan.percent)}
        icon={KPI_META['on-plan'].icon}
        tone={KPI_META['on-plan'].tone}
        visual={
          <MiniDonut
            size={30}
            thickness={4}
            value={cards.onPlan.percent}
            color={statusHex(HEALTH_META.on_schedule)}
            label={`Reja asosida ${cards.onPlan.percent}%`}
          />
        }
      />

      <KpiCard
        metric="delayed"
        label={KPI_META.delayed.label}
        value={formatCount(cards.delayed.count)}
        caption={formatPercent(cards.delayed.percent)}
        icon={KPI_META.delayed.icon}
        tone={KPI_META.delayed.tone}
        visual={
          <MiniDonut
            size={30}
            thickness={4}
            value={cards.delayed.percent}
            color={statusHex(HEALTH_META.delayed)}
            label={`Kechikayotgan ${cards.delayed.percent}%`}
          />
        }
      />

      <KpiCard
        metric="at-risk"
        label={KPI_META['at-risk'].label}
        value={formatCount(cards.atRisk.count)}
        caption={formatPercent(cards.atRisk.percent)}
        icon={KPI_META['at-risk'].icon}
        tone={KPI_META['at-risk'].tone}
        visual={
          <MiniDonut
            size={30}
            thickness={4}
            value={cards.atRisk.percent}
            color={statusHex(HEALTH_META.at_risk)}
            label={`Xavfli ${cards.atRisk.percent}%`}
          />
        }
      />

      <KpiCard
        metric="completing"
        label={KPI_META.completing.label}
        value={formatCount(completingThisYear.count)}
        caption={`${completingThisYear.year}-yil oxirigacha`}
        icon={KPI_META.completing.icon}
        tone={KPI_META.completing.tone}
        floatVisual
        visual={
          /* ⚠️ Ustunlar KARTANING TUSIDA (binafsha), neytral kulrangda
             emas: tusli karta ustidagi kulrang diagramma «boshqa
             joydan kelib qolgan» bo‘lib ko‘rinardi. */
          <SparkBars
            className="w-9"
            values={completingThisYear.byMonth}
            labels={MONTHS_UZ_CAP.map((month) => month)}
            highlightLast
            barClassName="bg-done-300 dark:bg-done-400/40"
            highlightClassName="bg-done-500 dark:bg-done-300"
          />
        }
      />

      <KpiCard
        metric="cost"
        label={KPI_META.cost.label}
        value={<span className="text-[17px]">{formatCompact(finance.totalCost)} so‘m</span>}
        caption={`Ajratilgan: ${formatCompact(finance.fundedAmount)} so‘m`}
        icon={KPI_META.cost.icon}
        tone={KPI_META.cost.tone}
        floatVisual
        visual={
          <SparkBars
            className="w-9"
            values={costByYear}
            labels={costYearLabels}
            barClassName="bg-brand-300 dark:bg-brand-400/40"
          />
        }
      />
    </>
  );
}
