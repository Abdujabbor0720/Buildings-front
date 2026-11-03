import { Building, Plus, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContractors } from '@/shared/api/queries';
import { CONTRACTOR_STATUS_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { getErrorMessage } from '@/shared/api/client';
import {
  Badge, Button, Card, ErrorState, LoadingBlock, PageHeader, Pagination, SearchInput, Select, StatPills,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCount } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { ContractorFormModal } from './components/ContractorFormModal';

export default function ContractorsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const can = useAuthStore((state) => state.can);

  const params = useMemo(
    () => ({
      page,
      limit,
      sortBy: 'rating',
      sortOrder: 'DESC' as const,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status ? { status } : {}),
    }),
    [page, limit, debouncedSearch, status],
  );

  const { data, isLoading, isError, error, refetch } = useContractors(params);

  return (
    <>
      <PageHeader
        title="Pudratchilar"
        description="Reyting obyektlar muddatida topshirilishidan avtomatik hisoblanadi"
        stats={data ? <StatPills items={[{ label: 'Jami pudratchilar', value: formatCount(data.meta.total) }]} /> : null}
        actions={
          can('contractors.manage') ? (
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="size-4" />}>
              Yangi pudratchi
            </Button>
          ) : null
        }
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle p-3 sm:p-4">
          <SearchInput
            value={search}
            onValueChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Nomi, STIR yoki rahbar…"
            className="min-w-[220px] flex-1"
          />
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            placeholder="Barcha holatlar"
            options={Object.entries(CONTRACTOR_STATUS_META).map(([value, meta]) => ({ value, label: meta.label }))}
            className="w-auto min-w-[160px]"
          />
        </div>

        <div className="p-3 sm:p-4">
          {/* ⚠️ XATO HOLATI MAJBURIY. Busiz so‘rov yiqilganda bu yerda
              BO‘SH ro‘yxat ko‘rinardi — foydalanuvchi «ma’lumot yo‘q»
              deb o‘ylab, aslida tarmoq uzilganini bilmay qolardi. */}
          {isLoading ? (
            <LoadingBlock />
          ) : isError ? (
            <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
          ) : (
            <>
              <TableWrap>
                <Table>
                  <THead>
                    <Tr>
                      <Th>Tashkilot</Th>
                      <Th className="w-32">STIR</Th>
                      <Th className="w-44">Rahbar</Th>
                      <Th align="right" className="w-24">Obyektlar</Th>
                      <Th className="w-32">Reyting</Th>
                      <Th className="w-40">Litsenziya</Th>
                      <Th className="w-36">Holati</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {data?.items.length === 0 ? (
                      <TableEmpty colSpan={7}>Pudratchi topilmadi</TableEmpty>
                    ) : (
                      data?.items.map((contractor) => {
                        const meta = CONTRACTOR_STATUS_META[contractor.status];
                        return (
                          <Tr key={contractor.id} onClick={() => navigate(`/contractors/${contractor.id}`)}>
                            <Td className="max-w-[300px]">
                              <span className="flex items-center gap-2">
                                <span className="grid size-7 shrink-0 place-items-center rounded-lg surface-muted text-muted">
                                  <Building className="size-3.5" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block truncate font-medium text-strong">{contractor.name}</span>
                                  {contractor.address ? (
                                    <span className="block truncate text-micro text-muted">{contractor.address}</span>
                                  ) : null}
                                </span>
                              </span>
                            </Td>
                            <Td muted className="mono text-meta">{contractor.inn}</Td>
                            <Td muted className="truncate text-meta">{contractor.director ?? '—'}</Td>
                            <Td align="right" className="num font-semibold">{contractor.objectCount ?? 0}</Td>
                            <Td><RatingStars value={contractor.rating} /></Td>
                            <Td muted className="num text-meta whitespace-nowrap">
                              {contractor.licenseExpiry ? formatDateUz(contractor.licenseExpiry) : '—'}
                            </Td>
                            <Td><Badge className={meta.chip} dot={meta.dot}>{meta.label}</Badge></Td>
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

      <ContractorFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}

export function RatingStars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className="inline-flex items-center gap-1" title={`${value.toFixed(2)} / 5`}>
      <span className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size === 'sm' ? 'size-3' : 'size-4',
              star <= rounded ? 'fill-warn-500 text-warn-500' : 'text-neutral-300 dark:text-neutral-600',
            )}
          />
        ))}
      </span>
      <span className={cn('num font-semibold text-strong', size === 'sm' ? 'text-micro' : 'text-ui')}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}
