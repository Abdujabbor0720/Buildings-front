import { CHART_CURSOR_FILL, CHART_TOOLTIP_STYLE, useChartColors } from '@/shared/hooks/useChartColors';
import { Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { apiDownload, getErrorMessage } from '@/shared/api/client';
import { useDistrictStats } from '@/shared/api/queries';
import {
  Button, Card, CardBody, CardHeader, LoadingBlock, PageHeader, ProgressBar,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr, ErrorState} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';

type SortKey = 'total' | 'onSchedule' | 'delayed' | 'atRisk' | 'avgProgress' | 'totalCost';

export default function DistrictsPage() {
  const { seriesHex } = useChartColors();
  const { regionId, yearFrom, yearTo } = useFiltersStore();
  const navigate = useNavigate();
  const can = useAuthStore((state) => state.can);
  const [sortKey, setSortKey] = useState<SortKey>('total');
  const [exporting, setExporting] = useState(false);

  const params = useMemo(() => ({ ...(regionId ? { regionId } : {}), yearFrom, yearTo }), [regionId, yearFrom, yearTo]);
  const { data, isLoading, isError, error, refetch } = useDistrictStats(params);

  const rows = useMemo(() => {
    const list = data ?? [];
    return [...list].sort((a, b) =>
      sortKey === 'totalCost' ? Number(b.totalCost) - Number(a.totalCost) : Number(b[sortKey]) - Number(a[sortKey]),
    );
  }, [data, sortKey]);

  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      onSchedule: acc.onSchedule + row.onSchedule,
      delayed: acc.delayed + row.delayed,
      atRisk: acc.atRisk + row.atRisk,
      cost: acc.cost + Number(row.totalCost),
    }),
    { total: 0, onSchedule: 0, delayed: 0, atRisk: 0, cost: 0 },
  );

  const chartData = rows.slice(0, 12).map((row) => ({
    name: row.shortName,
    Jami: row.total,
    Bajarilish: row.avgProgress,
  }));

  async function onExport() {
    setExporting(true);
    try {
      await apiDownload(`/reports/export/districts${regionId ? `?regionId=${regionId}` : ''}`, 'tumanlar-kesimida.xlsx');
      toast.success('Excel fayli yuklab olindi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setExporting(false);
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

  return (
    <>
      <PageHeader
        title="Tumanlar kesimida"
        description={`${rows.length} ta tuman · ${formatCount(totals.total)} ta obyekt`}
        actions={
          can('reports.export') ? (
            <Button variant="secondary" loading={exporting} onClick={onExport} leftIcon={<Download className="size-4" />}>
              Excel
            </Button>
          ) : null
        }
      />

      <div className="space-y-4">
        <Card>
          <CardHeader title="Tumanlar bo‘yicha obyektlar soni" subtitle="Eng ko‘p obyektli 12 ta tuman" />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={54} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: CHART_CURSOR_FILL }}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Bar dataKey="Jami" radius={[5, 5, 0, 0]} maxBarSize={38}>
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={seriesHex(0)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card flush>
          <div className="px-3.5 pt-3.5">
            <CardHeader title="Batafsil jadval" subtitle="Ustun sarlavhasini bosib saralang" />
          </div>
          <CardBody className="px-3.5 pb-3.5">
            <TableWrap>
              <Table>
                <THead>
                  <Tr>
                    <Th className="w-9">#</Th>
                    <Th>Tuman nomi</Th>
                    <Th align="right" sortKey="total" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Jami</Th>
                    <Th align="right" sortKey="onSchedule" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Reja asosida</Th>
                    <Th align="right" sortKey="delayed" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Kechikayotgan</Th>
                    <Th align="right" sortKey="atRisk" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Xavfli</Th>
                    <Th align="right">Boshlanmagan</Th>
                    <Th className="w-[150px]" sortKey="avgProgress" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Bajarilish</Th>
                    <Th align="right" sortKey="totalCost" activeSort={{ by: sortKey, order: 'DESC' }} onSort={(key) => setSortKey(key as SortKey)}>Qiymati</Th>
                  </Tr>
                </THead>
                <TBody>
                  {rows.length === 0 ? (
                    <TableEmpty colSpan={9} />
                  ) : (
                    <>
                      {rows.map((row, index) => (
                        <Tr key={row.districtId} onClick={() => navigate(`/objects?districtIds=${row.districtId}`)}>
                          <Td muted className="num text-micro">{index + 1}</Td>
                          <Td className="font-medium whitespace-nowrap">{row.name}</Td>
                          <Td align="right" className="num font-semibold">{row.total}</Td>
                          {/* ⚠️ NOL qiymat XIRA. Ko‘z bu jadvalda noldan
                              FARQLI raqamlarni qidiradi; «0» ham to‘q
                              rangda bo‘lsa, u ham muammo bordek
                              ko‘rinadi. Bosh sahifadagi tumanlar
                              kartasi bilan AYNI qoida. */}
                          <Count value={row.onSchedule} tone="text-ok-600 dark:text-ok-500" />
                          <Count value={row.delayed} tone="text-warn-600 dark:text-warn-500" />
                          <Count value={row.atRisk} tone="text-danger-600 dark:text-danger-500" />
                          <Count value={row.notStarted} tone="text-muted" />
                          <Td>
                            {/* ⚠️ Rang HOLATDAN olinmaydi. Ilgari chiziq uzunligi bajarilishni,
                                rangi esa tumanning ustun holatini bildirardi — natijada bir
                                ekranda ikkita 65% ikki xil rangda turib, «nega?» degan
                                javobsiz savol tug‘ilardi. Holat baribir yondagi uchta
                                ustunda SON bilan ko‘rsatilgan. */}
                            <ProgressBar value={row.avgProgress} showValue size="xs" />
                          </Td>
                          <Td align="right" className="num whitespace-nowrap">{formatCompact(row.totalCost)}</Td>
                        </Tr>
                      ))}
                      <Tr className="font-semibold">
                        <Td />
                        <Td>JAMI</Td>
                        <Td align="right" className="num">{totals.total}</Td>
                        <Td align="right" className="num text-ok-600 dark:text-ok-500">{totals.onSchedule}</Td>
                        <Td align="right" className="num text-warn-600 dark:text-warn-500">{totals.delayed}</Td>
                        <Td align="right" className="num text-danger-600 dark:text-danger-500">{totals.atRisk}</Td>
                        <Td />
                        <Td className="num text-meta text-muted">
                          {formatPercent(totals.total > 0 ? rows.reduce((s, r) => s + r.avgProgress * r.total, 0) / totals.total : 0)}
                        </Td>
                        <Td align="right" className="num whitespace-nowrap">{formatCompact(totals.cost)}</Td>
                      </Tr>
                    </>
                  )}
                </TBody>
              </Table>
            </TableWrap>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

/** Sanoq katagi: noldan farqli qiymat RANGLI, nol esa xira. */
function Count({ value, tone }: { value: number; tone: string }) {
  return (
    <Td align="right" className={cn('num', value > 0 ? tone : 'text-faint')}>
      {value}
    </Td>
  );
}
