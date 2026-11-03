import { ClipboardList, Lightbulb, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useAnalyzeObject } from '@/shared/api/queries';
import type { AiAnalysis, Milestone } from '@/shared/api/types';
import { RISK_META } from '@/shared/constants/health';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  ProgressBar,
} from '@/shared/ui';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { formatPercent } from '@/shared/utils/money.utils';

const ANALYSIS_LABELS: Record<string, string> = {
  delay_forecast: 'Kechikish prognozi',
  risk_score: 'Umumiy risk bahosi',
  budget_deviation: 'Byudjet og‘ishi',
  photo_check: 'Foto-hisobot tekshiruvi',
  milestone_progress: 'Bosqich tahlili',
};

/**
 * ⚠️ Natijalar SHAFFOF qoidalar dvigatelidan (`rule-engine-v1`) keladi.
 * Interfeys buni yashirmaydi: har xulosa ostida uning kirish ma’lumotlari
 * ko‘rsatiladi — hokim raqamning qaerdan kelganini tekshira olishi kerak.
 */
export function ObjectAiTab({
  objectId,
  analyses,
  milestoneAnalyses,
  milestones,
  isLoading,
}: {
  objectId: string;
  analyses: AiAnalysis[];
  milestoneAnalyses: AiAnalysis[];
  milestones: Milestone[];
  isLoading: boolean;
}) {
  const analyze = useAnalyzeObject(objectId);

  const run = async (withMilestones: boolean) => {
    try {
      await analyze.mutateAsync(withMilestones);
      toast.success(withMilestones ? 'Obyekt va bosqichlar tahlil qilindi' : 'Obyekt tahlil qilindi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  /* ⚠️ Tugmalar HAR DOIM ko‘rinadi — natija bor-yo‘qligidan qat’i nazar.
     Ilgari bo‘sh ekranda «tahlil har kecha bajariladi» deb yozilardi va
     odam ertagacha kutishdan boshqa yo‘l topa olmasdi. */
  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        loading={analyze.isPending}
        onClick={() => void run(false)}
        leftIcon={<Sparkles className="size-3.5" />}
      >
        Obyektni tahlil qilish
      </Button>
      {milestones.length > 0 ? (
        <Button
          size="sm"
          loading={analyze.isPending}
          onClick={() => void run(true)}
          leftIcon={<ClipboardList className="size-3.5" />}
        >
          Bosqichlar bilan birga
        </Button>
      ) : null}
    </div>
  );

  if (isLoading) return <LoadingBlock />;

  if (analyses.length === 0 && milestoneAnalyses.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Tahlil natijasi yo‘q"
          description="Tahlil har kecha 03:00 da avtomatik bajariladi. Kutmasdan hozir ham ishga tushirishingiz mumkin."
          icon={<Sparkles className="size-5" />}
          action={actions}
        />
      </Card>
    );
  }

  const milestoneById = new Map(milestones.map((m) => [m.id, m]));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="AI tahlil"
          subtitle="Natijalar shaffof qoidalar dvigatelidan — har xulosa o‘z kirish ma’lumotini olib yuradi"
          action={actions}
        />
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {analyses.map((analysis) => {
        const risk = RISK_META[analysis.riskLevel];
        return (
          <Card key={analysis.id}>
            <CardHeader
              title={ANALYSIS_LABELS[analysis.type] ?? analysis.type}
              subtitle={`${analysis.model} · ${formatDateTimeUz(analysis.createdAt)}`}
              action={<Badge className={risk.chip}>{risk.label} · {analysis.score}</Badge>}
            />
            <CardBody className="space-y-3">
              <p className="text-ui leading-relaxed text-strong">{analysis.summary}</p>

              {analysis.recommendations?.length ? (
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex gap-2 text-meta text-muted">
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warn-500" />
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {analysis.details ? (
                <details className="rounded-lg surface-muted px-3 py-2">
                  <summary className="cursor-pointer text-micro font-medium text-muted select-none">
                    Hisob-kitob ma’lumotlari
                  </summary>
                  <dl className="mt-2 space-y-1">
                    {Object.entries(analysis.details).map(([key, value]) =>
                      // ⚠️ Ichma-ich obyekt (`factors`) ALOHIDA chiziladi.
                      // Ilgari u `JSON.stringify` bilan xom holda
                      // chiqardi: ekranda
                      // `{"gap":8.544000000000006,"delay":12,…}` turardi —
                      // hokim uchun bu o‘qib bo‘lmaydigan matn.
                      isRecord(value) ? (
                        <FactorBreakdown key={key} factors={value} />
                      ) : (
                        <div key={key} className="flex justify-between gap-3 text-micro">
                          <dt className="text-muted">{DETAIL_LABELS[key] ?? key}</dt>
                          <dd className="num font-medium text-strong">{renderValue(value)}</dd>
                        </div>
                      ),
                    )}
                  </dl>
                </details>
              ) : null}
            </CardBody>
          </Card>
        );
      })}
      </div>

      {/* ───── Bosqichlar kesimi ───── */}
      {milestoneAnalyses.length > 0 ? (
        <Card>
          <CardHeader
            title="Bosqichlar bo‘yicha tahlil"
            subtitle={`${milestoneAnalyses.length} ta bosqich — har biri umumiy natijaga qancha qo‘shgani bilan`}
          />
          <CardBody className="space-y-3">
            {milestoneAnalyses.map((analysis) => {
              const risk = RISK_META[analysis.riskLevel];
              const milestone = analysis.milestoneId
                ? milestoneById.get(analysis.milestoneId)
                : undefined;
              const contribution = Number(analysis.details?.contribution ?? 0);
              const weight = Number(analysis.details?.weight ?? milestone?.weight ?? 0);

              return (
                <div key={analysis.id} className="rounded-xl surface-muted p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-ui font-semibold text-strong">
                      {milestone?.name ?? 'Bosqich'}
                    </p>
                    <div className="flex items-center gap-2">
                      {/* ⚠️ Bu yerda `score` — RISK BALI EMAS, bosqichning
                          BAJARILISHI. Yorliq shuni aniq aytadi, aks holda
                          «100» ni yuqori xavf deb o‘qish mumkin edi. */}
                      <span className="num text-meta font-semibold text-strong">
                        Bajarilish: {formatPercent(analysis.score)}
                      </span>
                      <Badge className={risk.chip}>Xavf: {risk.label}</Badge>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-3">
                    <ProgressBar value={analysis.score} size="xs" className="flex-1" />
                    <span className="num w-28 shrink-0 text-right text-micro text-muted">
                      umumiyga {contribution}% / {weight}%
                    </span>
                  </div>

                  <p className="mt-2 text-meta leading-relaxed text-strong">{analysis.summary}</p>

                  {analysis.recommendations?.length ? (
                    <ul className="mt-2 space-y-1">
                      {analysis.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex gap-2 text-meta text-muted">
                          <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warn-500" />
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <p className="text-faint mt-2 text-nano">
                    {analysis.model} · {formatDateTimeUz(analysis.createdAt)}
                  </p>
                </div>
              );
            })}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

/**
 * `details` kalitlari uchun o‘zbekcha yorliqlar.
 *
 * ⚠️ RO‘YXAT TO‘LIQ bo‘lishi shart: yorliq topilmasa, ekranga kalitning
 * O‘ZI chiqadi (`plannedDaysLeft 8`) va hokim ingliz tilidagi
 * o‘zgaruvchi nomini o‘qishga majbur bo‘ladi. Dvigatelga
 * (`ai-engine.helpers.ts`) yangi maydon qo‘shilsa, SHU YERGA ham
 * qo‘shiladi.
 */
const DETAIL_LABELS: Record<string, string> = {
  /* Kechikish prognozi */
  remaining: 'Qolgan hajm, %',
  velocity: 'Sur’at, %/kun',
  velocityPerDay: 'Sur’at, %/kun',
  daysNeeded: 'Kerakli kunlar',
  plannedDaysLeft: 'Rejada qolgan kun',
  forecastDate: 'Prognoz sanasi',
  plannedEndDate: 'Reja muddati',
  overrunDays: 'Kechikish, kun',
  reason: 'Sabab',

  /* Risk bahosi */
  gap: 'Rejadan ortda, %',
  staleDays: 'Hisobotsiz kunlar',

  /* Byudjet */
  paidPercent: 'To‘langan, %',
  fundedPercent: 'Ajratilgan, %',
  progressPercent: 'Bajarilgan, %',
  deviation: 'Og‘ish, %',

  /* Bosqich tahlili */
  milestonePercent: 'Bosqich bajarilishi, %',
  milestoneExpected: 'Reja bo‘yicha bugun, %',
  milestoneGap: 'Rejadan ortda, %',
  weight: 'Ulushi, %',
  contribution: 'Umumiyga qo‘shgani, %',
  overdueDays: 'Muddatdan o‘tgan kun',
  daysLeft: 'Muddatgacha kun',
  plannedEnd: 'Reja muddati',
  actualEnd: 'Haqiqatda yakunlandi',
  workerCount: 'Ishchilar soni',
  reportCount: 'Foto-hisobotlar',
  aiEstimatedProgress: 'Suratdan baholangan, %',
  estimateGap: 'Hisobot va surat farqi, %',
  objectProgress: 'Obyekt bajarilishi, %',
  objectExpectedProgress: 'Obyekt rejasi, %',
  totalMilestones: 'Jami bosqich',
  doneMilestones: 'Yakunlangan bosqich',
};

/** Erkin matnli qiymatlar uchun o‘zbekcha ko‘rinish. */
const VALUE_LABELS: Record<string, string> = {
  insufficient_data: 'ma’lumot yetarli emas',
  no_total_cost: 'loyiha qiymati kiritilmagan',
};

/**
 * RISK BALLARI — har omilning ulushi va SHIFTI.
 *
 * Shiftlar `ai-engine.helpers.ts` dagi `scoreRisk()` bilan AYNI
 * bo‘lishi shart: ular shu yerda qayta yozilgan, chunki server
 * faqat hisoblangan ballni yuboradi, shiftni emas.
 *
 * ⚠️ Shift KO‘RSATILISHI shart. «Kechikish 12» o‘zicha hech nima
 * demaydi; «12 / 30» esa bu omil o‘z chegarasining qanchasini
 * egallaganini darhol aytadi — risk bahosi aynan shundan yig‘iladi.
 */
const FACTOR_META: Record<string, { label: string; max: number }> = {
  delay: { label: 'Kechikish', max: 30 },
  gap: { label: 'Rejadan ortda', max: 25 },
  openIssues: { label: 'Ochiq muammolar', max: 20 },
  reporting: { label: 'Hisobot berilmagani', max: 15 },
  funding: { label: 'Moliyalashtirilmagani', max: 10 },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function FactorBreakdown({ factors }: { factors: Record<string, unknown> }) {
  const rows = Object.entries(factors)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({
      key,
      value: value as number,
      meta: FACTOR_META[key],
    }))
    // Eng katta hissa yuqorida — «nega risk yuqori» degan savolga
    // birinchi qator javob beradi.
    .sort((a, b) => b.value - a.value);

  if (rows.length === 0) return null;

  return (
    <div className="pt-1">
      <dt className="text-micro text-muted">Risk ballari (qaysi omil qancha qo‘shdi)</dt>
      <dd className="mt-1 space-y-1">
        {rows.map(({ key, value, meta }) => {
          const max = meta?.max ?? 100;
          return (
            <div key={key} className="flex items-center gap-2 text-micro">
              <span className="w-[108px] shrink-0 truncate text-muted">
                {meta?.label ?? key}
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
                <span
                  className="block h-full rounded-full bg-danger-400"
                  style={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                />
              </span>
              <span className="num w-12 shrink-0 text-right font-medium text-strong">
                {round2(value)}
                <span className="text-faint font-normal"> / {max}</span>
              </span>
            </div>
          );
        })}
      </dd>
    </div>
  );
}

/**
 * ⚠️ Suzuvchi nuqtali son YAXLITLANADI. `8.544000000000006` —
 * ikkilik kasr xatosi; ekranda u «tizim buzuq» taassurotini beradi.
 */
function round2(value: number): number {
  return Number(value.toFixed(2));
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return String(round2(value));
  if (typeof value === 'string' && VALUE_LABELS[value]) return VALUE_LABELS[value];
  if (Array.isArray(value)) return value.length ? value.map(renderValue).join(', ') : '—';
  // ⚠️ Bu yerga ichma-ich obyekt TUSHMASLIGI kerak — u `FactorBreakdown`
  // bilan chiziladi. Yangi tur paydo bo‘lsa, xom JSON o‘rniga tushunarli
  // belgi qaytariladi.
  if (typeof value === 'object') return '—';
  if (typeof value === 'boolean') return value ? 'ha' : 'yo‘q';
  return String(value);
}
