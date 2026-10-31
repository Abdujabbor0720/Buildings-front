import { useNavigate } from 'react-router-dom';
import type { TypeBreakdownItem } from '@/shared/api/types';
import { formatPercent } from '@/shared/utils/money.utils';

/** «Qurilish turlari bo‘yicha» — rangli belgi + mikro-ustun + foiz. */
export function TypeBreakdown({ items }: { items: TypeBreakdownItem[] }) {
  const navigate = useNavigate();
  const max = Math.max(1, ...items.map((item) => item.count));

  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.typeId}>
          <button
            type="button"
            onClick={() => navigate(`/objects?typeIds=${item.typeId}`)}
            className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6"
          >
            {/* Kvadrat belgi — holat nuqtalari DOIRA. Shakl farqi turkumni
                holatdan ajratib turadi (rang yetarli emas). */}
            <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 flex-1 truncate text-meta">{item.name}</span>
            <span className="num w-6 shrink-0 text-right text-meta text-strong">{item.count}</span>
            <span className="h-1 w-12 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <span
                className="block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }}
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
