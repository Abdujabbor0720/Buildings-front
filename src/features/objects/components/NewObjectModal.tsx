import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useCatalogs,
  useContractors,
  useCreateObject,
  useCustomers,
  useDistricts,
  useResponsibles,
  type CreateObjectBody,
} from '@/shared/api/queries';
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui';
import { useFilterParams } from '@/store/filters.store';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Forma holati — HAMMASI matn. Son va sanaga aylantirish yuborishdan oldin. */
interface FormState {
  name: string;
  districtId: string;
  typeId: string;
  totalCost: string;
  plannedStartDate: string;
  plannedEndDate: string;
  address: string;
  customerId: string;
  contractorId: string;
  responsibleId: string;
  fundingSourceId: string;
  lat: string;
  lng: string;
  capacity: string;
  capacityUnit: string;
  floors: string;
  description: string;
}

const EMPTY: FormState = {
  name: '',
  districtId: '',
  typeId: '',
  totalCost: '',
  plannedStartDate: '',
  plannedEndDate: '',
  address: '',
  customerId: '',
  contractorId: '',
  responsibleId: '',
  fundingSourceId: '',
  lat: '',
  lng: '',
  capacity: '',
  capacityUnit: '',
  floors: '',
  description: '',
};

/**
 * YANGI OBYEKT QO‘SHISH.
 *
 * ⚠️ Tekshiruv MIJOZDA ham, SERVERDA ham bor va bu takrorlanish EMAS:
 * mijozdagi tekshiruv odamga darhol aytadi, serverdagisi esa yagona
 * haqiqat (mijozni chetlab o‘tish mumkin). Mijozda faqat SHAKL
 * tekshiriladi — «tuman mavjudmi», «pudratchi faolmi» kabi savollar
 * serverda qoladi.
 *
 * ⚠️ Mas’ul shaxs MAJBURIY EMAS. Qabulxona obyektni darhol kiritadi,
 * mas’ul keyin biriktiriladi — majburiy qilinsa, ma’lumot umuman
 * kiritilmay qolardi. Buning o‘rniga forma ogohlantiradi.
 */
export function NewObjectModal({ open, onClose }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  const params = useFilterParams();
  const catalogs = useCatalogs();
  const districts = useDistricts(params.regionId);
  const customers = useCustomers({ limit: 200 });
  const contractors = useContractors({ limit: 200, status: 'active' });
  const responsibles = useResponsibles(params.regionId);
  const create = useCreateObject();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = useMemo(() => validate(form), [form]);
  const hasErrors = Object.keys(errors).length > 0;

  const close = () => {
    setForm(EMPTY);
    setTouched(false);
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (hasErrors) return;

    const body: CreateObjectBody = {
      name: form.name.trim(),
      districtId: form.districtId,
      typeId: form.typeId,
      // ⚠️ Server `IsNumberString` kutadi — bo‘shliqlar tozalanadi,
      // aks holda «21 500 000 000» validatsiyadan o‘tmasdi.
      totalCost: form.totalCost.replace(/[\s ]/g, ''),
      plannedStartDate: form.plannedStartDate,
      plannedEndDate: form.plannedEndDate,
    };
    if (form.description.trim()) body.description = form.description.trim();
    if (form.address.trim()) body.address = form.address.trim();
    if (form.lat && form.lng) {
      body.lat = Number(form.lat);
      body.lng = Number(form.lng);
    }
    if (form.customerId) body.customerId = form.customerId;
    if (form.contractorId) body.contractorId = form.contractorId;
    if (form.responsibleId) body.responsibleId = form.responsibleId;
    if (form.fundingSourceId) body.fundingSourceId = form.fundingSourceId;
    if (form.capacity) body.capacity = Number(form.capacity);
    if (form.capacityUnit.trim()) body.capacityUnit = form.capacityUnit.trim();
    if (form.floors) body.floors = Number(form.floors);

    try {
      const created = await create.mutateAsync(body);
      toast.success(`${created.code} — obyekt qo‘shildi`);
      close();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title="Yangi obyekt"
      description="Yulduzcha bilan belgilangan maydonlar majburiy. Qolganlarini keyin ham to‘ldirish mumkin."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="new-object-form" loading={create.isPending}>
            Qo‘shish
          </Button>
        </>
      }
    >
      <form id="new-object-form" onSubmit={submit} className="space-y-4" noValidate>
        {/* ───── Asosiy ───── */}
        <Field label="Obyekt nomi" required error={show('name')}>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Masalan: Baliqchi tumani 7-son maktab"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Tuman"
            required
            error={show('districtId')}
            placeholder="Tanlang…"
            value={form.districtId}
            onChange={(e) => set('districtId', e.target.value)}
            options={(districts.data ?? []).map((d) => ({ value: d.id, label: d.name }))}
          />

          <Select
            label="Qurilish turi"
            required
            error={show('typeId')}
            placeholder="Tanlang…"
            value={form.typeId}
            onChange={(e) => set('typeId', e.target.value)}
            options={(catalogs.data?.constructionTypes ?? []).map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Qiymati (so‘m)" required error={show('totalCost')}>
            <Input
              value={form.totalCost}
              onChange={(e) => set('totalCost', e.target.value)}
              inputMode="numeric"
              placeholder="21500000000"
            />
          </Field>
          <Field label="Reja: boshlanishi" required error={show('plannedStartDate')}>
            <Input
              type="date"
              value={form.plannedStartDate}
              onChange={(e) => set('plannedStartDate', e.target.value)}
            />
          </Field>
          <Field label="Reja: tugashi" required error={show('plannedEndDate')}>
            <Input
              type="date"
              value={form.plannedEndDate}
              onChange={(e) => set('plannedEndDate', e.target.value)}
            />
          </Field>
        </div>

        <Field label="Manzil">
          <Input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="Tuman, mahalla, ko‘cha"
          />
        </Field>

        {/* ───── Ishtirokchilar ───── */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Buyurtmachi"
            placeholder="— tanlanmagan —"
            value={form.customerId}
            onChange={(e) => set('customerId', e.target.value)}
            options={(customers.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />

          <Select
            label="Pudratchi"
            placeholder="— tanlanmagan —"
            value={form.contractorId}
            onChange={(e) => set('contractorId', e.target.value)}
            options={(contractors.data?.items ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* ⚠️ `useResponsibles` MAS'ULLAR STATISTIKASINI qaytaradi
              (`{ user, objectCount, … }`), foydalanuvchini emas —
              shuning uchun `item.user` orqali olinadi. */}
          <Select
            label="Mas’ul shaxs"
            hint={
              form.responsibleId
                ? undefined
                : 'Hozir tanlanmasa ham bo‘ladi — obyekt yaratilgach biriktirasiz'
            }
            placeholder="— tanlanmagan —"
            value={form.responsibleId}
            onChange={(e) => set('responsibleId', e.target.value)}
            options={(responsibles.data ?? []).map(({ user }) => {
              const name = `${user.lastName} ${user.firstName}`.trim();
              return {
                value: user.id,
                label: user.position ? `${name} — ${user.position}` : name,
              };
            })}
          />

          <Select
            label="Moliyalashtirish manbasi"
            placeholder="— tanlanmagan —"
            value={form.fundingSourceId}
            onChange={(e) => set('fundingSourceId', e.target.value)}
            options={(catalogs.data?.fundingSources ?? []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </div>

        {/* ───── Qo‘shimcha ───── */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Field
            label="Kenglik (lat)"
            error={show('lat')}
            hint={!form.lat && !form.lng ? 'Bo‘sh qolsa xaritada ko‘rinmaydi' : undefined}
          >
            <Input
              value={form.lat}
              onChange={(e) => set('lat', e.target.value)}
              inputMode="decimal"
              placeholder="40.8012"
            />
          </Field>
          <Field label="Uzunlik (lng)" error={show('lng')}>
            <Input
              value={form.lng}
              onChange={(e) => set('lng', e.target.value)}
              inputMode="decimal"
              placeholder="72.0145"
            />
          </Field>
          <Field label="Quvvat" error={show('capacity')}>
            <Input
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              inputMode="numeric"
              placeholder="600"
            />
          </Field>
          <Field label="Qavatlar" error={show('floors')}>
            <Input
              value={form.floors}
              onChange={(e) => set('floors', e.target.value)}
              inputMode="numeric"
              placeholder="3"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          <Field label="Quvvat birligi">
            <Input
              value={form.capacityUnit}
              onChange={(e) => set('capacityUnit', e.target.value)}
              placeholder="o‘quvchi o‘rni"
            />
          </Field>
          <Field label="Izoh">
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Ixtiyoriy"
            />
          </Field>
        </div>
      </form>
    </Modal>
  );
}

/**
 * ⚠️ Faqat SHAKL tekshiriladi. «Bu tuman mavjudmi», «pudratchi faolmi»
 * kabi savollar serverda qoladi — mijozdagi ro‘yxat eskirgan bo‘lishi
 * mumkin va mijoz hech qachon yagona haqiqat manbai emas.
 */
function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};

  if (form.name.trim().length < 5) errors.name = 'Kamida 5 belgi';
  else if (form.name.trim().length > 300) errors.name = '300 belgidan oshmasin';

  if (!form.districtId) errors.districtId = 'Tuman tanlanmagan';
  if (!form.typeId) errors.typeId = 'Qurilish turi tanlanmagan';

  const cost = Number(form.totalCost.replace(/[\s ]/g, ''));
  if (!form.totalCost.trim()) errors.totalCost = 'Qiymat kiritilmagan';
  else if (!Number.isFinite(cost) || cost <= 0) errors.totalCost = 'Noldan katta son bo‘lishi kerak';

  if (!form.plannedStartDate) errors.plannedStartDate = 'Sana tanlanmagan';
  if (!form.plannedEndDate) errors.plannedEndDate = 'Sana tanlanmagan';
  if (
    form.plannedStartDate &&
    form.plannedEndDate &&
    form.plannedEndDate <= form.plannedStartDate
  ) {
    errors.plannedEndDate = 'Boshlanishdan keyin bo‘lishi kerak';
  }

  // ⚠️ Koordinata JUFT: bittasi yozilib ikkinchisi tushib qolsa, obyekt
  // xaritaga noto‘g‘ri joyga tushardi.
  const hasLat = form.lat.trim() !== '';
  const hasLng = form.lng.trim() !== '';
  if (hasLat !== hasLng) {
    const message = 'Kenglik va uzunlik birga to‘ldiriladi';
    if (!hasLat) errors.lat = message;
    else errors.lng = message;
  }
  if (hasLat) {
    const lat = Number(form.lat);
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = '−90 … 90 oralig‘ida';
  }
  if (hasLng) {
    const lng = Number(form.lng);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = '−180 … 180 oralig‘ida';
  }

  for (const key of ['capacity', 'floors'] as const) {
    const raw = form[key].trim();
    if (!raw) continue;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) errors[key] = 'Butun musbat son';
  }

  return errors;
}
