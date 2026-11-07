import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AiAnalysis, ConstructionObject, ProgressUpdate } from '@/shared/api/types';
import { RISK_META } from '@/shared/constants/health';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  ObjectAddress,
  ObjectResponsible,
  toObjectBrief,
} from '@/shared/ui';
import { LocationPicker } from './LocationPicker';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatAmount, formatCount, formatMoneyFull, formatPercent } from '@/shared/utils/money.utils';
import { CHART_TOOLTIP_STYLE, useChartColors } from '@/shared/hooks/useChartColors';

interface Props {
  object: ConstructionObject;
  progress: ProgressUpdate[];
  ai: AiAnalysis[];
}

export function ObjectOverviewTab({ object, progress, ai }: Props) {
  const { seriesHex } = useChartColors();
  const hasCoords = object.lat !== null && object.lng !== null;
  const chartData = progress.map((point) => ({
    date: formatDateUz(point.reportDate),
    bajarilish: point.progressPercent,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <Card className="flex flex-col xl:col-span-2">
        <CardHeader title="Bajarilish dinamikasi" subtitle="Qayd etilgan hisobotlar bo‘yicha" />
        <CardBody className="flex min-h-0 flex-1 flex-col">
          {chartData.length < 2 ? (
            <EmptyState
              className="flex-1"
              title="Grafik uchun ma’lumot yetarli emas"
              description="Dinamika chizilishi uchun kamida ikkita bajarilish yozuvi kerak."
            />
          ) : (
            <div className="min-h-[240px] flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesHex(0)} stopOpacity={0.26} />
                      <stop offset="100%" stopColor={seriesHex(0)} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-neutral-200 dark:text-white/10" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={24} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={42} unit="%" />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value) => [`${Number(value ?? 0)}%`, 'Bajarilish']}
                  />
                  <Area type="monotone" dataKey="bajarilish" stroke={seriesHex(0)} strokeWidth={2} fill="url(#progressFill)" />
                  <Line type="monotone" dataKey="bajarilish" stroke={seriesHex(0)} dot={{ r: 2.5 }} strokeWidth={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Asosiy ma’lumotlar" />
          <CardBody>
            <dl className="space-y-2.5 text-ui">
              <Row label="Buyurtmachi" value={object.customer?.name ?? '—'} />
              <Row label="Pudratchi" value={object.contractor?.name ?? '—'} />
              <Row
                label="Mas’ul"
                value={<ObjectResponsible brief={toObjectBrief(object)} variant="block" withIcon={false} />}
              />
              <Row
                label="Manzil"
                value={<ObjectAddress brief={toObjectBrief(object)} variant="block" />}
              />
              <Row label="Moliya manbai" value={object.fundingSource?.name ?? '—'} />
              {/* ⚠️ `toLocaleString('ru-RU')` ISHLATILMAYDI: natija kod
                  ishlayotgan muhitga (brauzer, Node ICU) bog‘liq va
                  bitta kartada «9 054,6» bilan «9.054,6» yonma-yon
                  chiqishi mumkin. `formatAmount` — loyihaning yagona
                  son formatlovchisi (`dates.md` §3 bilan bir mantiq). */}
              <Row label="Quvvati" value={object.capacity ? `${formatCount(object.capacity)} ${object.capacityUnit ?? ''}`.trim() : '—'} />
              <Row label="Maydoni" value={object.areaM2 ? `${formatAmount(object.areaM2, 1)} m²` : '—'} />
              <Row label="Qavatlar" value={object.floors ? String(object.floors) : '—'} />
              <Row label="Haqiqiy boshlanish" value={formatDateUz(object.actualStartDate)} />
              <Row label="Loyiha qiymati" value={formatMoneyFull(object.totalCost)} />
              <Row label="Ajratilgan" value={formatMoneyFull(object.fundedAmount)} />
              <Row label="To‘langan" value={formatMoneyFull(object.paidAmount)} />
            </dl>
          </CardBody>
        </Card>

        {/* ───── Joylashuvi ─────
            ⚠️ Koordinata bo‘lsa — XARITA, bo‘lmasa buni AYTADI va
            qayerdan to‘ldirish kerakligini ko‘rsatadi. Ilgari bu
            ma’lumot faqat raqam sifatida tahrirlash oynasida turardi
            va «obyekt xaritada nega yo‘q» degan savolga javob
            topilmasdi. */}
        <Card>
          <CardHeader
            title="Joylashuvi"
            subtitle={object.address ?? object.district?.name ?? undefined}
          />
          <CardBody>
            {hasCoords ? (
              <LocationPicker
                readOnly
                heightClass="h-[200px]"
                lat={String(object.lat)}
                lng={String(object.lng)}
                districtId={object.districtId}
                onChange={() => undefined}
              />
            ) : (
              <p className="flex items-start gap-2 rounded-lg surface-muted px-3 py-2.5 text-meta text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                Koordinata kiritilmagan — obyekt xaritada ko‘rinmaydi. «Tahrirlash»
                oynasidagi xaritadan nuqtani belgilang.
              </p>
            )}
          </CardBody>
        </Card>

        {ai.length > 0 ? (
          <Card>
            <CardHeader title="AI xulosasi" subtitle="rule-engine-v1" />
            <CardBody className="space-y-3">
              {ai.slice(0, 2).map((analysis) => {
                const risk = RISK_META[analysis.riskLevel];
                return (
                  <div key={analysis.id} className="rounded-lg surface-muted p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-micro font-medium text-muted">{ANALYSIS_LABELS[analysis.type]}</span>
                      <Badge className={risk.chip}>{formatPercent(analysis.score, 0)}</Badge>
                    </div>
                    <p className="mt-1.5 text-meta leading-relaxed text-strong">{analysis.summary}</p>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

const ANALYSIS_LABELS: Record<string, string> = {
  delay_forecast: 'Kechikish prognozi',
  risk_score: 'Risk bahosi',
  budget_deviation: 'Byudjet og‘ishi',
  photo_check: 'Foto tekshiruvi',
};

/**
 * ⚠️ `value` — `ReactNode`, `string` EMAS. Mas'ul qatori umumiy
 * komponent bilan chiziladi (`ObjectMeta.tsx`): ism shakli, lavozim
 * va telefon ko‘rsatmasi butun tizimda bitta joydan keladi.
 */
function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-strong">{value}</dd>
    </div>
  );
}
