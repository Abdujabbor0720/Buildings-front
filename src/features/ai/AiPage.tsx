import { Info, Lightbulb, ListChecks, Play, Sparkles } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { apiPost, getErrorMessage } from '@/shared/api/client';
import { useAiOverview } from '@/shared/api/queries';
import { RISK_META } from '@/shared/constants/health';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, LoadingBlock, PageHeader, ProgressBar, ErrorState} from '@/shared/ui';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { formatCount, formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';
import { CHART_TOOLTIP_STYLE } from '@/shared/hooks/useChartColors';
import { AnalyzeObjectsModal } from './components/AnalyzeObjectsModal';

export default function AiPage() {
  const { regionId } = useFiltersStore();
  const can = useAuthStore((state) => state.can);
  const { data, isLoading, isError, error, refetch } = useAiOverview(regionId ?? undefined);
  const [running, setRunning] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function runAnalysis() {
    setRunning(true);
    try {
      const result = await apiPost<{ analyzed: number; failed: number }>('/ai/run');
      toast.success(`${result.analyzed} ta obyekt tahlil qilindi`);
      await refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setRunning(false);
    }
  }

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  // ⚠️ XATO HOLATI MAJBURIY. Busiz so‘rov yiqilganda sahifa BO‘SH
  // ro‘yxat ko‘rsatardi — foydalanuvchi «ma’lumot yo‘q» deb o‘ylab,
  // aslida tarmoq uzilganini bilmay qolardi.
  if (isError)
    return (
      <Card>
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Card>
    );

  const distribution = (data?.distribution ?? []).map((item) => ({
    name: RISK_META[item.level].label,
    value: item.count,
    percent: item.percent,
    color: RISK_META[item.level].hex,
  }));

  return (
    <>
      <PageHeader
        title="AI tahlil"
        description={
          data?.lastRunAt
            ? `Oxirgi tahlil: ${formatDateTimeUz(data.lastRunAt)} · ${formatCount(data.analyzedObjects)} ta obyekt`
            : 'Obyektlar bo‘yicha risk va prognoz tahlili'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* ⚠️ Tanlab tahlil qilish HAMMAGA ochiq (obyektni ko‘rish
                huquqi yetarli), «Hammasini» esa faqat `settings.manage` ga:
                birinchisi bir nechta qatorni yangilaydi, ikkinchisi butun
                bazani aylanadi va tasodifan bosilmasligi kerak. */}
            <Button
              variant="secondary"
              onClick={() => setPickerOpen(true)}
              leftIcon={<ListChecks className="size-4" />}
            >
              Tanlab tahlil qilish
            </Button>
            {can('settings.manage') ? (
              <Button loading={running} onClick={runAnalysis} leftIcon={<Play className="size-4" />}>
                Hammasini tahlil qilish
              </Button>
            ) : null}
          </div>
        }
      />

      {/* ⚠️ Metodologiya YASHIRILMAYDI: hokim ko‘rayotgan ballning qaerdan
          kelgani tushuntirilishi kerak, aks holda qarorga asos bo‘lolmaydi. */}
      <div className="mb-4 flex items-start gap-2.5 rounded-xl bg-brand-50 p-3.5 text-meta text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p className="leading-relaxed">
          Tahlil <strong>shaffof qoidalar dvigateli</strong> (<code className="rounded bg-white/60 px-1 dark:bg-white/10">rule-engine-v1</code>) tomonidan
          bajariladi: kechikish prognozi joriy sur’atdan, risk bahosi esa kechikish, rejadan ortda qolish,
          ochiq muammolar va hisobot muntazamligidan hisoblanadi. Har bir xulosa o‘z kirish ma’lumotlari
          bilan birga saqlanadi — obyekt kartasidagi «AI tahlil» bo‘limida ko‘rish mumkin.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Risk darajalari" subtitle="Oxirgi tahlil natijasi bo‘yicha" />
          <CardBody>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius="56%" outerRadius="90%" paddingAngle={2} stroke="none">
                    {distribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1.5">
              {distribution.map((item) => (
                <li key={item.name} className="flex items-center gap-2 text-meta">
                  <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 text-muted">{item.name}</span>
                  <span className="num font-semibold text-strong">{item.value}</span>
                  <span className="num w-11 text-right text-muted">{formatPercent(item.percent)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader title="Eng yuqori riskli obyektlar" subtitle="Ball 0–100, yuqori ball — ko‘proq e’tibor talab qiladi" />
          <CardBody>
            {(data?.topRisks ?? []).length === 0 ? (
              <EmptyState title="Tahlil natijasi yo‘q" icon={<Sparkles className="size-5" />} />
            ) : (
              <ul className="divide-y divide-[color:var(--border-subtle)]">
                {data?.topRisks.map((risk) => {
                  const meta = RISK_META[risk.riskLevel];
                  return (
                    <li key={risk.objectId} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <Link to={`/objects/${risk.objectId}`} className="block truncate text-ui font-medium text-strong hover:text-brand-600">
                            {risk.objectName}
                          </Link>
                          <p className="truncate text-micro text-muted">{risk.districtName}</p>
                        </div>
                        <Badge className={meta.chip}>{meta.label} · {risk.score}</Badge>
                      </div>
                      <ProgressBar value={risk.score} tone={meta.bar} size="xs" className="mt-1.5" />
                      <p className="mt-1.5 line-clamp-2 text-meta text-muted">{risk.summary}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {(data?.commonRecommendations ?? []).length > 0 ? (
        <Card className="mt-4">
          <CardHeader title="Eng ko‘p takrorlangan tavsiyalar" subtitle="Oxirgi 7 kun ichidagi tahlillar bo‘yicha" />
          <CardBody>
            <ul className="space-y-2">
              {data?.commonRecommendations.map((item) => (
                <li key={item.text} className="flex items-start gap-2.5 rounded-lg surface-muted p-2.5">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn-500" />
                  <span className="flex-1 text-meta text-strong">{item.text}</span>
                  <Badge className="surface text-muted">{item.count} ta obyekt</Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <AnalyzeObjectsModal open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
