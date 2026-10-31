import { Plus } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useAddProgress } from '@/shared/api/queries';
import type { ConstructionObject, ProgressUpdate } from '@/shared/api/types';
import {
  Button, Card, CardBody, CardHeader, Input, LoadingBlock, Modal, ProgressBar, Table, TableEmpty,
  TableWrap, TBody, Td, Textarea, Th, THead, Tr,
} from '@/shared/ui';
import { formatDateUz, toInputDate, tashkentToday } from '@/shared/utils/date.utils';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/shared/utils/cn';

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Qo‘lda',
  photo_report: 'Foto-hisobotdan',
  import: 'Import',
};

export function ObjectProgressTab({
  object,
  history,
  isLoading,
}: {
  object: ConstructionObject;
  history: ProgressUpdate[];
  isLoading: boolean;
}) {
  const can = useAuthStore((state) => state.can);
  const [open, setOpen] = useState(false);

  return (
    <Card flush>
      <div className="px-4 pt-4 sm:px-5 sm:pt-5">
        <CardHeader
          title="Bajarilish tarixi"
          subtitle="Yozuvlar o‘chirilmaydi va tahrirlanmaydi — har o‘zgarish alohida qator"
          action={
            can('objects.progress') ? (
              <Button size="sm" onClick={() => setOpen(true)} leftIcon={<Plus className="size-3.5" />}>
                Yangilash
              </Button>
            ) : null
          }
        />
      </div>

      <CardBody className="px-4 pb-1 sm:px-5">
        {isLoading ? (
          <LoadingBlock />
        ) : (
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th className="w-36">Sana</Th>
                  <Th className="w-[150px]">Bajarilish</Th>
                  <Th align="right" className="w-24">O‘zgarish</Th>
                  <Th className="w-36">Manba</Th>
                  <Th>Izoh</Th>
                  <Th className="w-40">Kim kiritdi</Th>
                </Tr>
              </THead>
              <TBody>
                {history.length === 0 ? (
                  <TableEmpty colSpan={6}>Bajarilish bo‘yicha yozuv yo‘q</TableEmpty>
                ) : (
                  [...history].reverse().map((item) => {
                    const delta = item.progressPercent - item.previousPercent;
                    return (
                      <Tr key={item.id}>
                        <Td className="tabular whitespace-nowrap">{formatDateUz(item.reportDate)}</Td>
                        <Td><ProgressBar value={item.progressPercent} showValue size="xs" /></Td>
                        <Td align="right">
                          <span className={cn('num text-meta font-semibold', delta > 0 ? 'text-ok-600 dark:text-ok-500' : delta < 0 ? 'text-danger-600 dark:text-danger-500' : 'text-muted')}>
                            {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
                          </span>
                        </Td>
                        <Td muted className="text-meta">{SOURCE_LABELS[item.source] ?? item.source}</Td>
                        <Td muted className="max-w-[280px]">
                          <span className="block truncate">{item.note ?? '—'}</span>
                        </Td>
                        <Td muted className="text-meta whitespace-nowrap">
                          {item.author ? `${item.author.lastName} ${item.author.firstName}` : '—'}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableWrap>
        )}
      </CardBody>

      <AddProgressModal object={object} open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}

function AddProgressModal({
  object,
  open,
  onClose,
}: {
  object: ConstructionObject;
  open: boolean;
  onClose: () => void;
}) {
  const mutation = useAddProgress(object.id);
  const [percent, setPercent] = useState(String(object.progressPercent));
  const [date, setDate] = useState(toInputDate(tashkentToday()));
  const [note, setNote] = useState('');

  const numeric = Number(percent);
  // ⚠️ Pasayish uchun izoh MAJBURIY — server ham shu qoidani qo‘yadi,
  // lekin foydalanuvchi buni yuborishdan OLDIN bilishi kerak.
  const requiresNote = numeric < object.progressPercent;
  const invalid = Number.isNaN(numeric) || numeric < 0 || numeric > 100 || (requiresNote && !note.trim());

  async function onSubmit() {
    try {
      await mutation.mutateAsync({
        progressPercent: numeric,
        reportDate: date,
        note: note.trim() || undefined,
      });
      toast.success('Bajarilish yangilandi');
      onClose();
      setNote('');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bajarilishni yangilash"
      description={`Joriy qiymat: ${object.progressPercent}%`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={onSubmit} loading={mutation.isPending} disabled={invalid}>Saqlash</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          type="number"
          label="Bajarilish, %"
          min={0}
          max={100}
          step="0.1"
          value={percent}
          onChange={(event) => setPercent(event.target.value)}
          required
        />
        <Input
          type="date"
          label="Hisobot sanasi"
          value={date}
          max={toInputDate(tashkentToday())}
          onChange={(event) => setDate(event.target.value)}
          hint="Kelajakdagi sana qabul qilinmaydi"
          required
        />
        <Textarea
          label="Izoh"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Qanday ishlar bajarildi?"
          required={requiresNote}
          error={requiresNote && !note.trim() ? 'Bajarilish kamaymoqda — sababini izohda ko‘rsating' : undefined}
        />
      </div>
    </Modal>
  );
}
