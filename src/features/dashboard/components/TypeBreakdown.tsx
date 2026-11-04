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
    /*
     * ⚠️ Ro‘yxat karta balandligini to‘ldiradi — `DelayReasons`
     * bilan AYNI qoida.
     *
     * ⚠️ Qatorlar orasida BO‘SHLIQ (`gap`) yo‘q: `flex-1` baribir
     * qolgan joyni teng bo‘lib beradi, qo‘shimcha oraliq esa
     * 1280px li ekranda oltinchi qatorni («Boshqa») kartadan
     * chiqarib yuborardi.
     */
    <ul className="flex h-full flex-col">
      {items.map((item, index) => (
        <li key={item.typeId} className="flex min-h-[19px] flex-1 items-center">
          <button
            type="button"
            onClick={() => navigate(`/objects?typeIds=${item.typeId}`)}
            className="flex w-full items-center gap-1.5 rounded-md px-1 py-[1px] text-left transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6"
          >
            {/* Nuqta atrofidagi o'z rangidagi yumshoq halo (2.5px,
                15% shaffoflik). 8px lik yalang'och nuqta oq fonda
                «sanchilgan» bo'lib ko'rinardi; halo uni yumshatadi va
                o'lchamga TEGMAYDI (soya oqimdan tashqarida). */}
            <span
              className="size-2 shrink-0 rounded-full"
              style={{
                backgroundColor: seriesHex(index),
                boxShadow: `0 0 0 2.5px ${seriesHex(index)}26`,
              }}
            />
            {/* ⚠️ Nom uchun joy BIRINCHI navbatda: «Ta'li…» bo‘lib
                qirqilgan yorliq hech narsa tushuntirmaydi. Shuning
                uchun sanoq, chiziq va foiz ustunlari eng kichik
                o‘lchamda — chiziq 32px, foiz 34px. */}
            <span className="min-w-0 flex-1 truncate text-micro text-strong" title={item.name}>
              {item.name}
            </span>
            <span className="num w-5 shrink-0 text-right text-micro font-semibold text-strong">
              {item.count}
            </span>
            <span className="bar-track h-2 w-9 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <span
                className="bar-fill block h-full rounded-full transition-[width] duration-500"
                style={{ width: `${(item.count / max) * 100}%`, backgroundColor: seriesHex(index) }}
              />
            </span>
            <span className="num text-faint w-[34px] shrink-0 text-right text-micro">
              {formatPercent(item.percent)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
