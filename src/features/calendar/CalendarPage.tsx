import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCalendar, useDistricts } from '@/shared/api/queries';
import type { CalendarItem } from '@/shared/api/types';
import { MILESTONE_LABELS } from '@/shared/constants/health';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, LoadingBlock, PageHeader, ProgressBar, Select } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { MONTHS_UZ_CAP, WEEKDAYS_UZ_SHORT, formatDateUz, tashkentToday } from '@/shared/utils/date.utils';
import { useFiltersStore } from '@/store/filters.store';

/**
 * KALENDAR (ish rejasi).
 *
 * ⚠️ Bosqich kalendarda O‘Z DAVRI bo‘yicha ko‘rsatiladi: oy ichida
 * TUGAYDIGAN bosqichlar kunlar bo‘yicha joylashadi, oyni butunlay
 * qamragan uzoq bosqichlar esa pastdagi ro‘yxatda qoladi — aks holda
 * ular har kunda takrorlanib, kalendarni o‘qib bo‘lmas qilardi.
 */
export default function CalendarPage() {
  const today = tashkentToday();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth() + 1);
  const [districtId, setDistrictId] = useState('');

  const { regionId } = useFiltersStore();
  const { data: districts } = useDistricts(regionId ?? undefined);

  const params = useMemo(
    () => ({ year, month, ...(districtId ? { districtId } : {}) }),
    [year, month, districtId],
  );
  const { data, isLoading } = useCalendar(params);
  // ⚠️ `data ?? []` har renderda YANGI massiv yaratadi va pastdagi
  // `useMemo` bog‘liqligini har safar buzadi.
  const items = useMemo(() => data ?? [], [data]);

  const grid = useMemo(() => buildGrid(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = item.plannedEnd.slice(0, 10);
      const existing = map.get(key) ?? [];
      existing.push(item);
      map.set(key, existing);
    }
    return map;
  }, [items]);

  const ongoing = items.filter((item) => {
    const endMonth = Number(item.plannedEnd.slice(5, 7));
    const endYear = Number(item.plannedEnd.slice(0, 4));
    return !(endYear === year && endMonth === month);
  });

  function shift(delta: number) {
    const next = new Date(Date.UTC(year, month - 1 + delta, 1));
    setYear(next.getUTCFullYear());
    setMonth(next.getUTCMonth() + 1);
  }

  return (
    <>
      <PageHeader
        title="Kalendar (ish rejasi)"
        description="Obyekt bosqichlarining rejadagi tugash sanalari"
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={districtId}
              onChange={(event) => setDistrictId(event.target.value)}
              placeholder="Barcha tumanlar"
              options={(districts ?? []).map((district) => ({ value: district.id, label: district.name }))}
              className="w-auto min-w-[160px]"
            />
            <div className="inline-flex items-center gap-1 rounded-lg surface border border-subtle p-0.5">
              <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Oldingi oy">
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-[128px] text-center text-ui font-semibold text-strong">
                {MONTHS_UZ_CAP[month - 1]}, {year}
              </span>
              <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Keyingi oy">
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setYear(today.getUTCFullYear());
                setMonth(today.getUTCMonth() + 1);
              }}
            >
              Bugun
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingBlock className="min-h-[50vh]" />
      ) : (
        <div className="space-y-4">
          <Card flush>
            <div className="grid grid-cols-7 border-b border-subtle">
              {WEEKDAYS_UZ_SHORT.map((day) => (
                <div key={day} className="px-2 py-2 text-center text-micro font-semibold text-muted">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {grid.map((cell, index) => {
                const key = cell.date ? isoKey(cell.date) : `empty-${index}`;
                const dayItems = cell.date ? (byDay.get(isoKey(cell.date)) ?? []) : [];
                const isToday = cell.date ? isoKey(cell.date) === isoKey(today) : false;

                return (
                  <div
                    key={key}
                    className={cn(
                      'min-h-[112px] border-r border-b border-subtle p-1.5 last:border-r-0',
                      !cell.date && 'surface-muted',
                      isToday && 'bg-brand-50/60 dark:bg-brand-500/[0.07]',
                    )}
                  >
                    {cell.date ? (
                      <>
                        <span
                          className={cn(
                            'num inline-grid size-6 place-items-center rounded-full text-micro font-medium',
                            isToday ? 'bg-brand-600 text-white' : 'text-muted',
                          )}
                        >
                          {cell.date.getUTCDate()}
                        </span>
                        <ul className="mt-1 space-y-1">
                          {dayItems.slice(0, 3).map((item) => (
                            <li key={item.id}>
                              <Link
                                to={`/objects/${item.objectId}`}
                                title={`${item.objectName} — ${item.name}`}
                                className={cn(
                                  'block truncate rounded-md px-1.5 py-0.5 text-micro leading-tight transition-opacity hover:opacity-80',
                                  item.isOverdue
                                    ? 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400'
                                    : item.status === 'done'
                                      ? 'bg-ok-50 text-ok-700 dark:bg-ok-500/10 dark:text-ok-500'
                                      : 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
                                )}
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                          {dayItems.length > 3 ? (
                            <li className="px-1.5 text-nano text-muted">+{dayItems.length - 3} ta</li>
                          ) : null}
                        </ul>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Shu oyda davom etayotgan bosqichlar"
              subtitle={`${ongoing.length} ta bosqich oy ichida tugamaydi`}
            />
            <CardBody>
              {ongoing.length === 0 ? (
                <EmptyState
                  title="Davom etayotgan bosqich yo‘q"
                  description="Shu oydagi barcha bosqichlar oy ichida yakunlanadi."
                  icon={<CalendarDays className="size-5" />}
                />
              ) : (
                <ul className="divide-y divide-[color:var(--border-subtle)]">
                  {ongoing.slice(0, 20).map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center gap-3 py-2.5">
                      <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: item.typeColor }} />
                      <Link to={`/objects/${item.objectId}`} className="min-w-0 flex-1 truncate text-ui font-medium text-strong hover:text-brand-600">
                        {item.objectName}
                      </Link>
                      <span className="truncate text-meta text-muted">{item.name}</span>
                      <span className="tabular shrink-0 text-meta text-muted">{formatDateUz(item.plannedEnd)}</span>
                      <ProgressBar value={item.progressPercent} showValue size="xs" className="w-28 shrink-0" />
                      <Badge className={item.isOverdue ? 'bg-danger-50 text-danger-700 dark:bg-danger-500/10' : 'surface-muted text-muted'}>
                        {item.isOverdue ? `${item.overdueDays} kun kechikdi` : MILESTONE_LABELS[item.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      )}
    </>
  );
}

/** Oy katakchalari: dushanbadan boshlanadigan to‘liq haftalar. */
function buildGrid(year: number, month: number): Array<{ date: Date | null }> {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // `getUTCDay()` da 0 = yakshanba; bizda hafta DUSHANBADAN boshlanadi.
  const leading = (first.getUTCDay() + 6) % 7;

  const cells: Array<{ date: Date | null }> = [];
  for (let i = 0; i < leading; i += 1) cells.push({ date: null });
  for (let day = 1; day <= daysInMonth; day += 1) cells.push({ date: new Date(Date.UTC(year, month - 1, day)) });
  while (cells.length % 7 !== 0) cells.push({ date: null });
  return cells;
}

function isoKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}
