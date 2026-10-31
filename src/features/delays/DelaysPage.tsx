import { CheckCircle2, Download } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import { apiDownload, getErrorMessage } from '@/shared/api/client';
import { useCatalogs, useDelayBreakdown, useDelays, useDistricts, useResolveDelay } from '@/shared/api/queries';
import type { ObjectDelay } from '@/shared/api/types';
import { DELAY_STATUS_META, RISK_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Badge, Button, Card, CardBody, CardHeader, ErrorState, Modal, PageHeader, Pagination,
  SearchInput, Select, StatPills, Table, TableEmpty, TableWrap, TBody, Td, Textarea, Th, THead, Tr,
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCount, formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';
import { DelayReasons } from '@/features/dashboard/components/DelayReasons';

const STATUS_OPTIONS = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'open', label: 'Ochiq' },
  { value: 'mitigating', label: 'Bartaraf etilmoqda' },
  { value: 'resolved', label: 'Hal qilingan' },
];

export default function DelaysPage() {
  const [searchParams] = useSearchParams();
  const { regionId } = useFiltersStore();
  const can = useAuthStore((state) => state.can);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('open');
  const [reasonId, setReasonId] = useState(searchParams.get('reasonId') ?? '');
  const [districtId, setDistrictId] = useState('');
  const [resolving, setResolving] = useState<ObjectDelay | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: catalogs } = useCatalogs();
  const { data: districts } = useDistricts(regionId ?? undefined);
  const breakdown = useDelayBreakdown({ ...(regionId ? { regionId } : {}), onlyOpen: true });

  const params = useMemo(
    () => ({
      page,
      limit,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status ? { status } : {}),
      ...(reasonId ? { reasonId } : {}),
      ...(districtId ? { districtId } : {}),
    }),
    [page, limit, debouncedSearch, status, reasonId, districtId],
  );

  const { data, isError, error, refetch, isLoading } = useDelays(params);

  const openCount = breakdown.data?.reduce((sum, item) => sum + item.count, 0) ?? 0;
  const affected = breakdown.data?.reduce((sum, item) => sum + item.affectedObjects, 0) ?? 0;

  async function onExport() {
    setExporting(true);
    try {
      await apiDownload(`/reports/export/delays${regionId ? `?regionId=${regionId}` : ''}`, 'kechikishlar.xlsx');
      toast.success('Excel fayli yuklab olindi');
    } catch (cause) {
      toast.error(getErrorMessage(cause));
    } finally {
      setExporting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Kechikishlar va risklar"
        description="Obyektlardagi ochiq muammolar va ularning sabablari"
        stats={
          <StatPills
            items={[
              { label: 'Ochiq yozuvlar', value: formatCount(openCount), tone: 'text-danger-600 dark:text-danger-500' },
              { label: 'Ta’sirlangan obyektlar', value: formatCount(affected) },
            ]}
          />
        }
        actions={
          can('reports.export') ? (
            <Button variant="secondary" loading={exporting} onClick={onExport} leftIcon={<Download className="size-4" />}>
              Excel
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-3">
          <CardHeader title="Sabablar kesimi" subtitle="Faqat ochiq yozuvlar" />
          <CardBody>
            {breakdown.data ? <DelayReasons items={breakdown.data} /> : null}
          </CardBody>
        </Card>

        <Card flush className="xl:col-span-9">
          <div className="flex flex-wrap items-center gap-2 border-b border-subtle p-3 sm:p-4">
            <SearchInput
              value={search}
              onValueChange={(value) => { setSearch(value); setPage(1); }}
              placeholder="Obyekt nomi yoki izoh bo‘yicha…"
              className="min-w-[180px] flex-1"
            />
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} options={STATUS_OPTIONS} className="w-auto min-w-[150px]" />
            <Select
              value={reasonId}
              onChange={(e) => { setReasonId(e.target.value); setPage(1); }}
              placeholder="Barcha sabablar"
              options={(catalogs?.delayReasons ?? []).map((reason) => ({ value: reason.id, label: reason.name }))}
              className="w-auto min-w-[180px]"
            />
            <Select
              value={districtId}
              onChange={(e) => { setDistrictId(e.target.value); setPage(1); }}
              placeholder="Barcha tumanlar"
              options={(districts ?? []).map((district) => ({ value: district.id, label: district.name }))}
              className="w-auto min-w-[150px]"
            />
          </div>

          <div className="p-3 sm:p-4">
            {isError ? (
              <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
            ) : (
              <>
                <TableWrap>
                  <Table>
                    <THead>
                      <Tr>
                        <Th>Obyekt</Th>
                        <Th className="w-40">Sabab</Th>
                        <Th align="right" className="w-16">Kunlar</Th>
                        <Th className="w-24">Jiddiylik</Th>
                        <Th className="w-32">Aniqlangan</Th>
                        <Th className="w-28">Holati</Th>
                      </Tr>
                    </THead>
                    <TBody>
                      {isLoading ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <Tr key={index}><Td colSpan={6}><div className="skeleton h-6 rounded" /></Td></Tr>
                        ))
                      ) : data?.items.length === 0 ? (
                        <TableEmpty colSpan={6}>Filtrga mos kechikish topilmadi</TableEmpty>
                      ) : (
                        data?.items.map((delay) => {
                          const statusMeta = DELAY_STATUS_META[delay.status];
                          const severity = RISK_META[delay.severity];
                          return (
                            <Tr key={delay.id}>
                              <Td className="max-w-[260px]">
                                <Link to={`/objects/${delay.objectId}`} className="block truncate font-medium text-strong hover:text-brand-600">
                                  {delay.object?.name ?? '—'}
                                </Link>
                                <span className="block truncate text-micro text-muted">
                                  {delay.object?.district?.shortName ?? '—'}
                                </span>
                              </Td>
                              <Td>
                                <span className="flex items-center gap-1.5">
                                  <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: delay.reason?.color }} />
                                  <span className="truncate text-meta">{delay.reason?.name}</span>
                                </span>
                              </Td>
                              <Td align="right" className="num font-semibold">{delay.delayDays}</Td>
                              <Td><Badge className={severity.chip}>{severity.label}</Badge></Td>
                              <Td className="tabular whitespace-nowrap">{formatDateUz(delay.detectedAt)}</Td>
                              <Td>
                                <div className="flex items-center gap-1.5">
                                  <Badge className={statusMeta.chip} dot={statusMeta.dot}>{statusMeta.label}</Badge>
                                  {delay.status !== 'resolved' && can('delays.manage') ? (
                                    <button
                                      type="button"
                                      onClick={() => setResolving(delay)}
                                      aria-label="Hal qilindi deb belgilash"
                                      className="grid size-6 place-items-center rounded-md text-muted transition-colors hover:bg-ok-50 hover:text-ok-600 dark:hover:bg-ok-500/10"
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </Td>
                            </Tr>
                          );
                        })
                      )}
                    </TBody>
                  </Table>
                </TableWrap>

                <Pagination meta={data?.meta} onPageChange={setPage} onLimitChange={(value) => { setLimit(value); setPage(1); }} />
              </>
            )}
          </div>
        </Card>
      </div>

      <ResolveModal delay={resolving} onClose={() => setResolving(null)} />
    </>
  );
}

function ResolveModal({ delay, onClose }: { delay: ObjectDelay | null; onClose: () => void }) {
  const mutation = useResolveDelay();
  const [resolution, setResolution] = useState('');

  async function onSubmit() {
    if (!delay) return;
    try {
      await mutation.mutateAsync({ id: delay.id, resolution: resolution.trim() });
      toast.success('Muammo hal qilindi deb belgilandi');
      setResolution('');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={Boolean(delay)}
      onClose={onClose}
      title="Muammoni yopish"
      description={delay?.object?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={onSubmit} loading={mutation.isPending} disabled={resolution.trim().length < 5}>Hal qilindi</Button>
        </>
      }
    >
      <Textarea
        label="Qanday hal qilindi?"
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        required
        hint="Izoh majburiy — muammo qanday yopilgani tarixda qolishi kerak"
      />
      {delay ? (
        <p className="mt-3 text-meta text-muted">
          Sabab: <span className="font-medium text-strong">{delay.reason?.name}</span> ·
          Kechikish: <span className="num font-medium text-strong">{delay.delayDays} kun</span> ·
          Ulush: {formatPercent((delay.delayDays / Math.max(1, delay.delayDays)) * 100, 0)}
        </p>
      ) : null}
    </Modal>
  );
}
