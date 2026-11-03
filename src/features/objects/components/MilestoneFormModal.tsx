import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCreateMilestone, useUpdateMilestone, type MilestoneBody } from '@/shared/api/queries';
import type { Milestone } from '@/shared/api/types';
import { Button, Field, Input, Modal, Textarea } from '@/shared/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  objectId: string;
  /** Berilsa — TAHRIRLASH rejimi. */
  milestone?: Milestone;
  /** Qolgan bosqichlarning ulushlari yig‘indisi — chegara shundan hisoblanadi. */
  usedWeight: number;
}

interface FormState {
  name: string;
  plannedStart: string;
  plannedEnd: string;
  weight: string;
  workerCount: string;
  progressPercent: string;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  plannedStart: '',
  plannedEnd: '',
  weight: '',
  workerCount: '',
  progressPercent: '0',
  description: '',
};

/**
 * BITTA BOSQICH — qo‘shish va tahrirlash.
 *
 * ⚠️ Yaratish va tahrirlash BITTA forma (obyekt formasi bilan AYNI
 * qoida): ikki nusxa bo‘lsa, yangi maydon bittasiga qo‘shilib
 * ikkinchisida esdan chiqardi.
 *
 * ⚠️ Bajarilish foizi bu yerda FAQAT tahrirlashda ko‘rinadi va u
 * «qo‘lda tuzatish» yo‘li. Odatiy yo‘l — TOPSHIRISH (surat bilan):
 * foizni suratlarsiz o‘zgartirish oson bo‘lsa, fotoarxiv bo‘sh
 * qolib, hisobot «ishonchli» bo‘lishdan to‘xtardi.
 */
export function MilestoneFormModal({ open, onClose, objectId, milestone, usedWeight }: Props) {
  const editing = Boolean(milestone);
  const create = useCreateMilestone(objectId);
  const update = useUpdateMilestone(objectId);
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  // Forma RENDER paytida moslanadi — `ObjectFormModal` bilan AYNI naqsh.
  const sessionKey = open ? (milestone?.id ?? 'new') : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm(milestone && sessionKey ? toFormState(milestone) : EMPTY);
    setTouched(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const remaining = Number((100 - usedWeight).toFixed(2));
  const errors = validate(form, remaining);
  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const body: MilestoneBody = {
      name: form.name.trim(),
      plannedStart: form.plannedStart,
      plannedEnd: form.plannedEnd,
      weight: Number(form.weight),
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.workerCount.trim()) body.workerCount = Number(form.workerCount);
    if (editing) body.progressPercent = Number(form.progressPercent);

    try {
      if (milestone) {
        await update.mutateAsync({ id: milestone.id, body });
        toast.success(`«${body.name}» yangilandi`);
      } else {
        await create.mutateAsync(body);
        toast.success(`«${body.name}» bosqichi qo‘shildi`);
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={open}
      onClose={pending ? () => undefined : onClose}
      size="lg"
      title={editing ? `«${milestone?.name}» — tahrirlash` : 'Yangi bosqich'}
      description={
        editing
          ? 'Bosqich o‘zgarsa, obyektning umumiy bajarilishi ham qayta hisoblanadi.'
          : `Bo‘sh ulush: ${remaining}%. Barcha bosqichlar yig‘indisi 100% bo‘lishi kerak.`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="milestone-form" loading={pending}>
            {editing ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <form id="milestone-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Bosqich nomi" required error={show('name')}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Masalan: Poydevor quyish"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Boshlanishi" required error={show('plannedStart')}>
            <Input
              type="date"
              value={form.plannedStart}
              onChange={(e) => set('plannedStart', e.target.value)}
            />
          </Field>
          <Field label="Tugashi" required error={show('plannedEnd')}>
            <Input
              type="date"
              value={form.plannedEnd}
              onChange={(e) => set('plannedEnd', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Ulushi, %"
            required
            error={show('weight')}
            hint={`Bo‘sh ulush: ${remaining}%`}
          >
            <Input
              value={form.weight}
              onChange={(e) => set('weight', e.target.value)}
              inputMode="decimal"
              placeholder="25"
            />
          </Field>

          <Field
            label="Ishchilar soni"
            error={show('workerCount')}
            hint="Shu bosqichga biriktirilgan"
          >
            <Input
              value={form.workerCount}
              onChange={(e) => set('workerCount', e.target.value)}
              inputMode="numeric"
              placeholder="18"
            />
          </Field>

          {editing ? (
            <Field
              label="Bajarilishi, %"
              error={show('progressPercent')}
              hint="Odatda topshirish orqali o‘zgaradi"
            >
              <Input
                value={form.progressPercent}
                onChange={(e) => set('progressPercent', e.target.value)}
                inputMode="decimal"
              />
            </Field>
          ) : null}
        </div>

        <Field label="Izoh">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ixtiyoriy — bosqich nimalarni qamrab oladi"
          />
        </Field>
      </form>
    </Modal>
  );
}

function toFormState(m: Milestone): FormState {
  return {
    name: m.name,
    // ⚠️ `<input type="date">` FAQAT `YYYY-MM-DD` ni tushunadi.
    plannedStart: m.plannedStart.slice(0, 10),
    plannedEnd: m.plannedEnd.slice(0, 10),
    weight: String(m.weight),
    workerCount: m.workerCount === null ? '' : String(m.workerCount),
    progressPercent: String(m.progressPercent),
    description: m.description ?? '',
  };
}

function validate(form: FormState, remaining: number): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 2) errors.name = 'Kamida 2 belgi';
  else if (form.name.trim().length > 200) errors.name = '200 belgidan oshmasin';

  if (!form.plannedStart) errors.plannedStart = 'Sana tanlanmagan';
  if (!form.plannedEnd) errors.plannedEnd = 'Sana tanlanmagan';
  if (form.plannedStart && form.plannedEnd && form.plannedEnd < form.plannedStart) {
    errors.plannedEnd = 'Boshlanishdan oldin bo‘la olmaydi';
  }

  const weight = Number(form.weight);
  if (!form.weight.trim()) errors.weight = 'Ulush kiritilmagan';
  else if (!Number.isFinite(weight) || weight <= 0) errors.weight = 'Noldan katta son';
  // ⚠️ Chegara MIJOZDA ham tekshiriladi: server baribir rad etadi, lekin
  // odam buni yuborishdan OLDIN bilishi kerak — aks holda u to‘ldirgan
  // formani yo‘qotib, qaytadan yozardi.
  else if (weight > remaining + 0.01) errors.weight = `Bo‘sh ulush ${remaining}% — ko‘pi bilan shuncha`;

  for (const key of ['workerCount'] as const) {
    const raw = form[key].trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) errors[key] = 'Butun musbat son';
  }

  const percent = Number(form.progressPercent);
  if (form.progressPercent.trim() && (!Number.isFinite(percent) || percent < 0 || percent > 100)) {
    errors.progressPercent = '0 … 100 oralig‘ida';
  }

  return errors;
}
