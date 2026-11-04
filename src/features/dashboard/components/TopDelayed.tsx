import { useNavigate } from 'react-router-dom';
import type { TopDelayedItem } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { ProgressBar, Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr } from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';

/** «Kechikayotgan obyektlar (TOP 5)» — ortda qolish kunlari bo‘yicha. */
export function TopDelayed({ items }: { items: TopDelayedItem[] }) {
  const navigate = useNavigate();

  return (
    /*
     * ⚠️ `[&_td]:py-1` — qator 24px. Bosh sahifa bitta ekranga
     * sig‘ishi kerak va bu jadval uchun ajratilgan joy ~130px:
     * sukutdagi 31px lik qatorda beshta qator sig‘masdi.
     * Ustun kengliklari maketdan olingan.
     */
    <TableWrap fill>
      <Table className="h-full text-micro [&_td]:py-px [&_th]:py-px">
        <THead>
          <Tr>
            <Th className="w-7 px-2">#</Th>
            <Th className="px-2">Obyekt nomi</Th>
            <Th className="w-[72px] px-2">Tuman</Th>
            <Th className="w-[102px] px-2">Reja muddati</Th>
            <Th align="right" className="w-[62px] px-2">Kechikish</Th>
            <Th className="w-[92px] px-2">Bajarilish</Th>
            <Th className="w-[150px] px-2">Asosiy sabab</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={7}>Kechikayotgan obyekt yo‘q — barchasi reja asosida</TableEmpty>
          ) : (
            items.map((item, index) => (
              <Tr key={item.id} onClick={() => navigate(`/objects/${item.id}`)}>
                <Td muted className="num px-2 text-meta">{index + 1}</Td>
                <Td className="max-w-[1px] px-2">
                  <span className="block truncate font-medium text-strong">{item.name}</span>
                </Td>
                <Td muted className="truncate px-2 whitespace-nowrap">{item.districtName}</Td>
                <Td className="px-2 text-meta whitespace-nowrap">{formatDateUz(item.plannedEndDate)}</Td>
                {/* ⚠️ Maketdagi kabi SOF QIZIL MATN, «pill» emas:
                    to‘ldirilgan fon qator balandligini 8px oshirardi va
                    beshta qator ajratilgan joyga sig‘masdi. Rang
                    o‘zi yetarli signal. */}
                <Td align="right" className="num px-2 font-semibold whitespace-nowrap text-danger-600 dark:text-danger-400">
                  {item.delayDays} kun
                </Td>
                <Td className="px-2">
                  {/* ⚠️ Rang BAJARILISH FOIZIDAN emas, HOLATDAN. Foiz
                      allaqachon chiziq uzunligi va yonidagi raqam bilan
                      aytilgan; rang ham shuni takrorlasa, u hech qanday
                      yangi ma'lumot bermaydi. Holat rangi esa «97% — bu
                      yetarlimi» degan savolga javob beradi: bu yerda
                      hamma qator kechikayotgan, lekin xavfli holatdagisi
                      qizil bo‘lib ajralib turadi. */}
                  <ProgressBar
                    value={item.progressPercent}
                    tone={HEALTH_META[item.healthStatus].bar}
                    showValue
                    size="sm"
                  />
                </Td>
                {/* ⚠️ Rangli nuqta OLIB TASHLANDI: u serverdagi eski
                    katalog rangini ishlatardi va sabab matnidan 14px joy
                    yeb, «Qurilish materiallari ye…» bo‘lib qirqilishiga
                    sabab bo‘lardi. Sabab — MATN, rang bu yerda hech
                    narsa qo‘shmaydi (yonidagi ustunda allaqachon holat bor). */}
                <Td className="max-w-[150px] px-2">
                  {item.primaryReason ? (
                    <span className="block truncate text-meta text-muted" title={item.primaryReason}>
                      {item.primaryReason}
                    </span>
                  ) : (
                    <span className="text-faint text-meta">—</span>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </Table>
    </TableWrap>
  );
}
