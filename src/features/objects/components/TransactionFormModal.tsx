import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCreateTransaction, type CreateTransactionBody } from '@/shared/api/queries';
import type { FundingAllocation, FundingTxType } from '@/shared/api/types';
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui';
import { tashkentToday, toInputDate } from '@/shared/utils/date.utils';
import { formatMoneyFull } from '@/shared/utils/money.utils';

const TYPE_OPTIONS: Array<{ value: FundingTxType; label: string }> = [
  { value: 'allocation', label: 'Mablag‘ ajratildi' },
  { value: 'payment', label: 'To‘lov' },
  { value: 'adjustment', label: 'Tuzatish (manfiy bo‘lishi mumkin)' },
];

/** Serverdagi `@MinLength(5)` bilan AYNI. */
const MIN_NOTE = 5;

interface FormState {
  type: FundingTxType;
  amount: string;
  occurredAt: string;
  documentNumber: string;
  allocationId: string;
  note: string;
}

/**
 * MOLIYAVIY HARAKAT QAYD ETISH.
 *
 * ⚠️ IZOH MAJBURIY — pul harakatining sababi yozuvda qolishi kerak.
 * Bu server qoidasi va interfeys uni takrorlaydi, chunki odam buni
 * yuborishdan OLDIN bilishi kerak.
 *
 * ⚠️ Faqat «Tuzatish» turida manfiy summa qabul qilinadi: «ajratildi»
 * yoki «to‘lov» manfiy bo‘lsa, u aslida tuzatish — nomi boshqa
 * bo‘lsa, hisobotdagi «ajratilgan mablag‘» raqami kamayib,
 * tushuntirib bo‘lmas holatga tushardi.
 */
export function TransactionFormModal({
  open,
  onClose,
  objectId,
  allocations,
}: {
  open: boolean;
  onClose: () => void;
  objectId: string;
  allocations: FundingAllocation[];
}) {
  const create = useCreateTransaction();
  const [form, setForm] = useState<FormState>(() => initial());
  const [touched, setTouched] = useState(false);

  const sessionKey = open ? objectId : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm(initial());
    setTouched(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const raw = form.amount.replace(/[\s ]/g, '');
  const amount = Number(raw);
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!raw) errors.amount = 'Summa kiritilmagan';
  else if (!Number.isFinite(amount) || amount === 0) errors.amount = 'Noldan farqli son bo‘lishi kerak';
  else if (amount < 0 && form.type !== 'adjustment') {
    errors.amount = 'Manfiy summa faqat «Tuzatish» turida yoziladi';
  }
  if (form.note.trim().length < MIN_NOTE) errors.note = `Kamida ${MIN_NOTE} belgi — sababini yozing`;
  if (!form.occurredAt) errors.occurredAt = 'Sana tanlanmagan';

  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const body: CreateTransactionBody = {
      objectId,
      type: form.type,
      amount: raw,
      occurredAt: form.occurredAt,
      note: form.note.trim(),
    };
    if (form.documentNumber.trim()) body.documentNumber = form.documentNumber.trim();
    if (form.allocationId) body.allocationId = form.allocationId;

    try {
      await create.mutateAsync(body);
      toast.success('Moliyaviy harakat qayd etildi');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={create.isPending ? () => undefined : onClose}
      size="lg"
      title="Moliyaviy harakat qayd etish"
      description="Yozuv obyektning ajratilgan va to‘langan summalariga darhol ta’sir qiladi."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="tx-form" loading={create.isPending}>
            Qayd etish
          </Button>
        </>
      }
    >
      <form id="tx-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Harakat turi"
            required
            value={form.type}
            onChange={(e) => set('type', e.target.value as FundingTxType)}
            options={TYPE_OPTIONS}
          />
          <Field
            label="Summa (so‘m)"
            required
            error={show('amount')}
            hint={Number.isFinite(amount) && amount !== 0 ? formatMoneyFull(raw) : undefined}
          >
            <Input
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              inputMode="numeric"
              placeholder="3500000000"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sana" required error={show('occurredAt')}>
            <Input
              type="date"
              value={form.occurredAt}
              onChange={(e) => set('occurredAt', e.target.value)}
            />
          </Field>
          <Field label="Hujjat raqami">
            <Input
              value={form.documentNumber}
              onChange={(e) => set('documentNumber', e.target.value)}
              placeholder="№ 318-T"
            />
          </Field>
        </div>

        {allocations.length > 0 ? (
          <Select
            label="Yillik rejaga bog‘lash"
            placeholder="— bog‘lanmagan —"
            hint="Tanlansa, harakat o‘sha yilgi reja bajarilishiga hisoblanadi"
            value={form.allocationId}
            onChange={(e) => set('allocationId', e.target.value)}
            options={allocations.map((item) => ({
              value: item.id,
              label: `${item.year}-yil · ${formatMoneyFull(item.plannedAmount)}`,
            }))}
          />
        ) : null}

        <Textarea
          label="Izoh"
          required
          rows={2}
          error={show('note')}
          value={form.note}
          onChange={(e) => set('note', e.target.value)}
          placeholder="Masalan: Oktabr oyi uchun bajarilgan ishlar to‘lovi"
        />
      </form>
    </Modal>
  );
}

function initial(): FormState {
  return {
    type: 'payment',
    amount: '',
    occurredAt: toInputDate(tashkentToday()),
    documentNumber: '',
    allocationId: '',
    note: '',
  };
}
