import { Lightbulb, Sparkles } from 'lucide-react';
import type { AiAnalysis } from '@/shared/api/types';
import { RISK_META } from '@/shared/constants/health';
import { Badge, Card, CardBody, CardHeader, EmptyState, LoadingBlock } from '@/shared/ui';
import { formatDateTimeUz } from '@/shared/utils/date.utils';

const ANALYSIS_LABELS: Record<string, string> = {
  delay_forecast: 'Kechikish prognozi',
  risk_score: 'Umumiy risk bahosi',
  budget_deviation: 'Byudjet og‘ishi',
  photo_check: 'Foto-hisobot tekshiruvi',
};

/**
 * ⚠️ Natijalar SHAFFOF qoidalar dvigatelidan (`rule-engine-v1`) keladi.
 * Interfeys buni yashirmaydi: har xulosa ostida uning kirish ma’lumotlari
 * ko‘rsatiladi — hokim raqamning qaerdan kelganini tekshira olishi kerak.
 */
export function ObjectAiTab({ analyses, isLoading }: { analyses: AiAnalysis[]; isLoading: boolean }) {
  if (isLoading) return <LoadingBlock />;

  if (analyses.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Tahlil natijasi yo‘q"
          description="Tahlil har kecha 03:00 da avtomatik bajariladi."
          icon={<Sparkles className="size-5" />}
        />
      </Card>
    );
  }

  return (
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
                    {Object.entries(analysis.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between gap-3 text-micro">
                        <dt className="text-muted">{DETAIL_LABELS[key] ?? key}</dt>
                        <dd className="num font-medium text-strong">{renderValue(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ) : null}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

const DETAIL_LABELS: Record<string, string> = {
  remaining: 'Qolgan hajm, %',
  velocityPerDay: 'Sur’at, %/kun',
  daysNeeded: 'Kerakli kunlar',
  forecastDate: 'Prognoz sanasi',
  plannedEndDate: 'Reja muddati',
  overrunDays: 'Kechikish, kun',
  gap: 'Rejadan ortda, %',
  staleDays: 'Hisobotsiz kunlar',
  paidPercent: 'To‘langan, %',
  fundedPercent: 'Ajratilgan, %',
  progressPercent: 'Bajarilgan, %',
  deviation: 'Og‘ish, %',
};

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return String(Number(value.toFixed(2)));
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
