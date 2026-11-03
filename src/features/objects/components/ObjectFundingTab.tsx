import type { ConstructionObject, FundingAllocation, FundingTransaction } from '@/shared/api/types';
import {
  Badge, Card, CardBody, CardHeader, EmptyState, LoadingBlock, ProgressBar,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatMoneyFull, formatPercent, toNumber } from '@/shared/utils/money.utils';

const TX_LABELS: Record<string, { label: string; chip: string }> = {
  allocation: { label: 'Mablag‘ ajratildi', chip: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' },
  payment: { label: 'To‘lov', chip: 'bg-ok-50 text-ok-700 dark:bg-ok-500/10 dark:text-ok-500' },
  adjustment: { label: 'Tuzatish', chip: 'bg-warn-50 text-warn-700 dark:bg-warn-500/10 dark:text-warn-500' },
};

export function ObjectFundingTab({
  object,
  data,
  isLoading,
}: {
  object: ConstructionObject;
  data: { allocations: FundingAllocation[]; transactions: FundingTransaction[] } | undefined;
  isLoading: boolean;
}) {
  if (isLoading) return <LoadingBlock />;
  if (!data) return <Card><EmptyState title="Moliyaviy ma’lumot topilmadi" /></Card>;

  const totalCost = toNumber(object.totalCost);
  const funded = toNumber(object.fundedAmount);
  const paid = toNumber(object.paidAmount);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MoneyCard label="Loyiha qiymati" value={formatMoneyFull(object.totalCost)} percent={100} tone="bg-brand-500" />
        <MoneyCard
          label="Ajratilgan"
          value={formatMoneyFull(object.fundedAmount)}
          percent={totalCost > 0 ? (funded / totalCost) * 100 : 0}
          tone="bg-ok-500"
        />
        <MoneyCard
          label="To‘langan"
          value={formatMoneyFull(object.paidAmount)}
          percent={totalCost > 0 ? (paid / totalCost) * 100 : 0}
          tone="bg-warn-500"
        />
      </div>

      <Card flush>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader title="Yillik moliyalashtirish rejasi" />
        </div>
        <CardBody className="px-4 pb-1 sm:px-5">
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th className="w-20">Yil</Th>
                  <Th>Manba</Th>
                  <Th align="right">Rejada</Th>
                  <Th align="right">Ajratilgan</Th>
                  <Th align="right">To‘langan</Th>
                  <Th className="w-[140px]">Bajarilishi</Th>
                </Tr>
              </THead>
              <TBody>
                {data.allocations.length === 0 ? (
                  <TableEmpty colSpan={6}>Yillik reja kiritilmagan</TableEmpty>
                ) : (
                  data.allocations.map((allocation) => {
                    const planned = toNumber(allocation.plannedAmount);
                    const allocated = toNumber(allocation.allocatedAmount);
                    return (
                      <Tr key={allocation.id}>
                        <Td className="num font-semibold">{allocation.year}</Td>
                        <Td>
                          <span className="flex items-center gap-1.5">
                            <span className="size-2 rounded-[3px]" style={{ backgroundColor: allocation.source?.color }} />
                            <span className="text-meta">{allocation.source?.name ?? '—'}</span>
                          </span>
                        </Td>
                        <Td align="right" className="num">{formatMoneyFull(allocation.plannedAmount)}</Td>
                        <Td align="right" className="num">{formatMoneyFull(allocation.allocatedAmount)}</Td>
                        <Td align="right" className="num">{formatMoneyFull(allocation.paidAmount)}</Td>
                        <Td>
                          <ProgressBar value={planned > 0 ? (allocated / planned) * 100 : 0} showValue size="xs" />
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableWrap>
        </CardBody>
      </Card>

      <Card flush>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader
            title="Moliyaviy harakatlar daftari"
            subtitle="Yozuvlar o‘chirilmaydi — tuzatish teskari qator bilan kiritiladi"
          />
        </div>
        <CardBody className="px-4 pb-1 sm:px-5">
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th className="w-36">Sana</Th>
                  <Th className="w-44">Turi</Th>
                  <Th align="right" className="w-44">Summa</Th>
                  <Th className="w-32">Hujjat</Th>
                  <Th>Izoh</Th>
                </Tr>
              </THead>
              <TBody>
                {data.transactions.length === 0 ? (
                  <TableEmpty colSpan={5}>Moliyaviy harakat qayd etilmagan</TableEmpty>
                ) : (
                  data.transactions.map((tx) => {
                    const meta = TX_LABELS[tx.type] ?? TX_LABELS.adjustment;
                    return (
                      <Tr key={tx.id}>
                        <Td className="tabular whitespace-nowrap">{formatDateUz(tx.occurredAt)}</Td>
                        <Td><Badge className={meta.chip}>{meta.label}</Badge></Td>
                        <Td align="right" className="num font-medium">{formatMoneyFull(tx.amount)}</Td>
                        <Td muted className="mono text-meta">{tx.documentNumber ?? '—'}</Td>
                        <Td muted className="max-w-[280px]"><span className="block truncate">{tx.note ?? '—'}</span></Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableWrap>
        </CardBody>
      </Card>
    </div>
  );
}

function MoneyCard({ label, value, percent, tone }: { label: string; value: string; percent: number; tone: string }) {
  return (
    <Card>
      <p className="text-meta text-muted">{label}</p>
      <p className="num mt-1 text-lede font-bold text-strong">{value}</p>
      <ProgressBar value={percent} tone={tone} size="xs" className="mt-2.5" />
      <p className="num mt-1 text-micro text-muted">{formatPercent(percent)} loyiha qiymatidan</p>
    </Card>
  );
}
