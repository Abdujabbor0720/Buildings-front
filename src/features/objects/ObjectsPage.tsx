import { Download, Filter, Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiDownload, getErrorMessage } from '@/shared/api/client';
import { useCatalogs, useDistricts, useObjects } from '@/shared/api/queries';
import type { ObjectHealth } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Badge, Button, Card, ErrorState, PageHeader, Pagination, ProgressBar, SearchInput, Select,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr,
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCompact, formatCount } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';

const HEALTH_OPTIONS: Array<{ value: ObjectHealth | ''; label: string }> = [
  { value: '', label: 'Barcha holatlar' },
  { value: 'on_schedule', label: 'Reja asosida' },
  { value: 'delayed', label: 'Kechikayotgan' },
  { value: 'at_risk', label: 'Xavfli holatda' },
  { value: 'not_started', label: 'Boshlanmagan' },
  { value: 'completed', label: 'Topshirilgan' },
];

const SORT_OPTIONS = [
  { value: 'updatedAt', label: 'Oxirgi o‘zgarish' },
  { value: 'name', label: 'Nomi' },
  { value: 'plannedEndDate', label: 'Reja muddati' },
  { value: 'progressPercent', label: 'Bajarilish' },
  { value: 'delayDays', label: 'Kechikish' },
  { value: 'totalCost', label: 'Qiymati' },
];

export default function ObjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const can = useAuthStore((state) => state.can);
  const { regionId, yearFrom, yearTo } = useFiltersStore();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(search, 350);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [health, setHealth] = useState<string>(searchParams.get('health') ?? '');
  const [districtId, setDistrictId] = useState(searchParams.get('districtIds') ?? '');
  const [typeId, setTypeId] = useState(searchParams.get('typeIds') ?? '');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [exporting, setExporting] = useState(false);

  const { data: catalogs } = useCatalogs();
  const { data: districts } = useDistricts(regionId ?? undefined);

  const dueWithinDays = searchParams.get('dueWithinDays');

  const params = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(health ? { health } : {}),
      ...(districtId ? { districtIds: districtId } : {}),
      ...(typeId ? { typeIds: typeId } : {}),
      ...(regionId ? { regionId } : {}),
      ...(dueWithinDays ? { dueWithinDays: Number(dueWithinDays) } : { yearFrom, yearTo }),
    }),
    [page, limit, sortBy, sortOrder, debouncedSearch, health, districtId, typeId, regionId, yearFrom, yearTo, dueWithinDays],
  );

  const { data, isLoading, isError, error, refetch } = useObjects(params);

  const hasFilters = Boolean(search || health || districtId || typeId || dueWithinDays);

  function resetFilters() {
    setSearch('');
    setHealth('');
    setDistrictId('');
    setTypeId('');
    setPage(1);
    setSearchParams({});
  }

  function toggleSort(key: string) {
    if (sortBy === key) setSortOrder((order) => (order === 'ASC' ? 'DESC' : 'ASC'));
    else {
      setSortBy(key);
      setSortOrder('DESC');
    }
    setPage(1);
  }

  async function onExport() {
    setExporting(true);
    try {
      await apiDownload(`/reports/export/objects${regionId ? `?regionId=${regionId}` : ''}`, 'obyektlar.xlsx');
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
        title="Obyektlar ro‘yxati"
        description={
          data
            ? // ⚠️ «Topshirilganlar bilan» deb AYTILADI: bosh sahifadagi
              // ko‘rsatkich ularni sanamaydi va izohsiz ikki ekranda ikki
              // xil son ko‘ringan bo‘lardi.
              `${formatCount(data.meta.total)} ta obyekt — topshirilgan va bekor qilinganlar bilan birga`
            : 'Viloyatdagi barcha qurilish obyektlari'
        }
        actions={
          <>
            {can('reports.export') ? (
              <Button variant="secondary" loading={exporting} onClick={onExport} leftIcon={<Download className="size-4" />}>
                Excel
              </Button>
            ) : null}
            {can('objects.create') ? (
              <Button onClick={() => toast('Obyekt qo‘shish formasi — keyingi bosqichda', { icon: 'ℹ️' })} leftIcon={<Plus className="size-4" />}>
                Yangi obyekt
              </Button>
            ) : null}
          </>
        }
      />

      <Card flush>
        {/* ───── Filtrlar ───── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle p-3 sm:p-4">
          <SearchInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Nomi, kodi yoki manzili bo‘yicha…"
            className="min-w-[220px] flex-1"
          />

          <Select
            value={health}
            onChange={(event) => { setHealth(event.target.value); setPage(1); }}
            options={HEALTH_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            className="w-auto min-w-[150px]"
          />

          <Select
            value={districtId}
            onChange={(event) => { setDistrictId(event.target.value); setPage(1); }}
            placeholder="Barcha tumanlar"
            options={(districts ?? []).map((district) => ({ value: district.id, label: district.name }))}
            className="w-auto min-w-[160px]"
          />

          <Select
            value={typeId}
            onChange={(event) => { setTypeId(event.target.value); setPage(1); }}
            placeholder="Barcha turlar"
            options={(catalogs?.constructionTypes ?? []).map((type) => ({ value: type.id, label: type.name }))}
            className="w-auto min-w-[170px]"
          />

          <Select
            value={sortBy}
            onChange={(event) => { setSortBy(event.target.value); setPage(1); }}
            options={SORT_OPTIONS}
            className="w-auto min-w-[150px]"
          />

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={resetFilters} leftIcon={<X className="size-3.5" />}>
              Tozalash
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 text-meta text-muted">
              <Filter className="size-3.5" />
              Filtr yo‘q
            </span>
          )}
        </div>

        {/* ───── Jadval ───── */}
        <div className="p-3 sm:p-4">
          {isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          ) : (
            <>
              <TableWrap>
                <Table>
                  <THead>
                    <Tr>
                      <Th sortKey="code" activeSort={{ by: sortBy, order: sortOrder }} onSort={toggleSort} className="w-32">Kod</Th>
                      <Th sortKey="name" activeSort={{ by: sortBy, order: sortOrder }} onSort={toggleSort}>Obyekt nomi</Th>
                      <Th className="w-28">Tuman</Th>
                      <Th className="w-40">Turi</Th>
                      <Th sortKey="plannedEndDate" activeSort={{ by: sortBy, order: sortOrder }} onSort={toggleSort} className="w-36">Reja muddati</Th>
                      <Th sortKey="progressPercent" activeSort={{ by: sortBy, order: sortOrder }} onSort={toggleSort} className="w-[130px]">Bajarilish</Th>
                      <Th className="w-36">Holati</Th>
                      <Th sortKey="totalCost" activeSort={{ by: sortBy, order: sortOrder }} onSort={toggleSort} align="right" className="w-28">Qiymati</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {isLoading ? (
                      Array.from({ length: 8 }).map((_, index) => (
                        <Tr key={index}>
                          <Td colSpan={8}><div className="skeleton h-6 rounded" /></Td>
                        </Tr>
                      ))
                    ) : data?.items.length === 0 ? (
                      <TableEmpty colSpan={8}>
                        {hasFilters ? 'Filtrga mos obyekt topilmadi' : 'Obyektlar hali qo‘shilmagan'}
                      </TableEmpty>
                    ) : (
                      data?.items.map((object) => {
                        const meta = HEALTH_META[object.healthStatus];
                        return (
                          <Tr key={object.id} onClick={() => navigate(`/objects/${object.id}`)}>
                            <Td className="mono text-meta text-muted">{object.code}</Td>
                            <Td className="max-w-[320px]">
                              <span className="block truncate font-medium text-strong">{object.name}</span>
                              {object.contractor ? (
                                <span className="block truncate text-micro text-muted">{object.contractor.name}</span>
                              ) : null}
                            </Td>
                            <Td muted className="whitespace-nowrap">{object.district?.shortName ?? '—'}</Td>
                            <Td>
                              <span className="flex items-center gap-1.5">
                                <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: object.type?.color }} />
                                <span className="truncate text-meta text-muted">{object.type?.name}</span>
                              </span>
                            </Td>
                            <Td className="tabular whitespace-nowrap">{formatDateUz(object.plannedEndDate)}</Td>
                            <Td>
                              <ProgressBar value={object.progressPercent} target={object.expectedProgress} showValue size="xs" />
                            </Td>
                            <Td>
                              <Badge className={meta.chip} dot={meta.dot}>{meta.label}</Badge>
                              {/* ⚠️ «+21k» emas, «21 kun kechikdi»: «k» qisqartmasi
                                  mingni bildirib, 21 ming kun bo‘lib o‘qilardi. */}
                              {object.delayDays > 0 ? (
                                <span className="text-faint mt-0.5 block text-nano">
                                  <span className="num text-nano text-danger-600 dark:text-danger-400">
                                    {object.delayDays}
                                  </span>{' '}
                                  kun kechikdi
                                </span>
                              ) : null}
                            </Td>
                            <Td align="right" className="num whitespace-nowrap">{formatCompact(object.totalCost)}</Td>
                          </Tr>
                        );
                      })
                    )}
                  </TBody>
                </Table>
              </TableWrap>

              <Pagination
                meta={data?.meta}
                onPageChange={setPage}
                onLimitChange={(value) => { setLimit(value); setPage(1); }}
              />
            </>
          )}
        </div>
      </Card>
    </>
  );
}
