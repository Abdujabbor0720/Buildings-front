import { useNavigate } from 'react-router-dom';
import type { TopDelayedItem } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { ProgressBar, Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr } from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';

/** «Kechikayotgan obyektlar (TOP 5)» — ortda qolish kunlari bo‘yicha. */
export function TopDelayed({ items }: { items: TopDelayedItem[] }) {
  const navigate = useNavigate();

  return (
    <TableWrap>
      <Table>
        <THead>
          <Tr>
            <Th className="w-8 px-2">#</Th>
            <Th className="px-2">Obyekt nomi</Th>
            <Th className="w-24 px-2">Tuman</Th>
            <Th className="w-[118px] px-2">Reja muddati</Th>
            <Th align="right" className="w-[82px] px-2">Kechikish</Th>
            <Th className="w-[104px] px-2">Bajarilish</Th>
            <Th className="w-[210px] px-2">Asosiy sabab</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={7}>Kechikayotgan obyekt yo‘q — barchasi reja asosida</TableEmpty>
          ) : (
            items.map((item, index) => (
              <Tr key={item.id} onClick={() => navigate(`/objects/${item.id}`)}>
                <Td muted className="num px-2 text-meta">{index + 1}</Td>
                <Td className="max-w-[200px] px-2">
                  <span className="block truncate font-medium text-strong">{item.name}</span>
                </Td>
                <Td muted className="truncate px-2 whitespace-nowrap">{item.districtName}</Td>
                <Td className="px-2 text-meta whitespace-nowrap">{formatDateUz(item.plannedEndDate)}</Td>
                <Td align="right" className="px-2">
                  <span className="num rounded-full bg-danger-50 px-2 py-0.5 text-meta whitespace-nowrap text-danger-700 ring-1 ring-inset ring-danger-500/15 dark:bg-danger-500/12 dark:text-danger-300 dark:ring-danger-500/25">
                    {item.delayDays} kun
                  </span>
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
                <Td className="max-w-[210px] px-2">
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
