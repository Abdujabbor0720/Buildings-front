import { useNavigate } from 'react-router-dom';
import type { DelayReasonBreakdown } from '@/shared/api/types';
import { formatPercent } from '@/shared/utils/money.utils';

/**
 * «Asosiy kechikish sabablari».
 *
 * ⚠️ Bu yerda OBYEKTLAR emas, kechikish YOZUVLARI sanaladi: bitta obyekt
 * bir vaqtda ham moliyalashtirish, ham material sababidan kechikishi
 * mumkin. Shuning uchun yig‘indi obyektlar sonidan katta bo‘lishi normal.
 *
 * ⚠️ Rangli IKONKA PLITKASI olib tashlandi: oltita rangli kvadrat
 * ro‘yxatni «menyu» ga o‘xshatib, asosiy ma’lumotni — qaysi sabab
 * ko‘p uchrashini — ko‘rinmas qilib qo‘yardi.
 *
 * ⚠️ TARTIB KONTEYNER KENGLIGIGA qarab o‘zgaradi (`@container`), oyna
 * kengligiga emas: bu ro‘yxat ham keng kartada (bosh sahifa), ham tor
 * ustunda (kechikishlar sahifasi) ishlatiladi. Media so‘rov bilan tor
 * ustunda sabab nomlari «Moliyalas…» bo‘lib qirqilib qolgan edi.
 */
export function DelayReasons({ items }: { items: DelayReasonBreakdown[] }) {
  const navigate = useNavigate();
  const max = Math.max(1, ...items.map((item) => item.count));

  if (items.length === 0) {
    return <p className="t-meta py-10 text-center">Ochiq kechikish yozuvlari yo‘q</p>;
  }

  return (
    <ul className="@container space-y-1">
      {items.map((item) => (
        <li key={item.reasonId}>
          <button
            type="button"
            onClick={() => navigate(`/delays?reasonId=${item.reasonId}`)}
            title={`${item.affectedObjects} ta obyekt · jami ${item.totalDelayDays} kun`}
            className="flex w-full flex-wrap items-center gap-x-2.5 gap-y-1 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6"
          >
            <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />

            <span className="min-w-0 flex-1 truncate text-meta">{item.name}</span>

            <span className="num w-6 shrink-0 text-right text-ui text-strong">{item.count}</span>

            {/* Tor konteynerda chiziq va foiz PASTKI qatorga tushadi —
                shunda sabab nomiga butun kenglik qoladi. */}
            <span className="flex w-full shrink-0 items-center gap-2 pl-4.5 @[20rem]:w-auto @[20rem]:pl-0">
              <span className="h-1 w-full min-w-10 overflow-hidden rounded-full bg-neutral-200 @[20rem]:w-16 dark:bg-white/12">
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${(item.count / max) * 100}%`, backgroundColor: item.color }}
                />
              </span>
              <span className="num text-faint w-9 shrink-0 text-right text-meta">
                {formatPercent(item.percent, 0)}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
