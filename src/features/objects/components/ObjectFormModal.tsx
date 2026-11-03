import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useCatalogs,
  useContractors,
  useCreateObject,
  useCustomers,
  useDistricts,
  useUpdateObject,
  useUsers,
  type CreateObjectBody,
} from '@/shared/api/queries';
import type { ConstructionObject } from '@/shared/api/types';
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui';
import { useFilterParams } from '@/store/filters.store';
import { LocationPicker } from './LocationPicker';

interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Berilsa — TAHRIRLASH rejimi.
   *
   * ⚠️ Yaratish va tahrirlash BITTA forma: ikki nusxa bo‘lsa, yangi
   * maydon qo‘shilganda u bittasiga qo‘shilib, ikkinchisida esdan
   * chiqardi — eng ko‘p uchraydigan forma xatosi aynan shu.
   */
  object?: ConstructionObject;
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
export function ObjectFormModal({ open, onClose, object }: Props) {
  const editing = Boolean(object);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [touched, setTouched] = useState(false);

  /**
   * ⚠️ Forma RENDER PAYTIDA moslanadi, `useEffect` bilan EMAS.
   *
   * Bitta oyna ketma-ket ikki obyekt uchun ochilishi mumkin; `useState`
   * boshlang‘ich qiymati faqat birinchisida ishlardi va ikkinchisida
   * eski ma'lumot turib qolardi. Effekt esa ortiqcha render boshlaydi
   * va bir lahzaga ESKI ma'lumotni ko‘rsatib yuboradi — React hujjati
   * aynan shu holat uchun «props o‘zgarganda holatni moslash»
   * naqshini tavsiya qiladi.
   */
  const sessionKey = open ? (object?.id ?? 'new') : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setForm(object && sessionKey ? toFormState(object) : EMPTY);
    setTouched(false);
  }

  const params = useFilterParams();
  const catalogs = useCatalogs();
  const districts = useDistricts(params.regionId);
  const customers = useCustomers({ limit: 200 });
  const contractors = useContractors({ limit: 200, status: 'active' });
  /**
   * ⚠️ `useResponsibles` ISHLATILMAYDI. U mas'ullar HISOBOTI uchun:
   * so‘rovida `HAVING COUNT(objects) > 0` bor, ya'ni allaqachon obyekti
   * bor odamlarnigina qaytaradi. Tanlov ro‘yxati sifatida ishlatilsa,
   * yangi kuratorga BIRINCHI obyektni hech qachon biriktirib
   * bo‘lmasdi — ro‘yxatda u umuman ko‘rinmasdi.
   *
   * Rollar: kurator, tuman va viloyat admini. Pudratchi vakili
   * (tashqi odam) va ko‘ruvchi mas'ul bo‘la olmaydi.
   */
  const responsibles = useUsers({
    role: 'supervisor,district_admin,region_admin',
    isActive: true,
    limit: 200,
  });
  const create = useCreateObject();
  const update = useUpdateObject(object?.id ?? '');
  const pending = create.isPending || update.isPending;

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
    /**
     * ⚠️ IXTIYORIY maydon bo‘sh qolganda:
     *   yaratishda  — UMUMAN yuborilmaydi (server sukut qiymatini oladi);
     *   tahrirlashda — `null` yuboriladi.
     *
     * Farq muhim: tahrirlashda ham «yubormaslik» qilinса, mas’ulni
     * tanlovdan olib tashlash HECH NARSA qilmasdi — maydon so‘rovga
     * tushmay, eski qiymat joyida qolardi. Ya’ni biriktirib bo‘lardi,
     * lekin BEKOR QILIB bo‘lmasdi.
     */
    const optional = <T,>(value: T | null, filled: boolean) => {
      if (filled) return value;
      return editing ? null : undefined;
    };

    const assign = <K extends keyof CreateObjectBody>(
      key: K,
      value: CreateObjectBody[K] | null | undefined,
    ) => {
      if (value !== undefined) (body as unknown as Record<string, unknown>)[key] = value;
    };

    assign('description', optional(form.description.trim(), form.description.trim() !== ''));
    assign('address', optional(form.address.trim(), form.address.trim() !== ''));

    const hasCoords = form.lat.trim() !== '' && form.lng.trim() !== '';
    assign('lat', optional(hasCoords ? Number(form.lat) : null, hasCoords));
    assign('lng', optional(hasCoords ? Number(form.lng) : null, hasCoords));

    assign('customerId', optional(form.customerId, form.customerId !== ''));
    assign('contractorId', optional(form.contractorId, form.contractorId !== ''));
    assign('responsibleId', optional(form.responsibleId, form.responsibleId !== ''));
    assign('fundingSourceId', optional(form.fundingSourceId, form.fundingSourceId !== ''));

    assign('capacity', optional(form.capacity ? Number(form.capacity) : null, form.capacity !== ''));
    assign('capacityUnit', optional(form.capacityUnit.trim(), form.capacityUnit.trim() !== ''));
    assign('floors', optional(form.floors ? Number(form.floors) : null, form.floors !== ''));

    try {
      if (object) {
        await update.mutateAsync(body);
        toast.success(`${object.code} — o‘zgarishlar saqlandi`);
      } else {
        const created = await create.mutateAsync(body);
        toast.success(`${created.code} — obyekt qo‘shildi`);
      }
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
      title={editing ? `${object?.code} — tahrirlash` : 'Yangi obyekt'}
      description={
        editing
          ? 'Mas’ul shaxs, pudratchi va boshqa ma’lumotlarni shu yerdan o‘zgartirasiz. Bajarilish foizi alohida amal bilan yangilanadi.'
          : 'Yulduzcha bilan belgilangan maydonlar majburiy. Qolganlarini keyin ham to‘ldirish mumkin.'
      }
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="object-form" loading={pending}>
            {editing ? 'Saqlash' : 'Qo‘shish'}
          </Button>
        </>
      }
    >
      <form id="object-form" onSubmit={submit} className="space-y-4" noValidate>
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
            options={(responsibles.data?.items ?? []).map((user) => {
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

        {/* ───── Joylashuv ───── */}
        <fieldset className="rounded-xl border border-cell p-3 sm:p-4">
          <legend className="t-label px-1.5">Xaritadagi joylashuvi</legend>

          {/*
            ⚠️ XARITA va QO‘LDA KIRITISH — IKKALASI ham bor, biri
            ikkinchisining o‘rnini bosmaydi. Xaritadan bosish — odatiy
            yo‘l; raqamli maydonlar esa GPS qurilmadan yoki Excel’dan
            ko‘chirilgan aniq koordinatani kiritish uchun kerak.
            Ular BIR holatga bog‘langan: birini o‘zgartirsang ikkinchisi
            darhol ergashadi.
          */}
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            districtId={form.districtId || undefined}
            onChange={(lat, lng) => setForm((prev) => ({ ...prev, lat, lng }))}
          />

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Kenglik (lat)" error={show('lat')}>
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
          </div>
        </fieldset>

        {/* ───── Qo‘shimcha ───── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Quvvat" error={show('capacity')}>
            <Input
              value={form.capacity}
              onChange={(e) => set('capacity', e.target.value)}
              inputMode="numeric"
              placeholder="600"
            />
          </Field>
          <Field label="Quvvat birligi">
            <Input
              value={form.capacityUnit}
              onChange={(e) => set('capacityUnit', e.target.value)}
              placeholder="ishchi o‘rni"
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

        <Field label="Izoh">
          <Textarea
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Ixtiyoriy"
          />
        </Field>
      </form>
    </Modal>
  );
}

/** Mavjud obyektni forma holatiga aylantiradi. */
function toFormState(object: ConstructionObject): FormState {
  return {
    name: object.name,
    districtId: object.districtId,
    typeId: object.typeId,
    totalCost: object.totalCost,
    // ⚠️ `<input type="date">` FAQAT `YYYY-MM-DD` ni tushunadi;
    // serverdan ISO instant kelsa, maydon bo‘sh ko‘rinardi.
    plannedStartDate: object.plannedStartDate.slice(0, 10),
    plannedEndDate: object.plannedEndDate.slice(0, 10),
    address: object.address ?? '',
    customerId: object.customerId ?? '',
    contractorId: object.contractorId ?? '',
    responsibleId: object.responsibleId ?? '',
    fundingSourceId: object.fundingSourceId ?? '',
    lat: object.lat === null || object.lat === undefined ? '' : String(object.lat),
    lng: object.lng === null || object.lng === undefined ? '' : String(object.lng),
    capacity: object.capacity === null || object.capacity === undefined ? '' : String(object.capacity),
    capacityUnit: object.capacityUnit ?? '',
    floors: object.floors === null || object.floors === undefined ? '' : String(object.floors),
    description: object.description ?? '',
  };
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
