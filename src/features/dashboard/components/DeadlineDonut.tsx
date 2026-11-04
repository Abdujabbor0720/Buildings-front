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
  // Bo‘sh halqa — neytral shkaladan (`neutral-200` / qorong‘ida `800`).
  const emptyHex = dark ? '#22313f' : '#e2eaf2';

  return (
    <>
      <Tabs options={tabs} value={active} onChange={setActive} fill className="mb-1.5 shrink-0" />

      {/*
        ⚠️ Halqa CHAPDA, ro‘yxat O‘NGDA — ustma-ust emas.
        Ustma-ust joylashuvda blok ~250px egallardi va o‘ng ustunga
        ikkinchi karta («Qurilish turlari») sig‘masdi. Yonma-yon
        shaklda ikkalasi ham bir ekranga tushadi, qiyoslash esa
        osonlashadi: ulush va raqam bir ko‘z harakatida ko‘rinadi.
      */}
      {/*
        ⚠️ `overflow-hidden` + `min-h-0` MAJBURIY. `items-center` bilan
        birga, ichki qism konteynerdan baland bo‘lsa, u YUQORIGA ham
        toshib, tablar ustiga chiqib ketardi — karta «buzuq» bo‘lib
        ko‘rinardi. Endi halqa mavjud joyga moslashadi.
      */}
      <div className="flex min-h-0 flex-1 items-center gap-2.5 overflow-hidden">
        {/* Halqaga yumshoq soya — `MiniDonut` bilan AYNI qoida: yassi
            doira oq karta ustida «chizilgan» bo'lib ko'rinadi. Soya
            ichki teshikka ham tushmasligi uchun u SVG ga emas,
            idishga qo'yilgan. */}
        <div className="relative aspect-square h-full max-h-[150px] shrink-0 [&_svg]:drop-shadow-[0_2px_4px_rgb(16_42_76/0.16)]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={visible.length ? visible : [{ label: '—', count: 1, hex: emptyHex }]}
                dataKey="count"
                nameKey="label"
                innerRadius="64%"
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
          {/* ⚠️ Markazda FAQAT raqam. «obyekt» so‘zi halqa teshigiga
              (≈44px) sig‘may, raqam ustiga chiqib ketardi — karta
              sarlavhasi allaqachon nimani sanayotganini aytadi. */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <p className="num text-lede leading-none font-bold text-strong">{total}</p>
          </div>
        </div>

        {/* ⚠️ Har guruh BITTA satrda: ikki satrli ko‘rinishda uchta
            guruh 84px egallab, halqa bilan yonma-yon sig‘masdi. */}
        <ul className="min-w-0 flex-1 space-y-0.5">
          {colored.map((bucket) => (
            <li key={bucket.label} className="flex min-w-0 items-center gap-1.5">
              {/* Nuqta atrofidagi o‘z rangidagi yumshoq halo —
                  `TypeBreakdown` bilan AYNI qoida: 8px lik yalang‘och
                  nuqta oq fonda «sanchilgan» bo‘lib ko‘rinardi. */}
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: bucket.hex,
                  boxShadow: `0 0 0 2.5px ${bucket.hex}26`,
                }}
              />
              <span className="min-w-0 flex-1 truncate text-micro text-muted">{bucket.label}</span>
              <span className="num shrink-0 text-meta font-bold text-strong">{bucket.count}</span>
              <span className="num text-faint w-10 shrink-0 text-right text-micro">
                {formatPercent(bucket.percent)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Tab ichida «2026-yil» emas, «2026» — joy tor. */
function shortLabel(label: string): string {
  return label.replace('-yil', '');
}
