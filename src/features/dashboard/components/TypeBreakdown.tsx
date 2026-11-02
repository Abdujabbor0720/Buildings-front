import { useNavigate } from 'react-router-dom';
import type { TypeBreakdownItem } from '@/shared/api/types';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { formatPercent } from '@/shared/utils/money.utils';

/**
 * «Qurilish turlari bo‘yicha» — rangli belgi + mikro-ustun + foiz.
 *
 * ⚠️ RANG SERVERDAN OLINMAYDI (`item.color` ishlatilmaydi). Server bitta
 * qiymat yuboradi, qorong‘i rejimni esa faqat mijoz biladi. Bundan
 * tashqari mijozdagi palitra validatordan o‘tgan (OKLab ΔE, protan/
 * deutan) — serverdagi katalog rangi shunchaki seed faylida yozilgan va
 * eski to‘plamdan qolgan edi.
 */
export function TypeBreakdown({ items }: { items: TypeBreakdownItem[] }) {
  const navigate = useNavigate();
  const { seriesHex } = useChartColors();
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <ul className="space-y-0.5">
      {items.map((item, index) => (
        <li key={item.typeId}>
          <button
            type="button"
            onClick={() => navigate(`/objects?typeIds=${item.typeId}`)}
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6"
          >
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: seriesHex(index) }}
            />
            <span className="min-w-0 flex-1 truncate text-meta">{item.name}</span>
            <span className="num w-6 shrink-0 text-right text-meta text-strong">{item.count}</span>
            <span className="h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(item.count / max) * 100}%`, backgroundColor: seriesHex(index) }}
              />
            </span>
            <span className="num text-faint w-10 shrink-0 text-right text-meta">
              {formatPercent(item.percent)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
