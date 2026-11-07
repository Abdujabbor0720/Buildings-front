import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/client';
import { useKpiMetricObjects } from '@/shared/api/queries';
import type { KpiMetricKey } from '@/shared/api/types';
import { HEALTH_META, RISK_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Badge,
  Card,
  CardHeader,
  ErrorState,
  Pagination,
  ProgressBar,
  SearchInput,
  Skeleton,
  Table,
  TableEmpty,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCompact, formatCount } from '@/shared/utils/money.utils';
import type { KpiMeta } from '../kpi.meta';

interface Props {
  metric: KpiMetricKey;
  meta: KpiMeta;
  /** Sarlavhadagi global filtr + sahifadagi tuman/tur tanlovi. */
  scopeParams: Record<string, unknown>;
  /** Filtr chiplari — jadval ustida ko‘rinadi. */
  chips?: ReactNode;
  /** Tuman yoki tur filtri yoqilganmi — sarlavha matni shunga qarab o‘zgaradi. */
  filtered?: boolean;
}

/**
 * KO‘RSATKICH ICHIDAGI OBYEKTLAR.
 *
 * ⚠️ Ro‘yxat `GET /dashboard/metrics/:metric/objects` dan keladi,
 * `GET /objects` dan EMAS. Ikkinchisi boshqa doirada ishlaydi
 * (topshirilganlar bilan, yil oralig‘i boshqacha) va jadvaldagi jami
 * son yuqoridagi katta raqamdan farq qilardi — aynan shu farq butun
 * sahifaga bo‘lgan ishonchni yo‘q qiladi.
 */
export function KpiObjectsTable({ metric, meta, scopeParams, chips, filtered }: Props) {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(meta.sort.by);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>(meta.sort.order);
  const debouncedSearch = useDebounce(search, 350);

  /*
   * ⚠️ Filtr o‘zgarganda sahifa BIRINCHIGA qaytadi — `useEffect`
   * bilan emas, render paytida. `useEffect` ishlaganda jadval bir
   * lahzaga ESKI sahifa raqami bilan so‘rov yuborib, «3-sahifa»
   * bo‘sh chiqardi (tanlangan tumanda bor-yo‘g‘i 12 ta obyekt bor).
   */
  const filterKey = JSON.stringify(scopeParams);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const params = {
    ...scopeParams,
    page,
    limit,
    sortBy,
    sortOrder,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  };

  const { data, isLoading, isError, error, refetch } = useKpiMetricObjects(metric, params);

  function toggleSort(key: string) {
    if (sortBy === key) {
      setSortOrder((order) => (order === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortBy(key);
      // Yangi ustunda sukut — KAMAYISH tartibi: raqamli ustunlarda
      // odam avval «eng kattasi» ni qidiradi.
      setSortOrder(key === 'name' || key === 'code' || key === 'district' ? 'ASC' : 'DESC');
    }
    setPage(1);
  }

  const activeSort = { by: sortBy, order: sortOrder };
  const showReason = metric === 'delayed' || metric === 'at-risk';

  return (
    <Card flush className="xl:col-span-12">
      <div className="px-3.5 pt-3.5">
        <CardHeader
          title="Obyektlar ro‘yxati"
          /*
            ⚠️ Jadval filtri yoqilganda «AYNI doirada» deb YOZILMAYDI:
            o‘sha paytda jadval yuqoridagi raqamdan kichikroq kesimni
            ko‘rsatadi va bu yozuv foydalanuvchini chalg‘itardi.
          */
          subtitle={
            !data
              ? 'Yuklanmoqda…'
              : filtered
                ? `${formatCount(data.meta.total)} ta obyekt — jadval filtri qo‘llangan`
                : `${formatCount(data.meta.total)} ta obyekt — yuqoridagi ko‘rsatkich bilan AYNI doirada`
          }
          action={
            <SearchInput
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Nomi, kodi yoki manzili…"
              className="w-[220px]"
            />
          }
        />
        {chips}
      </div>

      <div className="p-3.5">
        {isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
        ) : (
          <>
            <TableWrap>
              <Table>
                <THead>
                  <Tr>
                    {/* ⚠️ `whitespace-nowrap`: kod («AND-2026-0060») defis
                        bo‘yicha uch qatorga bo‘linib ketib, qatorni ikki
                        baravar balandlashtirardi. */}
                    <Th sortKey="code" activeSort={activeSort} onSort={toggleSort} className="w-[116px]">
                      Kod
                    </Th>
                    <Th sortKey="name" activeSort={activeSort} onSort={toggleSort}>
                      Obyekt nomi
                    </Th>
                    <Th sortKey="district" activeSort={activeSort} onSort={toggleSort} className="w-28">
                      Tuman
                    </Th>
                    <Th sortKey="type" activeSort={activeSort} onSort={toggleSort} className="w-36">
                      Turi
                    </Th>
                    <Th className="w-28">Mas’ul</Th>
                    <Th sortKey="plannedEndDate" activeSort={activeSort} onSort={toggleSort} className="w-36">
                      Reja muddati
                    </Th>
                    <Th sortKey="progressPercent" activeSort={activeSort} onSort={toggleSort} className="w-[130px]">
                      Bajarilish
                    </Th>
                    <Th sortKey="delayDays" activeSort={activeSort} onSort={toggleSort} className="w-36">
                      Holati
                    </Th>
                    <Th sortKey="riskScore" activeSort={activeSort} onSort={toggleSort} className="w-24">
                      Risk
                    </Th>
                    <Th sortKey="totalCost" activeSort={activeSort} onSort={toggleSort} align="right" className="w-28">
                      Qiymati
                    </Th>
                  </Tr>
                </THead>
                <TBody>
                  {isLoading ? (
                    Array.from({ length: 8 }).map((_, index) => (
                      <Tr key={index}>
                        <Td colSpan={10}>
                          <Skeleton className="h-6" />
                        </Td>
                      </Tr>
                    ))
                  ) : data && data.items.length === 0 ? (
                    <TableEmpty colSpan={10}>
                      {search.trim()
                        ? 'Qidiruvga mos obyekt topilmadi'
                        : 'Bu kesimda obyekt yo‘q'}
                    </TableEmpty>
                  ) : (
                    data?.items.map((object) => {
                      const health = HEALTH_META[object.healthStatus];
                      const risk = RISK_META[object.riskLevel];
                      return (
                        <Tr key={object.id} onClick={() => navigate(`/objects/${object.id}`)}>
                          <Td className="mono text-meta whitespace-nowrap text-muted">{object.code}</Td>
                          <Td className="max-w-[300px]">
                            <span className="block truncate font-medium text-strong" title={object.name}>
                              {object.name}
                            </span>
                            {/* ⚠️ Kechikish sahifalarida ikkinchi qatorda
                                SABAB turadi, pudratchi emas: «nega
                                kechikdi» degan savol aynan shu ekranda
                                beriladi. */}
                            {showReason ? (
                              <span className="block truncate text-micro text-muted">
                                {object.primaryReason ?? 'Sabab ko‘rsatilmagan'}
                              </span>
                            ) : object.contractorName ? (
                              <span className="block truncate text-micro text-muted">
                                {object.contractorName}
                              </span>
                            ) : null}
                          </Td>
                          <Td muted className="whitespace-nowrap">
                            {object.districtName}
                          </Td>
                          <Td>
                            <span className="flex items-center gap-1.5">
                              <span
                                className="size-2 shrink-0 rounded-[3px]"
                                style={{ backgroundColor: object.typeColor }}
                                aria-hidden
                              />
                              <span className="truncate text-meta text-muted" title={object.typeName}>
                                {object.typeName}
                              </span>
                            </span>
                          </Td>
                          <Td className="truncate whitespace-nowrap">
                            {object.responsibleName ? (
                              <span className="text-meta text-muted">{object.responsibleName}</span>
                            ) : (
                              /* ⚠️ «—» emas, OGOHLANTIRISH: mas'ulsiz
                                 obyekt ma'lumot to'liq emasligining eng
                                 qimmat ko'rinishi. */
                              <span className="text-micro text-warn-600 dark:text-warn-400">
                                biriktirilmagan
                              </span>
                            )}
                          </Td>
                          <Td className="tabular whitespace-nowrap">
                            <span className="block">{formatDateUz(object.plannedEndDate)}</span>
                            <span
                              className={cn(
                                'block text-nano',
                                object.daysLeft < 0
                                  ? 'text-danger-600 dark:text-danger-400'
                                  : object.daysLeft <= 30
                                    ? 'text-warn-600 dark:text-warn-400'
                                    : 'text-faint',
                              )}
                            >
                              {object.daysLeft < 0
                                ? `${formatCount(Math.abs(object.daysLeft))} kun o‘tdi`
                                : `${formatCount(object.daysLeft)} kun qoldi`}
                            </span>
                          </Td>
                          <Td>
                            <ProgressBar
                              value={object.progressPercent}
                              target={object.expectedProgress}
                              showValue
                              size="xs"
                            />
                          </Td>
                          <Td>
                            <Badge className={health.chip} dot={health.dot}>
                              {health.label}
                            </Badge>
                            {/* ⚠️ «+21k» emas, «21 kun kechikdi»: «k»
                                qisqartmasi mingni bildirib, 21 ming kun
                                bo‘lib o‘qilardi. */}
                            {object.delayDays > 0 ? (
                              <span className="text-faint mt-0.5 block text-nano">
                                <span className="num text-nano text-danger-600 dark:text-danger-400">
                                  {formatCount(object.delayDays)}
                                </span>{' '}
                                kun kechikdi
                              </span>
                            ) : null}
                          </Td>
                          <Td>
                            <Badge className={risk.chip} dot={risk.dot}>
                              {risk.label}
                            </Badge>
                            <span className="text-faint num mt-0.5 block text-nano">
                              {object.riskScore} / 100
                            </span>
                          </Td>
                          <Td align="right" className="num whitespace-nowrap">
                            {formatCompact(object.totalCost)}
                          </Td>
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
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          </>
        )}
      </div>
    </Card>
  );
}
