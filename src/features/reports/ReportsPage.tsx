import { FileSpreadsheet } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { apiDownload, getErrorMessage } from '@/shared/api/client';
import { useProgressTimeline, useReportSummary } from '@/shared/api/queries';
import { CATEGORICAL_REST_HEX, HEALTH_META, STATUS_META } from '@/shared/constants/health';
import { Button, Card, CardBody, CardHeader, LoadingBlock, PageHeader } from '@/shared/ui';
import { formatCompact, formatCount } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';
import { CHART_CURSOR_FILL, CHART_TOOLTIP_STYLE, useChartColors } from '@/shared/hooks/useChartColors';

const EXPORTS = [
  { key: 'objects', label: 'Obyektlar ro‘yxati', file: 'obyektlar.xlsx' },
  { key: 'districts', label: 'Tumanlar kesimi', file: 'tumanlar-kesimida.xlsx' },
  { key: 'delays', label: 'Kechikishlar', file: 'kechikishlar.xlsx' },
] as const;

export default function ReportsPage() {
  const { seriesHex, statusHex } = useChartColors();
  const { regionId } = useFiltersStore();
  const can = useAuthStore((state) => state.can);
  const [downloading, setDownloading] = useState<string | null>(null);

  const summary = useReportSummary(regionId ?? undefined);
  const timeline = useProgressTimeline({ months: 12, ...(regionId ? { regionId } : {}) });

  async function onExport(key: string, file: string) {
    setDownloading(key);
    try {
      await apiDownload(`/reports/export/${key}${regionId ? `?regionId=${regionId}` : ''}`, file);
      toast.success('Excel fayli yuklab olindi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(null);
    }
  }

  if (summary.isLoading) return <LoadingBlock className="min-h-[50vh]" />;

  const statusData = (summary.data?.byStatus ?? []).map((item) => ({
    name: item.label,
    value: item.count,
    cost: Number(item.totalCost),
    color: STATUS_META[item.status as keyof typeof STATUS_META]
      ? statusHex(STATUS_META[item.status as keyof typeof STATUS_META])
      : CATEGORICAL_REST_HEX,
  }));

  const districtChart = (summary.data?.byDistrict ?? [])
    .slice()
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map((row) => ({
      name: row.shortName,
      'Reja asosida': row.onSchedule,
      Kechikayotgan: row.delayed,
      Xavfli: row.atRisk,
    }));

  return (
    <>
      <PageHeader
        title="Hisobotlar"
        description="Umumiy ko‘rsatkichlar, dinamika va Excel eksportlari"
      />

      <div className="space-y-4">
        {can('reports.export') ? (
          <Card>
            <CardHeader title="Excel hisobotlari" subtitle="Tanlangan viloyat va filtrlar bo‘yicha" />
            <CardBody className="flex flex-wrap gap-2">
              {EXPORTS.map((item) => (
                <Button
                  key={item.key}
                  variant="secondary"
                  loading={downloading === item.key}
                  onClick={() => onExport(item.key, item.file)}
                  leftIcon={<FileSpreadsheet className="size-4" />}
                >
                  {item.label}
                </Button>
              ))}
            </CardBody>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Bajarilish dinamikasi" subtitle="Oxirgi 12 oy, o‘rtacha bajarilish foizi" />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline.data ?? []} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={seriesHex(0)} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={seriesHex(0)} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={42} unit="%" />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="avgProgress" name="O‘rtacha bajarilish" stroke={seriesHex(0)} strokeWidth={2} fill="url(#timelineFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Status bo‘yicha" />
            <CardBody>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="88%" paddingAngle={2} stroke="none">
                      {statusData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {statusData.map((item) => (
                  <li key={item.name} className="flex items-center gap-2 text-meta">
                    <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 truncate text-muted">{item.name}</span>
                    <span className="num font-semibold text-strong">{formatCount(item.value)}</span>
                    <span className="num w-16 text-right text-muted">{formatCompact(item.cost)}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Tumanlar bo‘yicha holat" subtitle="Eng ko‘p obyektli 10 ta tuman" />
          <CardBody>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={districtChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip cursor={{ fill: CHART_CURSOR_FILL }} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {/* ⚠️ `stroke` — yuza rangidagi 2px oraliq. Busiz taxlangan
                      bo‘laklar bir-biriga quyilib ketadi va qo‘shni ranglar
                      (yashil ↔ sariq) chegarasi ko‘rinmay qoladi. */}
                  <Bar dataKey="Reja asosida" stackId="a" fill={statusHex(HEALTH_META.on_schedule)} stroke="var(--surface)" strokeWidth={2} maxBarSize={40} />
                  <Bar dataKey="Kechikayotgan" stackId="a" fill={statusHex(HEALTH_META.delayed)} stroke="var(--surface)" strokeWidth={2} maxBarSize={40} />
                  <Bar dataKey="Xavfli" stackId="a" fill={statusHex(HEALTH_META.at_risk)} stroke="var(--surface)" strokeWidth={2} radius={[5, 5, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
