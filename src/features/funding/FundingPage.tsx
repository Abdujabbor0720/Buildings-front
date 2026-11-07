import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getErrorMessage } from '@/shared/api/client';
import { useFundingAllocations, useFundingSummary, useFundingTransactions } from '@/shared/api/queries';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  LoadingBlock,
  ObjectMetaLines,
  PageHeader,
  Pagination,
  ProgressBar,
  TBody,
  THead,
  Table,
  TableEmpty,
  TableWrap,
  Tabs,
  Td,
  Th,
  Tr,
  toObjectBrief,
  type TabOption,
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCompact, formatMoneyFull, formatPercent, toNumber } from '@/shared/utils/money.utils';
import { useFiltersStore } from '@/store/filters.store';
import { CHART_CURSOR_FILL, CHART_TOOLTIP_STYLE, useChartColors } from '@/shared/hooks/useChartColors';

type View = 'allocations' | 'transactions';

const VIEWS: ReadonlyArray<TabOption<View>> = [
  { value: 'allocations', label: 'Yillik rejalar' },
  { value: 'transactions', label: 'Harakatlar daftari' },
];

const TX_LABELS: Record<string, { label: string; chip: string }> = {
  allocation: { label: 'Ajratildi', chip: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' },
  payment: { label: 'To‘lov', chip: 'bg-ok-50 text-ok-700 dark:bg-ok-500/10 dark:text-ok-500' },
  adjustment: { label: 'Tuzatish', chip: 'bg-warn-50 text-warn-700 dark:bg-warn-500/10 dark:text-warn-500' },
};

export default function FundingPage() {
  // Reja ⊇ ajratilgan ⊇ to‘langan — bu TARTIBLI qator, turkum emas:
  // bitta rang oilasining pog‘onalari (to‘langan = eng to‘q, eng «haqiqiy»).
  //
  // ⚠️ BINAFSHA (`done` oilasi), ko‘k EMAS. Shu sahifada moliya
  // manbalari doirasi TURKUM palitrasida chiziladi va uning birinchi
  // rangi ko‘k; ustunlar ham ko‘k bo‘lsa, bir ekranda bitta rang ikki
  // xil ma’no anglatardi. Pog‘onalar yorqinlik bo‘yicha monoton
  // (ΔL ≈ 0.14) — bosma nusxada ham ajraladi.
  const { dark } = useChartColors();
  const fundingRamp = dark
    ? ['#7444b4', '#956ed2', '#b69be6']
    : ['#b69be6', '#9065d0', '#6b30af'];
  const { regionId } = useFiltersStore();
  const [view, setView] = useState<View>('allocations');
  const [page, setPage] = useState(1);

  const summaryParams = useMemo(() => ({ ...(regionId ? { regionId } : {}) }), [regionId]);
  const summary = useFundingSummary(summaryParams);

  const listParams = useMemo(() => ({ page, limit: 20 }), [page]);
  const allocations = useFundingAllocations(view === 'allocations' ? listParams : { page: 1, limit: 1 });
  const transactions = useFundingTransactions(view === 'transactions' ? listParams : { page: 1, limit: 1 });

  if (summary.isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  // ⚠️ XATO HOLATI MAJBURIY. Busiz so‘rov yiqilganda sahifa BO‘SH
  // ro‘yxat ko‘rsatardi — foydalanuvchi «ma’lumot yo‘q» deb o‘ylab,
  // aslida tarmoq uzilganini bilmay qolardi.
  if (summary.isError)
    return (
      <Card>
        <ErrorState
          message={getErrorMessage(summary.error)}
          onRetry={() => void summary.refetch()}
        />
      </Card>
    );
  const data = summary.data;

  const yearChart = (data?.byYear ?? []).map((item) => ({
    name: `${item.year}`,
    Rejada: toNumber(item.planned) / 1e9,
    Ajratilgan: toNumber(item.allocated) / 1e9,
    'To‘langan': toNumber(item.paid) / 1e9,
  }));

  const sourceChart = (data?.bySource ?? []).map((item) => ({
    name: item.name,
    value: toNumber(item.allocated),
    color: item.color,
  }));

  return (
    <>
      <PageHeader title="Moliyalashtirish" description="Yillik rejalar, ajratilgan mablag‘lar va to‘lovlar" />

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MoneyCard label="Loyihalar qiymati" value={formatMoneyFull(data?.totalCost ?? '0')} percent={100} tone="bg-brand-500" caption="100%" />
          <MoneyCard
            label="Ajratilgan"
            value={formatMoneyFull(data?.totalAllocated ?? '0')}
            percent={data?.allocationPercent ?? 0}
            tone="bg-ok-500"
            caption={`${formatPercent(data?.allocationPercent ?? 0)} qiymatdan`}
          />
          <MoneyCard
            label="To‘langan"
            value={formatMoneyFull(data?.totalPaid ?? '0')}
            percent={data?.paymentPercent ?? 0}
            tone="bg-warn-500"
            caption={`${formatPercent(data?.paymentPercent ?? 0)} ajratilgandan`}
          />
          <MoneyCard
            label="Ajratilishi kerak"
            value={formatMoneyFull(data?.remainingToAllocate ?? '0')}
            percent={100 - (data?.allocationPercent ?? 0)}
            tone="bg-danger-500"
            caption="Qolgan qism"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader title="Yillar bo‘yicha moliyalashtirish" subtitle="mlrd so‘m" />
            <CardBody>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearChart} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-neutral-200 dark:text-white/10" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                    <Tooltip
                      cursor={{ fill: CHART_CURSOR_FILL }}
                      formatter={(value) => [`${Number(value ?? 0).toFixed(1)} mlrd so‘m`, '']}
                      contentStyle={CHART_TOOLTIP_STYLE}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Rejada" fill={fundingRamp[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Ajratilgan" fill={fundingRamp[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="To‘langan" fill={fundingRamp[2]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Manbalar bo‘yicha" />
            <CardBody>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceChart} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="88%" paddingAngle={2} stroke="none">
                      {sourceChart.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${formatCompact(Number(value ?? 0))} so‘m`, '']}
                      contentStyle={CHART_TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-1.5">
                {(data?.bySource ?? []).map((item) => (
                  <li key={item.sourceId} className="flex items-center gap-2 text-meta">
                    <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.color }} />
                    <span className="flex-1 truncate text-muted">{item.name}</span>
                    <span className="num font-semibold text-strong">{formatCompact(item.allocated)}</span>
                    <span className="num w-10 text-right text-muted">{formatPercent(item.percent, 0)}</span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <Card flush>
          <div className="px-3.5 pt-3.5">
            <CardHeader
              title="Batafsil"
              action={<Tabs options={VIEWS} value={view} onChange={(value) => { setView(value); setPage(1); }} />}
            />
          </div>

          <CardBody className="px-3.5 pb-1">
            {view === 'allocations' ? (
              <>
                <TableWrap>
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Obyekt</Th>
                        <Th className="w-20">Yil</Th>
                        <Th className="w-44">Manba</Th>
                        <Th align="right" className="w-36">Rejada</Th>
                        <Th align="right" className="w-36">Ajratilgan</Th>
                        <Th align="right" className="w-36">To‘langan</Th>
                        <Th className="w-[120px]">Bajarilishi</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {allocations.isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <Tr key={index}><Td colSpan={7}><div className="skeleton h-6 rounded" /></Td></Tr>
                        ))
                      ) : allocations.data?.items.length === 0 ? (
                        <TableEmpty colSpan={7}>Yillik reja topilmadi</TableEmpty>
                      ) : (
                        allocations.data?.items.map((item) => {
                          const planned = toNumber(item.plannedAmount);
                          const allocated = toNumber(item.allocatedAmount);
                          return (
                            <Tr key={item.id}>
                              <Td className="max-w-[280px]">
                                <Link to={`/objects/${item.objectId}`} className="block truncate text-meta font-medium text-strong hover:text-brand-600">
                                  {item.object?.name ?? '—'}
                                </Link>
                                {/* ⚠️ Mablag‘ ajratilgan obyekt QAYERDA va
                                    uni kim nazorat qiladi — moliyaviy
                                    qarorda bu ikki savol doimo birga
                                    keladi. */}
                                <ObjectMetaLines brief={toObjectBrief(item.object)} />
                              </Td>
                              <Td className="num font-semibold">{item.year}</Td>
                              <Td>
                                <span className="flex items-center gap-1.5">
                                  <span className="size-2 rounded-[3px]" style={{ backgroundColor: item.source?.color }} />
                                  <span className="truncate text-meta">{item.source?.name}</span>
                                </span>
                              </Td>
                              <Td align="right" className="num">{formatCompact(item.plannedAmount)}</Td>
                              <Td align="right" className="num">{formatCompact(item.allocatedAmount)}</Td>
                              <Td align="right" className="num">{formatCompact(item.paidAmount)}</Td>
                              <Td><ProgressBar value={planned > 0 ? (allocated / planned) * 100 : 0} showValue size="xs" /></Td>
                            </Tr>
                          );
                        })
                      )}
                    </TBody>
                  </Table>
                </TableWrap>
                <Pagination meta={allocations.data?.meta} onPageChange={setPage} />
              </>
            ) : (
              <>
                <TableWrap>
                  <Table>
                    <THead>
                      <Tr>
                        <Th className="w-36">Sana</Th>
                        <Th>Obyekt</Th>
                        <Th className="w-32">Turi</Th>
                        <Th align="right" className="w-40">Summa</Th>
                        <Th className="w-32">Hujjat</Th>
                        <Th>Izoh</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {transactions.isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <Tr key={index}><Td colSpan={6}><div className="skeleton h-6 rounded" /></Td></Tr>
                        ))
                      ) : transactions.data?.items.length === 0 ? (
                        <TableEmpty colSpan={6}>Harakat topilmadi</TableEmpty>
                      ) : (
                        transactions.data?.items.map((tx) => {
                          const meta = TX_LABELS[tx.type] ?? TX_LABELS.adjustment;
                          return (
                            <Tr key={tx.id}>
                              <Td className="tabular whitespace-nowrap">{formatDateUz(tx.occurredAt)}</Td>
                              <Td className="max-w-[260px]">
                                <Link to={`/objects/${tx.objectId}`} className="block truncate text-meta hover:text-brand-600">
                                  {tx.object?.name ?? '—'}
                                </Link>
                                <ObjectMetaLines brief={toObjectBrief(tx.object)} />
                              </Td>
                              <Td><Badge className={meta.chip}>{meta.label}</Badge></Td>
                              <Td align="right" className="num font-medium">{formatMoneyFull(tx.amount)}</Td>
                              <Td muted className="mono text-meta">{tx.documentNumber ?? '—'}</Td>
                              <Td muted className="max-w-[240px]"><span className="block truncate">{tx.note ?? '—'}</span></Td>
                            </Tr>
                          );
                        })
                      )}
                    </TBody>
                  </Table>
                </TableWrap>
                <Pagination meta={transactions.data?.meta} onPageChange={setPage} />
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function MoneyCard({ label, value, percent, tone, caption }: { label: string; value: string; percent: number; tone: string; caption: string }) {
  return (
    <Card>
      <p className="text-meta text-muted">{label}</p>
      <p className="num mt-1 text-body font-bold text-strong">{value}</p>
      <ProgressBar value={percent} tone={tone} size="xs" className="mt-2.5" />
      <p className="mt-1 text-micro text-muted">{caption}</p>
    </Card>
  );
}
