import type { KpiMetricDetail } from '@/shared/api/types';
import { HEALTH_META, type StatusMeta } from '@/shared/constants/health';
import {
  KPI_CAPTION,
  KPI_LABEL,
  KPI_SURFACE,
  KPI_TILE,
  type KpiTone,
} from '@/shared/constants/kpi-tone';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { MiniDonut, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';
import { kpiCaption, kpiStat, type KpiMeta } from '../kpi.meta';

/**
 * ULUSH HALQASINING RANGI — kartaning tusidan.
 *
 * ⚠️ `brand` uchun yozuv YO‘Q va kerak ham emas: «Jami obyektlar» va
 * «Umumiy qiymat» butunning O‘ZI (`share: false`), ularda halqa
 * chizilmaydi. Shuning uchun bu yerda `null` qaytariladi — ixtiyoriy
 * rang berilsa, halqa «100%» ni ko‘rsatib, hech narsa aytmagan
 * bo‘lardi.
 */
const TONE_META: Partial<Record<KpiTone, StatusMeta>> = {
  ok: HEALTH_META.on_schedule,
  warn: HEALTH_META.delayed,
  danger: HEALTH_META.at_risk,
  done: HEALTH_META.completed,
};

const STAT_TONE = {
  ok: 'text-ok-700 dark:text-ok-300',
  warn: 'text-warn-700 dark:text-warn-300',
  danger: 'text-danger-600 dark:text-danger-300',
  muted: 'text-muted',
} as const;

/**
 * SAHIFA SARLAVHASI — kartaning kattalashtirilgan ko‘rinishi.
 *
 * ⚠️ Ataylab kartaga O‘XSHAYDI: bir xil tus, bir xil ikonka plitkasi,
 * bir xil yorliq. Foydalanuvchi bosgan kartasini ichkarida qayta
 * ko‘rishi kerak, aks holda «qayerga tushdim» degan savol tug‘iladi.
 */
export function KpiHero({ meta, detail }: { meta: KpiMeta; detail: KpiMetricDetail }) {
  const { statusHex } = useChartColors();
  const Icon = meta.icon;

  const donut = TONE_META[meta.tone];
  const showDonut = meta.share && Boolean(donut);

  const headline =
    meta.headline === 'money'
      ? formatCompact(detail.finance.totalCost)
      : formatCount(detail.count);

  return (
    <section
      className={cn(
        'card relative overflow-hidden p-4 outline-1 -outline-offset-1 sm:p-5',
        KPI_SURFACE[meta.tone],
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className={cn('tile size-11 shrink-0 rounded-xl', KPI_TILE[meta.tone])} aria-hidden>
            <Icon className="size-[22px]" strokeWidth={2.1} />
          </span>

          <div className="min-w-0">
            <p className={cn('text-micro font-semibold tracking-wide', KPI_LABEL[meta.tone])}>
              {meta.label}
            </p>
            <p className="num mt-1 flex items-baseline gap-1.5 text-[34px] leading-none text-strong">
              {headline}
              {meta.headline === 'money' ? (
                <span className="text-body font-normal text-muted">so‘m</span>
              ) : (
                <span className="text-body font-normal text-muted">ta</span>
              )}
            </p>
            <p className={cn('mt-1.5 text-meta font-medium', KPI_CAPTION[meta.tone])}>
              {kpiCaption(meta, detail)}
            </p>
          </div>
        </div>

        {showDonut ? (
          <div className="flex items-center gap-3">
            <MiniDonut
              size={56}
              thickness={7}
              value={detail.percentOfScope}
              color={statusHex(donut!)}
              label={`${meta.label} — ${detail.percentOfScope}%`}
            />
            <div>
              <p className="num text-head leading-none text-strong">
                {formatPercent(detail.percentOfScope)}
              </p>
              {/* ⚠️ «Nimaning foizi» ekani AYTILADI: 59.2% o‘zicha hech
                  nima demaydi, «196 ta obyektdan» bilan birga esa
                  hamma narsani aytadi. */}
              <p className="t-meta mt-1">
                filtrdagi <span className="num">{formatCount(detail.scopeTotal)}</span> ta obyektdan
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* ───── Ko‘rsatkich chiplari ───── */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {meta.stats.map((key) => {
          const stat = kpiStat(key, detail);
          return (
            <div
              key={key}
              className="surface min-w-0 rounded-lg px-2.5 py-2 shadow-[0_0_0_1px_rgb(16_42_76/0.07)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
            >
              <p className="t-label truncate" title={stat.label}>
                {stat.label}
              </p>
              <p
                className={cn(
                  'num mt-0.5 truncate text-body font-semibold',
                  stat.tone ? STAT_TONE[stat.tone] : 'text-strong',
                )}
                title={stat.value}
              >
                {stat.value}
              </p>
              {stat.hint ? (
                <p className="text-faint mt-0.5 truncate text-nano" title={stat.hint}>
                  {stat.hint}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function KpiHeroSkeleton() {
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-2 h-8 w-40" />
          <Skeleton className="mt-2 h-2.5 w-56" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-lg" />
        ))}
      </div>
    </section>
  );
}
