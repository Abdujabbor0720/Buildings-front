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
    <TableWrap>
      <Table>
        <THead>
          <Tr>
            <Th className="w-8 px-2">#</Th>
            <Th className="px-2">Obyekt nomi</Th>
            <Th className="w-24 px-2">Tuman</Th>
            <Th className="w-[150px] px-2">Topshirish sanasi</Th>
            <Th className="w-[106px] px-2">Bajarilish</Th>
            <Th className="w-[108px] px-2">Status</Th>
          </Tr>
        </THead>
        <TBody>
          {items.length === 0 ? (
            <TableEmpty colSpan={6}>Yaqin 90 kunda topshiriladigan obyekt yo‘q</TableEmpty>
          ) : (
            items.map((item, index) => {
              const status = STATUS_META[item.status];
              return (
                <Tr key={item.id} onClick={() => navigate(`/objects/${item.id}`)}>
                  <Td muted className="num px-2 text-micro">{index + 1}</Td>
                  <Td className="max-w-[230px] px-2">
                    <span className="block truncate font-medium text-strong">{item.name}</span>
                  </Td>
                  <Td muted className="truncate px-2 whitespace-nowrap">{item.districtName}</Td>
                  <Td className="px-2 text-meta whitespace-nowrap">
                    <span className="tabular">{formatDateUz(item.plannedEndDate)}</span>
                    <span
                      className={cn(
                        'num ml-2 text-micro',
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
                      size="xs"
                      tone={HEALTH_META[item.healthStatus].bar}
                    />
                  </Td>
                  <Td className="px-2">
                    <Badge className={status.chip} dot={status.dot}>{status.label}</Badge>
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
