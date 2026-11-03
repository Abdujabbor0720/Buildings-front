import { GripVertical, Plus, Scale, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useReplaceMilestones, type MilestoneBody } from '@/shared/api/queries';
import type { ConstructionObject, Milestone } from '@/shared/api/types';
import { Button, Field, Input, Modal } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { addDays, toInputDate } from '@/shared/utils/date.utils';

interface Props {
  open: boolean;
  onClose: () => void;
  object: ConstructionObject;
  existing: Milestone[];
}

interface Row {
  key: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  weight: string;
  workerCount: string;
}

/**
 * NAMUNAVIY REJA — bo‘sh ekrandan boshlamaslik uchun.
 *
 * ⚠️ Bu MAJBURIY shablon emas, BOSHLANG‘ICH NUQTA: har qurilishning
 * bosqichlari boshqacha va ularni odam tahrirlaydi. Lekin bo‘sh
 * jadvalga qarab turgan odam ko‘pincha rejani umuman tuzmaydi —
 * shuning uchun u to‘ldirilgan holda ochiladi.
 */
const TEMPLATE: Array<{ name: string; weight: number }> = [
  { name: 'Loyiha-smeta hujjatlari va ekspertiza', weight: 8 },
  { name: 'Hudud tayyorlash va poydevor quyish', weight: 17 },
  { name: 'Karkas va devor ishlari (korobka)', weight: 25 },
  { name: 'Tom yopish va fasad ishlari', weight: 18 },
  { name: 'Muhandislik tarmoqlari', weight: 15 },
  { name: 'Ichki pardozlash ishlari', weight: 12 },
  { name: 'Obodonlashtirish va topshirish', weight: 5 },
];

const MAX_ROWS = 50;

let counter = 0;
const nextKey = () => `row-${(counter += 1)}`;

/**
 * BUTUN ISH REJASINI TUZISH.
 *
 * ⚠️ Bu yo‘l rejani YAMAMAYDI, O‘RNIGA QO‘YADI — ulushlar yig‘indisi
 * aniq 100% ekanini faqat to‘liq ro‘yxatni ko‘rib tekshirib bo‘ladi.
 * Shuning uchun u faqat HECH BIR BOSQICH TOPSHIRILMAGAN obyektda
 * ochiladi; topshirilgani bo‘lsa, bosqichlar alohida tahrirlanadi
 * (server ham shu qoidani qo‘yadi).
 */
export function MilestonePlanModal({ open, onClose, object, existing }: Props) {
  const replace = useReplaceMilestones(object.id);
  const [rows, setRows] = useState<Row[]>([]);
  const [touched, setTouched] = useState(false);

  const sessionKey = open ? `${object.id}:${existing.length}` : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setRows(sessionKey ? initialRows(object, existing) : []);
    setTouched(false);
  }

  const total = rows.reduce((sum, row) => sum + (Number(row.weight) || 0), 0);
  const balanced = Math.abs(total - 100) < 0.01;

  const patch = (key: string, field: keyof Row, value: string) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));

  const rowErrors = rows.map((row) => rowError(row));
  const hasRowErrors = rowErrors.some(Boolean);

  function distribute() {
    if (rows.length === 0) return;
    /*
     * ⚠️ Oxirgi qatorga QOLDIQ beriladi, hammasiga bir xil son emas:
     * 3 ta bosqichda 33.33 × 3 = 99.99 bo‘lib, server «aniq 100%»
     * shartida rad etardi.
     */
    const base = Math.floor((100 / rows.length) * 100) / 100;
    setRows((current) =>
      current.map((row, index) => ({
        ...row,
        weight: String(
          index === current.length - 1
            ? Number((100 - base * (current.length - 1)).toFixed(2))
            : base,
        ),
      })),
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (hasRowErrors || !balanced) return;

    const payload: MilestoneBody[] = rows.map((row, index) => {
      const body: MilestoneBody = {
        name: row.name.trim(),
        plannedStart: row.plannedStart,
        plannedEnd: row.plannedEnd,
        weight: Number(row.weight),
        sortOrder: index,
      };
      if (row.workerCount.trim()) body.workerCount = Number(row.workerCount);
      return body;
    });

    try {
      await replace.mutateAsync(payload);
      toast.success(`Ish rejasi saqlandi — ${payload.length} ta bosqich`);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={replace.isPending ? () => undefined : onClose}
      size="xl"
      title="Ish rejasini tuzish"
      description="Har bosqichning ulushi uning umumiy bajarilishdagi og‘irligi. Yig‘indi aniq 100% bo‘lishi kerak."
      footer={
        <>
          <span
            className={cn(
              'num mr-auto text-meta font-semibold',
              balanced ? 'text-ok-600 dark:text-ok-500' : 'text-danger-600 dark:text-danger-400',
            )}
          >
            Jami ulush: {total.toFixed(2)}%
            {balanced ? '' : ` — ${(100 - total).toFixed(2)}% yetishmayapti`}
          </span>
          <Button variant="secondary" onClick={onClose} disabled={replace.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="plan-form" loading={replace.isPending} disabled={!balanced}>
            Rejani saqlash
          </Button>
        </>
      }
    >
      <form id="plan-form" onSubmit={submit} className="space-y-3" noValidate>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-meta text-muted">
            {rows.length} ta bosqich · obyekt muddati:{' '}
            <span className="num">{object.plannedStartDate.slice(0, 10)}</span> —{' '}
            <span className="num">{object.plannedEndDate.slice(0, 10)}</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={distribute}
            leftIcon={<Scale className="size-3.5" />}
          >
            Ulushlarni teng taqsimlash
          </Button>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className="surface-muted grid grid-cols-1 items-start gap-2 rounded-xl p-2.5 sm:grid-cols-[18px_1fr_130px_130px_84px_84px_32px]"
            >
              <span className="text-faint mt-2 hidden place-items-center sm:grid">
                <GripVertical className="size-3.5" />
              </span>

              <Field error={touched ? rowErrors[index] : undefined}>
                <Input
                  value={row.name}
                  onChange={(e) => patch(row.key, 'name', e.target.value)}
                  placeholder={`${index + 1}-bosqich nomi`}
                />
              </Field>

              <Input
                type="date"
                value={row.plannedStart}
                onChange={(e) => patch(row.key, 'plannedStart', e.target.value)}
                aria-label="Boshlanishi"
              />
              <Input
                type="date"
                value={row.plannedEnd}
                onChange={(e) => patch(row.key, 'plannedEnd', e.target.value)}
                aria-label="Tugashi"
              />
              <Input
                value={row.weight}
                onChange={(e) => patch(row.key, 'weight', e.target.value)}
                inputMode="decimal"
                placeholder="%"
                aria-label="Ulushi, foiz"
                className="text-center"
              />
              <Input
                value={row.workerCount}
                onChange={(e) => patch(row.key, 'workerCount', e.target.value)}
                inputMode="numeric"
                placeholder="ishchi"
                aria-label="Ishchilar soni"
                className="text-center"
              />

              <button
                type="button"
                onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                disabled={rows.length === 1}
                aria-label={`${index + 1}-bosqichni olib tashlash`}
                className="text-faint mt-0.5 grid size-8 place-items-center rounded-lg transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-40 dark:hover:bg-danger-500/10"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        {rows.length < MAX_ROWS ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setRows((current) => [
                ...current,
                {
                  key: nextKey(),
                  name: '',
                  // Yangi qator oldingisining tugashidan boshlanadi —
                  // ketma-ket rejada eng ko‘p uchraydigan holat.
                  plannedStart:
                    current.at(-1)?.plannedEnd ?? object.plannedStartDate.slice(0, 10),
                  plannedEnd: object.plannedEndDate.slice(0, 10),
                  weight: '',
                  workerCount: '',
                },
              ])
            }
            leftIcon={<Plus className="size-3.5" />}
          >
            Bosqich qo‘shish
          </Button>
        ) : null}

        {existing.length > 0 ? (
          <p className="rounded-lg bg-warn-50 px-3 py-2 text-meta text-warn-700 dark:bg-warn-500/10 dark:text-warn-500">
            Diqqat: saqlanganda mavjud {existing.length} ta bosqich shu ro‘yxat bilan
            ALMASHTIRILADI.
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

/** Mavjud reja bo‘lsa — undan, bo‘lmasa namunadan boshlanadi. */
function initialRows(object: ConstructionObject, existing: Milestone[]): Row[] {
  if (existing.length > 0) {
    return existing.map((m) => ({
      key: m.id,
      name: m.name,
      plannedStart: m.plannedStart.slice(0, 10),
      plannedEnd: m.plannedEnd.slice(0, 10),
      weight: String(m.weight),
      workerCount: m.workerCount === null ? '' : String(m.workerCount),
    }));
  }

  /*
   * Namunaviy bosqichlar obyekt muddatiga ULUSHLARIGA MUTANOSIB
   * taqsimlanadi: 8% lik hujjat bosqichi 25% lik karkas bosqichi bilan
   * bir xil muddat olsa, kalendar birinchi kunidanoq noto‘g‘ri bo‘lardi.
   */
  const start = new Date(`${object.plannedStartDate.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${object.plannedEndDate.slice(0, 10)}T00:00:00Z`);
  const totalDays = Math.max(
    TEMPLATE.length,
    Math.round((end.getTime() - start.getTime()) / 86_400_000),
  );

  let cursor = start;
  return TEMPLATE.map((item) => {
    const span = Math.max(1, Math.round((totalDays * item.weight) / 100));
    const from = cursor;
    const to = addDays(from, span - 1);
    cursor = addDays(to, 1);
    return {
      key: nextKey(),
      name: item.name,
      plannedStart: toInputDate(from),
      plannedEnd: toInputDate(to > end ? end : to),
      weight: String(item.weight),
      workerCount: '',
    };
  });
}

function rowError(row: Row): string | undefined {
  if (row.name.trim().length < 2) return 'Bosqich nomi kamida 2 belgi';
  if (!row.plannedStart || !row.plannedEnd) return 'Muddat to‘liq emas';
  if (row.plannedEnd < row.plannedStart) return 'Tugash sanasi boshlanishdan oldin';
  const weight = Number(row.weight);
  if (!row.weight.trim() || !Number.isFinite(weight) || weight <= 0) return 'Ulush noldan katta bo‘lsin';
  if (row.workerCount.trim()) {
    const workers = Number(row.workerCount);
    if (!Number.isInteger(workers) || workers < 0) return 'Ishchilar soni — butun musbat son';
  }
  return undefined;
}
