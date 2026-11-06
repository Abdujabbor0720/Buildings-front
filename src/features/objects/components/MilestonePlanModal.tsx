import { GripVertical, Plus, Scale, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useReplaceMilestones, type MilestoneBody } from '@/shared/api/queries';
import type { ConstructionObject, Milestone } from '@/shared/api/types';
import { Button, Field, Input, Modal } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { addDays, formatDateRangeUz, toInputDate } from '@/shared/utils/date.utils';

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

/**
 * USTUNLAR SHABLONI — BITTA joyda.
 *
 * ⚠️ Sarlavha qatori va ma'lumot qatorlari AYNI shu doimiydan
 * foydalanadi. Ikki nusxa bo'lsa, biror ustun kengligi o'zgarganda
 * sarlavha o'z ustunidan siljib qolardi — jadval esa aynan shu
 * moslik ustiga qurilgan.
 */
const GRID_COLS = 'sm:grid-cols-[18px_1fr_130px_130px_84px_84px_32px]';

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
  const balance = describeBalance(total);

  const patch = (key: string, field: keyof Row, value: string) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, [field]: value } : row)));

  /**
   * ULUSH KATAGI — 100% DAN OSHIRIB YOZIB BO'LMAYDI.
   *
   * ⚠️ Bu QATTIQ chegara, ogohlantirish emas (biznes qarori). Ilgari
   * istalgan son yozilaverardi va yig'indi 106% bo'lib turardi;
   * foydalanuvchi buni faqat pastdagi yozuvdan bilardi, «Saqlash»
   * esa jim turardi. Endi katak qolgan ulushdan ortig'ini QABUL
   * QILMAYDI: yig'indi 100 dan oshishi strukturaviy imkonsiz.
   *
   * ⚠️ Chegara SHU QATORDAN BOSHQALARINING yig'indisidan hisoblanadi
   * (`others`), umumiy yig'indidan emas: aks holda 25% li qatorni
   * 30% ga o'zgartirmoqchi bo'lgan odam o'zining hozirgi 25% iga
   * ham joy topolmasdi.
   *
   * ⚠️ Bo'sh qiymat HAR DOIM o'tadi — foydalanuvchi katakni tozalab,
   * qaytadan yozishi kerak. Manfiy va noto'g'ri qiymat ham o'tadi:
   * uni `rowError` tushuntirib aytadi, bu yerda jim qisqartirish
   * «nega raqamim o'zgarib ketdi» degan savol tug'dirardi.
   */
  function patchWeight(key: string, raw: string) {
    const text = raw.trim();
    const typed = Number(text);
    if (!text || !Number.isFinite(typed) || typed < 0) {
      patch(key, 'weight', raw);
      return;
    }

    const others = rows.reduce(
      (sum, row) => (row.key === key ? sum : sum + (Number(row.weight) || 0)),
      0,
    );
    const allowance = Number(Math.max(0, 100 - others).toFixed(2));

    if (typed <= allowance + 0.009) {
      patch(key, 'weight', raw);
      return;
    }

    patch(key, 'weight', allowance > 0 ? String(allowance) : '');
    /*
     * ⚠️ Xabar BIR XIL `id` bilan: har bosilgan tugma uchun yangi
     * xabar chiqsa, ekran ularning ustuniga ko'milib qolardi.
     * Bir xil id eskisini ALMASHTIRADI.
     */
    toast.error(
      allowance > 0
        ? `Jami ulush 100% dan oshmaydi — bu bosqichga ko‘pi bilan ${allowance}% berish mumkin.`
        : 'Jami ulush allaqachon 100% — avval boshqa bosqich ulushini kamaytiring.',
      { id: 'milestone-weight-cap' },
    );
  }

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
          {/*
            ⚠️ Yig'indi holati MATN va CHIZIQ bilan birga ko'rsatiladi.
            Faqat matn bo'lganda «106.00%» va «100%» raqamlari bir-biriga
            o'xshab ketardi; chiziq esa «qancha oshgani» ni o'lchovsiz,
            bir qarashda aytadi.
          */}
          <div className="mr-auto min-w-0">
            <p className={cn('text-meta font-semibold', balance.tone)}>
              <span className="num">Jami ulush: {total.toFixed(2)}%</span>
              <span className="font-normal"> — {balance.message}</span>
            </p>
            <div className="bar-track mt-1 flex h-1.5 w-[220px] max-w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
              <span
                className={cn('bar-fill h-full', balance.barTone)}
                style={{ width: `${balance.fillPercent}%` }}
              />
              {balance.overPercent > 0 ? (
                <span
                  className="bar-fill h-full bg-danger-500"
                  style={{ width: `${balance.overPercent}%` }}
                />
              ) : null}
            </div>
          </div>
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
          {/*
            ⚠️ Sana `formatDateRangeUz` bilan — ilgari bu yerda xom ISO
            («2025-11-13 — 2026-09-09») chiqardi. `dates.md` qoidasi:
            foydalanuvchi ko'radigan sana faqat «13-noyabr, 2025»
            ko'rinishida bo'ladi; ISO esa FAQAT `<input type="date">`
            qiymati va so'rov parametri uchun (qator kataklaridagi
            sanalar aynan shundaylar va ular qoidadan istisno).
          */}
          <p className="text-meta text-muted">
            {rows.length} ta bosqich · obyekt muddati:{' '}
            <span className="font-medium text-strong">
              {formatDateRangeUz(object.plannedStartDate, object.plannedEndDate)}
            </span>
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

        {/*
          ⚠️ USTUN SARLAVHALARI — `sticky`. Ellikta bosqichli rejada
          ro'yxat skroll bo'lganda sarlavha ekranda qoladi, aks holda
          o'rtadagi qatorga qaragan odam «bu ustun sana edimi yoki
          ulushmi» deb yuqoriga qaytarishga majbur bo'lardi.

          ⚠️ `-mx-5 px-5` — modal tanasining to'ldirishini qoplaydi:
          fonsiz sarlavha ostidan qatorlar ko'rinib o'tardi.

          ⚠️ `sm:` dan pastda YASHIRILADI: u yerda grid bitta ustunga
          tushadi va sarlavhalar o'z maydonlaridan uzilib qolardi.
          Tor ekranda yo'l-yo'riqni placeholder va `aria-label` beradi.
        */}
        <div className="surface sticky top-0 z-10 -mx-5 hidden border-b border-subtle px-5 pt-1 pb-1.5 sm:block">
          {/*
            ⚠️ Ichki `px-2.5` — qator kartasining to'ldirishi bilan AYNI.
            Usiz sarlavhalar o'z ustunidan 10px chapga siljib turardi:
            qator `p-2.5` li karta ichida, sarlavha esa to'g'ridan-to'g'ri
            modal tanasida joylashgan.
          */}
          <div className={cn('grid gap-2 px-2.5', GRID_COLS)}>
            <span aria-hidden />
            <span className="t-label">Bosqich nomi</span>
            <span className="t-label">Boshlanishi</span>
            <span className="t-label">Tugashi</span>
            <span className="t-label text-center">Ulushi, %</span>
            <span className="t-label text-center">Ishchi</span>
            <span aria-hidden />
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.key}
              className={cn(
                'surface-muted grid grid-cols-1 items-start gap-2 rounded-xl p-2.5',
                GRID_COLS,
              )}
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
              {/* ⚠️ `patchWeight` — oddiy `patch` EMAS: aynan shu katak
                  100% chegarasini ushlab turadi (yuqoridagi izohga qarang). */}
              <Input
                value={row.weight}
                onChange={(e) => patchWeight(row.key, e.target.value)}
                inputMode="decimal"
                placeholder="%"
                aria-label="Ulushi, foiz"
                title={`Jami 100% dan oshmaydi. Hozir jami ${total.toFixed(2)}%`}
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

/**
 * YIG'INDI HOLATI — uch xil, va uchalasi ham BOSHQACHA aytiladi.
 *
 * ⚠️ Ilgari bitta formula ishlatilardi: `100 - total`. Yig'indi 100
 * dan OSHGANDA u manfiy son berib, ekranda «-1.00% yetishmayapti»
 * degan ma'nosiz yozuv chiqardi: foydalanuvchi ulushni oshirish
 * kerakmi yoki kamaytirish kerakmi, umuman tushunmasdi. Endi
 * ortiqcha va yetishmayotgan holat ALOHIDA hisoblanadi.
 *
 * ⚠️ «Ortiqcha» tarmog'i endi QO'LDA yozish orqali yuzaga kelmaydi
 * (`patchWeight` chegarasi), lekin u OLIB TASHLANMAYDI: eski
 * rejadan kelgan ma'lumot yoki kelajakda qo'shiladigan boshqa
 * yo'l 100 dan oshiq yig'indi berib qo'ysa, ekran jim qolmasligi
 * kerak. Server ham aynan shu shartni qo'yadi.
 */
function describeBalance(total: number): {
  message: string;
  tone: string;
  barTone: string;
  fillPercent: number;
  overPercent: number;
} {
  const diff = Number((total - 100).toFixed(2));

  if (Math.abs(diff) < 0.01) {
    return {
      message: 'muvozanatda, rejani saqlash mumkin',
      tone: 'text-ok-600 dark:text-ok-500',
      barTone: 'bg-ok-500',
      fillPercent: 100,
      overPercent: 0,
    };
  }

  if (diff > 0) {
    /*
     * ⚠️ Chiziq JAMI yig'indiga nisbatan o'lchanadi: 100% lik qismi
     * yashil, ortig'i qizil. Shunda «qancha oshgani» ulush sifatida
     * ko'rinadi — chiziqni 100 ga qirqib qo'yilsa, 101% va 160%
     * bir xil ko'rinardi.
     */
    return {
      message: `${diff.toFixed(2)}% ORTIQCHA — maksimal 100%`,
      tone: 'text-danger-600 dark:text-danger-400',
      barTone: 'bg-ok-500',
      fillPercent: (100 / total) * 100,
      overPercent: (diff / total) * 100,
    };
  }

  return {
    message: `yana ${Math.abs(diff).toFixed(2)}% taqsimlanishi kerak`,
    tone: 'text-warn-700 dark:text-warn-600',
    barTone: 'bg-warn-500',
    fillPercent: total,
    overPercent: 0,
  };
}

function rowError(row: Row): string | undefined {
  if (row.name.trim().length < 2) return 'Bosqich nomi kamida 2 belgi';
  if (!row.plannedStart || !row.plannedEnd) return 'Muddat to‘liq emas';
  if (row.plannedEnd < row.plannedStart) return 'Tugash sanasi boshlanishdan oldin';
  const weight = Number(row.weight);
  if (!row.weight.trim() || !Number.isFinite(weight) || weight <= 0) return 'Ulush noldan katta bo‘lsin';
  /* ⚠️ Yuqori chegara ham kerak: bitta bosqichga 120% yozilsa,
     yig'indi tekshiruvi uni ushlaydi, lekin xabar «20% ortiqcha»
     bo'lib, xato QAYSI qatorda ekani aytilmasdi. */
  if (weight > 100) return 'Ulush 100% dan oshmaydi';
  if (row.workerCount.trim()) {
    const workers = Number(row.workerCount);
    if (!Number.isInteger(workers) || workers < 0) return 'Ishchilar soni — butun musbat son';
  }
  return undefined;
}
