import { useMemo, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { DeadlineBucket } from '@/shared/api/types';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { Tabs, type TabOption } from '@/shared/ui';
import { formatPercent } from '@/shared/utils/money.utils';

/**
 * «Muddatlar bo‘yicha» halqa diagrammasi.
 *
 * ⚠️ Yillar QOTIRIB yozilmaydi — ular serverdan keladi va yil almashganda
 * o‘z-o‘zidan siljiydi.
 *
 * ⚠️ Rang serverdagi `bucket.color` dan EMAS, O‘RNIDAN olinadi: bu
 * tartibli qator (yaqin muddat to‘qroq) va qorong‘i rejimda tartib
 * teskari bo‘lishi kerak. Server bitta qiymat yuboradi, rejimni esa
 * faqat mijoz biladi.
 */
export function DeadlineDonut({ buckets }: { buckets: DeadlineBucket[] }) {
  const [active, setActive] = useState<string>('all');
  const { deadlineHex, dark } = useChartColors();

  /** «Muddati o‘tgan» rampadan tashqarida — qolganlari 0,1,2… bo‘yicha. */
  const colored = useMemo(() => {
    // ⚠️ Guruh `bucket.overdue` BO‘YICHA ajratiladi, `year === null`
    // bo‘yicha EMAS: `year` «2028+» da ham `null` bo‘ladi (u ochiq
    // guruh, bitta yil emas) va u qizil «muddati o‘tgan» rangida
    // chizilib, kelajakdagi obyektlar kechikkanday ko‘rinardi.
    const ranked = buckets.filter((bucket) => !bucket.overdue);
    return buckets.map((bucket) => ({
      ...bucket,
      hex: deadlineHex(
        bucket.overdue ? 0 : ranked.indexOf(bucket),
        ranked.length,
        bucket.overdue,
      ),
    }));
  }, [buckets, deadlineHex]);

  const tabs = useMemo<ReadonlyArray<TabOption<string>>>(
    () => [
      { value: 'all', label: 'Barchasi' },
      ...buckets.map((bucket) => ({ value: bucket.label, label: shortLabel(bucket.label) })),
    ],
    [buckets],
  );

  const visible = active === 'all' ? colored : colored.filter((bucket) => bucket.label === active);
  const total = visible.reduce((sum, bucket) => sum + bucket.count, 0);
  const emptyHex = dark ? '#2a2a2c' : '#e8e8ea';

  return (
    <>
      <Tabs options={tabs} value={active} onChange={setActive} className="mb-3 w-full overflow-x-auto" />

      <div className="relative h-[112px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visible.length ? visible : [{ label: '—', count: 1, hex: emptyHex }]}
              dataKey="count"
              nameKey="label"
              innerRadius="70%"
              outerRadius="100%"
              // 2px'lik yuza oralig‘i: qo‘shni bo‘laklar bir-biriga
              // quyilib ketmasligi uchun (rang o‘xshash bo‘lsa ham chegara ko‘rinadi).
              paddingAngle={visible.length > 1 ? 2 : 0}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive={false}
            >
              {(visible.length ? visible : [{ hex: emptyHex }]).map((bucket, index) => (
                <Cell key={index} fill={bucket.hex} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Markazdagi yig‘indi — `pointer-events-none`, aks holda diagramma
            hover hodisalarini to‘sib qo‘yardi. */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="num text-sub leading-none text-strong">{total}</p>
            <p className="t-label mt-1">obyekt</p>
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {colored.map((bucket) => (
          <li key={bucket.label} className="flex items-center gap-2 text-meta">
            <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: bucket.hex }} />
            <span className="flex-1 truncate text-muted">{bucket.label}</span>
            <span className="num text-ui text-strong">{bucket.count}</span>
            <span className="num text-faint w-11 text-right text-meta">{formatPercent(bucket.percent)}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** Tab ichida «2026-yil» emas, «2026» — joy tor. */
function shortLabel(label: string): string {
  return label.replace('-yil', '');
}
