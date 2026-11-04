import { useNavigate } from 'react-router-dom';
import type { UpcomingItem } from '@/shared/api/types';
import { HEALTH_META, STATUS_META } from '@/shared/constants/health';
import { Badge, ProgressBar, Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr } from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { cn } from '@/shared/utils/cn';

/** «Yaqin muddatda topshiriladigan obyektlar» — muddat bo‘yicha o‘sish tartibida. */
export function UpcomingTable({ items }: { items: UpcomingItem[] }) {
  const navigate = useNavigate();

  return (
    /*
     * ⚠️ «Tuman» ustuni YO‘Q — ataylab. Bu kartaga bosh sahifada
     * ~410px ajratilgan va obyekt nomi deyarli har doim tuman nomi
     * bilan boshlanadi («Baliqchi tumani 18-son bog‘cha»): ustunni
     * saqlasak, u ma’lumotni TAKRORLAB, nom uchun 60px joy yeb
     * qo‘yardi va nom o‘qib bo‘lmas darajada qisqarardi.
     */
    <TableWrap fill>
      <Table className="h-full text-micro [&_td]:py-px [&_th]:py-px">
        <THead>
          <Tr>
            <Th className="w-7 px-2">#</Th>
            <Th className="px-2">Obyekt nomi</Th>
            <Th className="w-[128px] px-2">Topshirish sanasi</Th>
            <Th className="w-[86px] px-2">Bajarilish</Th>
            <Th className="w-[96px] px-2">Status</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={5}>Yaqin 90 kunda topshiriladigan obyekt yo‘q</TableEmpty>
          ) : (
            items.map((item, index) => {
              const status = STATUS_META[item.status];
              return (
                <Tr key={item.id} onClick={() => navigate(`/objects/${item.id}`)}>
                  <Td muted className="num px-2 text-micro">{index + 1}</Td>
                  <Td className="max-w-[1px] px-2">
                    <span className="block truncate font-medium text-strong" title={item.name}>
                      {item.name}
                    </span>
                  </Td>
                  {/* ⚠️ Sana va qolgan kun BITTA qatorda: ikki qatorda
                      qator balandligi 34px bo‘lib, beshta qator bosh
                      sahifadagi joyga sig‘masdi. */}
                  <Td className="px-2 whitespace-nowrap">
                    <span className="tabular">{formatDateUz(item.plannedEndDate)}</span>
                    <span
                      className={cn(
                        'num ml-1.5 text-nano',
                        item.daysLeft <= 14 ? 'text-danger-600 dark:text-danger-500' : 'text-muted',
                      )}
                    >
                      {item.daysLeft} kun
                    </span>
                  </Td>
                  <Td className="px-2">
                    <ProgressBar
                      value={item.progressPercent}
                      showValue
                      size="sm"
                      tone={HEALTH_META[item.healthStatus].bar}
                    />
                  </Td>
                  <Td className="px-2">
                    {/* ⚠️ Ixcham belgi (`py-0`): odatdagi to‘ldirish
                        qatorni 25px ga ko‘tarib, beshta qator bosh
                        sahifadagi joyga sig‘masdi. */}
                    <Badge className={`${status.chip} py-0 text-nano`} dot={status.dot}>
                      {status.label}
                    </Badge>
                  </Td>
                </Tr>
              );
            })
          )}
        </TBody>
      </Table>
    </TableWrap>
  );
}
