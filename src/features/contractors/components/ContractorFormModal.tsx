import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useCreateContractor,
  useUpdateContractor,
  type CreateContractorBody,
} from '@/shared/api/queries';
import type { Contractor } from '@/shared/api/types';
import { Button, Field, Input, Modal, Textarea } from '@/shared/ui';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Berilsa — TAHRIRLASH rejimi. */
  contractor?: Contractor;
}

interface FormState {
  name: string;
  inn: string;
  director: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  foundedYear: string;
  employeesCount: string;
  note: string;
}

const EMPTY: FormState = {
  name: '',
  inn: '',
  director: '',
  phone: '+998',
  email: '',
  address: '',
  licenseNumber: '',
  licenseExpiry: '',
  foundedYear: '',
  employeesCount: '',
  note: '',
};

/**
 * PUDRATCHI — qo‘shish va tahrirlash.
 *
 * ⚠️ REYTING bu yerda YO‘Q va qo‘lda kiritilmaydi: u obyektlarning
 * muddatida topshirilishidan avtomatik hisoblanadi. Qo‘lda yozish
 * imkoni bo‘lsa, ko‘rsatkich o‘lchov bo‘lishdan to‘xtab, fikrga
 * aylanardi.
 *
 * ⚠️ HOLAT (to‘xtatilgan / qora ro‘yxat) ham bu yerda emas: u sababi
 * bilan yoziladigan ALOHIDA qaror va alohida yo‘lga ega
 * (`POST /contractors/:id/status`).
 */
export function ContractorFormModal({ open, onClose, contractor }: Props) {
  const editing = Boolean(contractor);
  const create = useCreateContractor();
  const update = useUpdateContractor(contractor?.id ?? '');
  const pending = create.isPending || update.isPending;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  const sessionKey = open ? (contractor?.id ?? 'new') : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm(contractor && sessionKey ? toFormState(contractor) : EMPTY);
    setTouched(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = useMemo(() => validate(form), [form]);
  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const body: CreateContractorBody = {
      name: form.name.trim(),
      inn: form.inn.trim(),
    };
    const text = (key: keyof FormState) => {
      const value = form[key].trim();
      return value === '' ? undefined : value;
    };
    body.director = text('director');
    body.email = text('email');
    body.address = text('address');
    body.licenseNumber = text('licenseNumber');
    body.licenseExpiry = text('licenseExpiry');
    body.note = text('note');

    const phone = form.phone.trim();
    if (phone && phone !== '+998') body.phone = phone;
    if (form.foundedYear.trim()) body.foundedYear = Number(form.foundedYear);
    if (form.employeesCount.trim()) body.employeesCount = Number(form.employeesCount);

    /*
     * ⚠️ Bo‘sh ixtiyoriy maydon UMUMAN yuborilmaydi (`undefined`), `''`
     * emas: server `@IsEmail`/`@IsDateString` ni bo‘sh satrga ham
     * qo‘llaydi va «email formati noto‘g‘ri» deb rad etardi.
     */
    for (const key of Object.keys(body) as Array<keyof CreateContractorBody>) {
      if (body[key] === undefined) delete body[key];
    }

    try {
      if (contractor) {
        await update.mutateAsync(body);
        toast.success(`«${body.name}» yangilandi`);
      } else {
        await create.mutateAsync(body);
        toast.success(`«${body.name}» qo‘shildi`);
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
      title={editing ? `${contractor?.name} — tahrirlash` : 'Yangi pudratchi'}
      description={
        editing
          ? 'Reyting va holat bu yerda o‘zgarmaydi — ular alohida hisoblanadi va alohida qaror bilan belgilanadi.'
          : 'Pudratchi qo‘shilgach, uni obyektga biriktirish mumkin bo‘ladi.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="contractor-form" loading={pending}>
            {editing ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <form id="contractor-form" onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Tashkilot nomi" required error={show('name')}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="“Andijon Qurilish Invest” MChJ"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="STIR" required error={show('inn')} hint="9 ta raqam">
            <Input
              value={form.inn}
              onChange={(e) => set('inn', e.target.value)}
              inputMode="numeric"
              placeholder="301234567"
            />
          </Field>
          <Field label="Rahbar">
            <Input
              value={form.director}
              onChange={(e) => set('director', e.target.value)}
              placeholder="Shuhrat Mamatqulov"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" error={show('phone')} hint="+998XXXXXXXXX">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Email" error={show('email')}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="info@tashkilot.uz"
            />
          </Field>
        </div>

        <Field label="Manzil">
          <Input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Andijon shahri, …"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Litsenziya raqami">
            <Input
              value={form.licenseNumber}
              onChange={(e) => set('licenseNumber', e.target.value)}
              placeholder="QL-2021-00418"
            />
          </Field>
          <Field label="Litsenziya amal qilish muddati">
            <Input
              type="date"
              value={form.licenseExpiry}
              onChange={(e) => set('licenseExpiry', e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tashkil etilgan yil" error={show('foundedYear')}>
            <Input
              value={form.foundedYear}
              onChange={(e) => set('foundedYear', e.target.value)}
              inputMode="numeric"
              placeholder="2011"
            />
          </Field>
          <Field label="Xodimlar soni" error={show('employeesCount')}>
            <Input
              value={form.employeesCount}
              onChange={(e) => set('employeesCount', e.target.value)}
              inputMode="numeric"
              placeholder="240"
            />
          </Field>
        </div>

        <Field label="Izoh">
          <Textarea
            rows={2}
            value={form.note}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Ixtiyoriy"
          />
        </Field>
      </form>
    </Modal>
  );
}

function toFormState(c: Contractor): FormState {
  return {
    name: c.name,
    inn: c.inn,
    director: c.director ?? '',
    phone: c.phone ?? '+998',
    email: c.email ?? '',
    address: c.address ?? '',
    licenseNumber: c.licenseNumber ?? '',
    licenseExpiry: c.licenseExpiry ? c.licenseExpiry.slice(0, 10) : '',
    foundedYear: c.foundedYear === null ? '' : String(c.foundedYear),
    employeesCount: c.employeesCount === null ? '' : String(c.employeesCount),
    note: c.note ?? '',
  };
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 3) errors.name = 'Kamida 3 belgi';
  else if (form.name.trim().length > 200) errors.name = '200 belgidan oshmasin';

  if (!/^\d{9}$/.test(form.inn.trim())) errors.inn = 'STIR aniq 9 ta raqam bo‘lishi kerak';

  const phone = form.phone.trim();
  if (phone && phone !== '+998' && !/^\+998\d{9}$/.test(phone)) {
    errors.phone = '+998XXXXXXXXX ko‘rinishida bo‘lsin';
  }

  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email formati noto‘g‘ri';

  const year = Number(form.foundedYear);
  if (form.foundedYear.trim() && (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear())) {
    errors.foundedYear = `1900 … ${new Date().getFullYear()} oralig‘ida`;
  }

  const employees = Number(form.employeesCount);
  if (form.employeesCount.trim() && (!Number.isInteger(employees) || employees < 0)) {
    errors.employeesCount = 'Butun musbat son';
  }

  return errors;
}
