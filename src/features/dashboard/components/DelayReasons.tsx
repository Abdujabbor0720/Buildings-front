import { useNavigate } from 'react-router-dom';
import type { DelayReasonBreakdown } from '@/shared/api/types';
import { catalogIcon } from '@/shared/constants/catalog-icons';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { formatPercent } from '@/shared/utils/money.utils';

/**
 * «Asosiy kechikish sabablari».
 *
 * ⚠️ Bu yerda OBYEKTLAR emas, kechikish YOZUVLARI sanaladi: bitta obyekt
 * bir vaqtda ham moliyalashtirish, ham material sababidan kechikishi
 * mumkin. Shuning uchun yig‘indi obyektlar sonidan katta bo‘lishi normal.
 *
 * ⚠️ RANG SERVERDAN OLINMAYDI (`item.color` ishlatilmaydi). Server bitta
 * qiymat yuboradi, qorong‘i rejimni esa faqat mijoz biladi: o‘sha hexlar
 * qora fonda xira bo‘lib qolardi. Bundan tashqari mijozdagi palitra
 * validatordan o‘tgan (OKLab ΔE) — serverdagi katalog rangi esa shunchaki
 * seed faylida yozilgan.
 *
 * ⚠️ TARTIB KONTEYNER KENGLIGIGA qarab o‘zgaradi (`@container`), oyna
 * kengligiga emas: bu ro‘yxat ham KENG kartada (bosh sahifa, ~400px),
 * ham TOR ustunda (kechikishlar sahifasidagi yon panel, ~230px)
 * ishlatiladi.
 *   • keng  — hammasi bitta satrda: ikonka · nom · soni · chiziq · foiz;
 *   • tor   — chiziq va foiz pastki satrga tushadi, nomga butun
 *             kenglik qoladi.
 * Media so‘rov bilan tor ustunda nomlar «Moliyalas…» bo‘lib qirqilgan
 * edi — konteyner so‘rovi aynan shu holat uchun.
 */
export function DelayReasons({ items }: { items: DelayReasonBreakdown[] }) {
  const navigate = useNavigate();
  const { reasonHex } = useChartColors();
  const max = Math.max(1, ...items.map((item) => item.count));

  if (items.length === 0) {
    return <p className="t-meta py-10 text-center">Ochiq kechikish yozuvlari yo‘q</p>;
  }

  return (
    /*
     * Qatorlar orasidagi ingichka chiziq — `--border-cell` (jadval
     * kataklaridagi bilan AYNI token). Qator ajratgichidan ochroq:
     * bu ro‘yxat, jadval emas, va quyuq chiziq uni «to‘r» qilib
     * yuborardi.
     */
    /*
     * ⚠️ `h-full` + har qator `flex-1`: ro‘yxat KARTA BALANDLIGINI
     * to‘ldiradi. Qat'iy qator balandligida keng monitorda karta
     * ostida 60px bo‘sh joy qolar, tor ekranda esa qatorlar
     * bir-biriga yopishib ketardi. Endi bitta qoida ikkalasini ham
     * hal qiladi.
     */
    <ul className="@container flex h-full flex-col divide-y divide-[color:var(--border-cell)]">
      {items.map((item, index) => {
        const hex = reasonHex(index);
        const Icon = catalogIcon(item.icon);
        return (
          <li key={item.reasonId} className="flex min-h-[21px] flex-1 items-center">
            <button
              type="button"
              onClick={() => navigate(`/delays?reasonId=${item.reasonId}`)}
              title={`${item.affectedObjects} ta obyekt · jami ${item.totalDelayDays} kun`}
              className="flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-1 py-px text-left transition-colors hover:bg-neutral-100 dark:hover:bg-white/6"
            >
              {/* Ikonka plitkasi — fon sabab rangining 12% i, belgi esa
                  to‘liq rangda: to‘ldirilgan kvadrat qatorni «menyu
                  bandi» ga o‘xshatib yuborardi. */}
              <span
                aria-hidden
                className="grid size-[18px] shrink-0 place-items-center rounded-md"
                style={{ backgroundColor: `${hex}1f`, color: hex }}
              >
                {Icon ? <Icon className="size-3" strokeWidth={2.2} /> : null}
              </span>

              <span className="min-w-0 flex-1 truncate text-micro text-strong">{item.name}</span>

              <span className="num w-6 shrink-0 text-right text-meta font-semibold text-strong">
                {item.count}
              </span>

              {/* Tor konteynerda chiziq va foiz PASTKI qatorga tushadi —
                  shunda sabab nomiga butun kenglik qoladi. */}
              <span className="flex w-full items-center gap-2 pl-6.5 @[19rem]:w-auto @[19rem]:shrink-0 @[19rem]:pl-0">
                <span className="h-2 w-full min-w-10 overflow-hidden rounded-full bg-neutral-200 @[19rem]:w-[68px] dark:bg-white/12">
                  <span
                    className="block h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${(item.count / max) * 100}%`, backgroundColor: hex }}
                  />
                </span>
                <span className="num w-9 shrink-0 text-right text-micro font-semibold text-muted">
                  {formatPercent(item.percent, 0)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
