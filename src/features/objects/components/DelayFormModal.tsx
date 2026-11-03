import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCatalogs, useCreateDelay, type CreateDelayBody } from '@/shared/api/queries';
import type { RiskLevel } from '@/shared/api/types';
import { RISK_META } from '@/shared/constants/health';
import { Button, Field, Input, Modal, Select, Textarea } from '@/shared/ui';
import { tashkentToday, toInputDate } from '@/shared/utils/date.utils';

/** Serverdagi `@MinLength(10)` bilan AYNI. */
const MIN_DESCRIPTION = 10;

interface FormState {
  reasonId: string;
  delayDays: string;
  severity: RiskLevel;
  description: string;
  mitigationPlan: string;
  detectedAt: string;
}

/**
 * KECHIKISH / RISK QAYD ETISH.
 *
 * ⚠️ Yozuv obyekt HOLATIGA ta’sir qiladi: ochiq muammolar soni risk
 * formulasiga kiradi va dashboarddagi «Xavfli holatda» kartasi
 * o‘zgaradi. Shuning uchun izoh MAJBURIY va kamida 10 belgi —
 * «kechikdi» degan bir so‘zlik yozuv keyinroq hech narsa
 * tushuntirmasdi.
 */
export function DelayFormModal({
  open,
  onClose,
  objectId,
}: {
  open: boolean;
  onClose: () => void;
  objectId: string;
}) {
  const catalogs = useCatalogs();
  const create = useCreateDelay();

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

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.reasonId) errors.reasonId = 'Sabab tanlanmagan';
  const days = Number(form.delayDays);
  if (!form.delayDays.trim()) errors.delayDays = 'Kun soni kiritilmagan';
  else if (!Number.isInteger(days) || days < 0 || days > 3650) errors.delayDays = '0 … 3650 oralig‘ida butun son';
  if (form.description.trim().length < MIN_DESCRIPTION) {
    errors.description = `Kamida ${MIN_DESCRIPTION} belgi — muammo nimada ekanini yozing`;
  }

  const show = (key: keyof FormState) => (touched ? errors[key] : undefined);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) return;

    const body: CreateDelayBody = {
      objectId,
      reasonId: form.reasonId,
      delayDays: days,
      description: form.description.trim(),
      severity: form.severity,
      detectedAt: form.detectedAt,
    };
    if (form.mitigationPlan.trim()) body.mitigationPlan = form.mitigationPlan.trim();

    try {
      await create.mutateAsync(body);
      toast.success('Kechikish qayd etildi');
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
      title="Kechikish qayd etish"
      description="Yozuv obyekt risk bahosiga kiradi va dashboardda darhol ko‘rinadi."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Bekor qilish
          </Button>
          <Button type="submit" form="delay-form" loading={create.isPending}>
            Qayd etish
          </Button>
        </>
      }
    >
      <form id="delay-form" onSubmit={submit} className="space-y-4" noValidate>
        <Select
          label="Sababi"
          required
          error={show('reasonId')}
          placeholder="Tanlang…"
          value={form.reasonId}
          onChange={(e) => set('reasonId', e.target.value)}
          options={(catalogs.data?.delayReasons ?? []).map((item) => ({
            value: item.id,
            label: item.name,
          }))}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Kechikish, kun" required error={show('delayDays')}>
            <Input
              value={form.delayDays}
              onChange={(e) => set('delayDays', e.target.value)}
              inputMode="numeric"
              placeholder="42"
            />
          </Field>
          <Select
            label="Jiddiyligi"
            value={form.severity}
            onChange={(e) => set('severity', e.target.value as RiskLevel)}
            options={(Object.keys(RISK_META) as RiskLevel[]).map((level) => ({
              value: level,
              label: RISK_META[level].label,
            }))}
          />
          <Field label="Aniqlangan sana" hint="Kelajakdagi sana qabul qilinmaydi">
            <Input
              type="date"
              value={form.detectedAt}
              max={toInputDate(tashkentToday())}
              onChange={(e) => set('detectedAt', e.target.value)}
            />
          </Field>
        </div>

        <Textarea
          label="Muammo tavsifi"
          required
          rows={3}
          error={show('description')}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Masalan: Qurilish materiallari yetkazib berilmadi — temir-beton konstruksiyalar kechikmoqda"
        />

        <Textarea
          label="Bartaraf etish rejasi"
          rows={2}
          value={form.mitigationPlan}
          onChange={(e) => set('mitigationPlan', e.target.value)}
          placeholder="Ixtiyoriy — qanday hal qilinadi"
        />
      </form>
    </Modal>
  );
}

function initial(): FormState {
  return {
    reasonId: '',
    delayDays: '',
    severity: 'medium',
    description: '',
    mitigationPlan: '',
    detectedAt: toInputDate(tashkentToday()),
  };
}
