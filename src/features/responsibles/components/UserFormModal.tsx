import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useContractors,
  useCreateUser,
  useDistricts,
  useRegions,
  type CreateUserBody,
} from '@/shared/api/queries';
import type { UserRole } from '@/shared/api/types';
import { ROLE_LABELS } from '@/shared/constants/health';
import { Button, Field, Input, Modal, Select } from '@/shared/ui';
import { useFiltersStore } from '@/store/filters.store';

/**
 * Mas’ul bo‘la oladigan rollar — obyekt formasidagi tanlov bilan AYNI.
 *
 * ⚠️ `super_admin` bu ro‘yxatda YO‘Q: tizim egasini oddiy «mas’ul
 * qo‘shish» oynasidan yaratib bo‘lmaydi. Uning huquqi cheksiz va u
 * `.env` dagi hisob orqali beriladi.
 */
const ASSIGNABLE_ROLES: UserRole[] = [
  'supervisor',
  'district_admin',
  'region_admin',
  'governor',
  'contractor',
  'viewer',
];

const MIN_PASSWORD = 8;

interface FormState {
  lastName: string;
  firstName: string;
  middleName: string;
  position: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole | '';
  regionId: string;
  districtId: string;
  contractorId: string;
}

const EMPTY: FormState = {
  lastName: '',
  firstName: '',
  middleName: '',
  position: '',
  email: '',
  phone: '+998',
  password: '',
  role: 'supervisor',
  regionId: '',
  districtId: '',
  contractorId: '',
};

/**
 * YANGI MAS’UL / FOYDALANUVCHI.
 *
 * ⚠️ Doira (tuman, viloyat, pudratchi) ROLGA BOG‘LIQ va shart serverda
 * ham tekshiriladi:
 *   • «Pudratchi vakili» — pudratchi tashkiloti MAJBURIY;
 *   • «Tuman mas’uli»    — tuman MAJBURIY.
 * Interfeys bu maydonlarni faqat kerakli rolda ko‘rsatadi — aks holda
 * odam bo‘sh maydonlarni to‘ldirib, keyin serverdan rad javobini olardi.
 */
export function UserFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateUser();
  const { regionId: filterRegionId } = useFiltersStore();
  const regions = useRegions();
  const districts = useDistricts(undefined);
  const contractors = useContractors({ limit: 200, status: 'active' });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  const sessionKey = open ? 'open' : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm({ ...EMPTY, regionId: filterRegionId ?? '' });
    setTouched(false);
  }

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const needsDistrict = form.role === 'district_admin';
  const needsContractor = form.role === 'contractor';

  const errors = useMemo(() => validate(form), [form]);
  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const body: CreateUserBody = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      role: form.role as UserRole,
    };
    if (form.middleName.trim()) body.middleName = form.middleName.trim();
    if (form.position.trim()) body.position = form.position.trim();
    if (form.phone.trim() && form.phone.trim() !== '+998') body.phone = form.phone.trim();
    if (form.regionId) body.regionId = form.regionId;
    if (form.districtId) body.districtId = form.districtId;
    // ⚠️ Pudratchi tashkiloti FAQAT pudratchi rolida yuboriladi — server
    // boshqa rolda uni xato deb qaytaradi.
    if (needsContractor && form.contractorId) body.contractorId = form.contractorId;

    try {
      await create.mutateAsync(body);
      toast.success(`${body.lastName} ${body.firstName} qo‘shildi`);
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
      title="Yangi mas’ul"
      description="Mas’ul qo‘shilgach, uni obyektga biriktirish mumkin bo‘ladi."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="user-form" loading={create.isPending}>
            Qo‘shish
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Familiya" required error={show('lastName')}>
            <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} autoFocus />
          </Field>
          <Field label="Ism" required error={show('firstName')}>
            <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
          </Field>
          <Field label="Otasining ismi">
            <Input value={form.middleName} onChange={(e) => set('middleName', e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Roli"
            required
            error={show('role')}
            value={form.role}
            onChange={(e) => {
              const role = e.target.value as UserRole | '';
              // Rol o‘zgarsa, unga tegishli bo‘lmagan doira TOZALANADI:
              // aks holda eski qiymat jimgina yuborilib, server rad etardi.
              setForm((prev) => ({
                ...prev,
                role,
                districtId: role === 'district_admin' || role === 'supervisor' ? prev.districtId : '',
                contractorId: role === 'contractor' ? prev.contractorId : '',
              }));
            }}
            options={ASSIGNABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }))}
          />
          <Field label="Lavozimi">
            <Input
              value={form.position}
              onChange={(e) => set('position', e.target.value)}
              placeholder="Masalan: Qurilish bo‘limi boshlig‘i"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email (login)" required error={show('email')}>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="a.karimov@andijon.uz"
            />
          </Field>
          <Field
            label="Parol"
            required
            error={show('password')}
            hint={`Kamida ${MIN_PASSWORD} belgi — foydalanuvchiga aytib qo‘ying`}
          >
            <Input
              type="text"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Telefon" error={show('phone')} hint="+998XXXXXXXXX">
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" />
          </Field>
          <Select
            label="Viloyat"
            placeholder="— tanlanmagan —"
            value={form.regionId}
            onChange={(e) => set('regionId', e.target.value)}
            options={(regions.data ?? []).map((region) => ({ value: region.id, label: region.name }))}
          />
        </div>

        {needsDistrict || form.role === 'supervisor' ? (
          <Select
            label="Tuman"
            required={needsDistrict}
            error={show('districtId')}
            hint={
              needsDistrict
                ? 'Tuman mas’uli uchun majburiy'
                : 'Tanlansa — kurator faqat shu tuman obyektlarini ko‘radi'
            }
            placeholder="— tanlanmagan —"
            value={form.districtId}
            onChange={(e) => set('districtId', e.target.value)}
            options={(districts.data ?? []).map((district) => ({
              value: district.id,
              label: district.name,
            }))}
          />
        ) : null}

        {needsContractor ? (
          <Select
            label="Pudratchi tashkiloti"
            required
            error={show('contractorId')}
            hint="Pudratchi vakili faqat shu tashkilot obyektlarini ko‘radi"
            placeholder="— tanlanmagan —"
            value={form.contractorId}
            onChange={(e) => set('contractorId', e.target.value)}
            options={(contractors.data?.items ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        ) : null}
      </form>
    </Modal>
  );
}

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.lastName.trim().length < 2) errors.lastName = 'Kamida 2 belgi';
  if (form.firstName.trim().length < 2) errors.firstName = 'Kamida 2 belgi';

  const email = form.email.trim();
  if (!email) errors.email = 'Email kiritilmagan';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email formati noto‘g‘ri';

  if (form.password.length < MIN_PASSWORD) errors.password = `Kamida ${MIN_PASSWORD} belgi`;

  if (!form.role) errors.role = 'Rol tanlanmagan';
  if (form.role === 'district_admin' && !form.districtId) errors.districtId = 'Tuman tanlanmagan';
  if (form.role === 'contractor' && !form.contractorId) {
    errors.contractorId = 'Pudratchi tashkiloti tanlanmagan';
  }

  const phone = form.phone.trim();
  if (phone && phone !== '+998' && !/^\+998\d{9}$/.test(phone)) {
    errors.phone = '+998XXXXXXXXX ko‘rinishida bo‘lsin';
  }

  return errors;
}
