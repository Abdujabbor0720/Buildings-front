import type { AiVerdict, DelayStatus, MilestoneStatus, ObjectHealth, ObjectStatus, RiskLevel, UserRole, DocumentType, ContractorStatus } from '../api/types';

/**
 * HOLAT YORLIQLARI VA RANGLARI — yagona manba.
 *
 * ⚠️ Rang komponent ichida yozilmaydi. Aks holda xaritadagi «kechikayotgan»
 * bir rangda, jadvaldagisi boshqa rangda bo‘lib qolardi — foydalanuvchi esa
 * ikkalasini bir ekranda ko‘radi.
 *
 * ⚠️ BREND RANGI (ko‘k) BU YERDA ISHLATILMAYDI. U interfeys urg‘usi:
 * faol menyu, havola, fokus halqasi, asosiy tugma. Ma’lumot rangi bilan
 * bir xil bo‘lsa, «faol bo‘lim» bilan «reja asosidagi obyekt» bir
 * ko‘rinishda bo‘lib qolardi.
 *
 * ⚠️ HAMMA HEX VALIDATORDAN O‘TGAN (OKLab ΔE, protan/deutan/tritan).
 * Qo‘lda «chiroyliroq» rang qo‘yilsa, u butun to‘plamni yiqitadi —
 * o‘zgartirishdan oldin qaytadan o‘lchang.
 *
 * ⚠️ «Kechikayotgan» QAHRABO, «xavfli» esa TO‘Q QIZIL. Ikkalasi ham
 * to‘q sariq/qizil bo‘lganda ular oddiy ko‘z bilan ham ajralmasdi
 * (normal ko‘rishda ΔE 12.5, chegara 15) — xaritada yonma-yon turgan
 * ikki tuman bir xil ko‘rinardi. Endi ular YORQINLIK bilan ajraladi:
 * qahrabo yorug‘, qizil to‘q.
 *
 * ⚠️ RANG — YAGONA BELGI EMAS. Har bir chipda matn, xaritada afsona va
 * ko‘rsatma, diagrammada to‘g‘ridan-to‘g‘ri yorliq bor. Yashil ↔ qizil
 * deyteranopiyada baribir yaqin (ΔE 8.7) — buni rang bilan to‘liq hal
 * qilib bo‘lmaydi, shuning uchun matn HAR DOIM yonida turadi.
 */

export interface StatusMeta {
  label: string;
  /** Tailwind klasslari: fon + matn + chegara. */
  chip: string;
  /** Diagramma va xarita uchun HEX (yorug‘ rejim). */
  hex: string;
  /** Qorong‘i rejim uchun HEX — avtomatik «yoritish» kontrastni buzadi. */
  hexDark: string;
  /** Progress bar / indikator uchun fon klassi. */
  bar: string;
  dot: string;
}

/*
 * Chip shakli butun tizimda bir xil: 1px ichki halqa + yumshoq fon.
 *
 * ⚠️ Klass nomlari TO‘LIQ yozilgan, `bg-${tone}-50` kabi yig‘ilmagan:
 * Tailwind fayl matnidan klass qidiradi va yig‘ilgan nomni TOPA OLMAYDI —
 * natijada chip rangsiz, shaffof bo‘lib qolardi.
 */
const CHIP = {
  ok: 'bg-ok-50 text-ok-700 ring-1 ring-inset ring-ok-500/20 dark:bg-ok-500/12 dark:text-ok-300 dark:ring-ok-500/25',
  warn: 'bg-warn-50 text-warn-700 ring-1 ring-inset ring-warn-500/20 dark:bg-warn-500/12 dark:text-warn-300 dark:ring-warn-500/25',
  danger: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-500/12 dark:text-danger-300 dark:ring-danger-500/25',
  done: 'bg-done-50 text-done-700 ring-1 ring-inset ring-done-500/20 dark:bg-done-500/12 dark:text-done-300 dark:ring-done-500/25',
  neutral:
    'bg-neutral-100 text-neutral-600 ring-1 ring-inset ring-neutral-300/70 dark:bg-white/6 dark:text-neutral-300 dark:ring-white/12',
} as const;

export const HEALTH_META: Record<ObjectHealth, StatusMeta> = {
  on_schedule: {
    label: 'Reja asosida',
    chip: CHIP.ok,
    hex: '#0A924B',
    hexDark: '#2BA162',
    bar: 'bg-ok-500',
    dot: 'bg-ok-500',
  },
  delayed: {
    label: 'Kechikayotgan',
    chip: CHIP.warn,
    hex: '#DE9C31',
    hexDark: '#B7810F',
    bar: 'bg-warn-500',
    dot: 'bg-warn-500',
  },
  at_risk: {
    label: 'Xavfli holatda',
    chip: CHIP.danger,
    hex: '#AC1730',
    hexDark: '#B63039',
    bar: 'bg-danger-500',
    dot: 'bg-danger-500',
  },
  not_started: {
    label: 'Boshlanmagan',
    chip: CHIP.neutral,
    hex: '#94A6BD',
    hexDark: '#64788F',
    bar: 'bg-neutral-400',
    dot: 'bg-neutral-400',
  },
  completed: {
    label: 'Topshirilgan',
    chip: CHIP.done,
    hex: '#7B47BF',
    hexDark: '#8459C3',
    bar: 'bg-done-500',
    dot: 'bg-done-500',
  },
};

/** Xarita afsonasi — maketdagi tartibda. */
export const HEALTH_LEGEND: ObjectHealth[] = ['on_schedule', 'delayed', 'at_risk', 'not_started'];

export const STATUS_META: Record<ObjectStatus, StatusMeta> = {
  not_started: HEALTH_META.not_started,
  in_progress: {
    label: 'Jarayonda',
    chip: CHIP.ok,
    hex: '#0A924B',
    hexDark: '#2BA162',
    bar: 'bg-ok-500',
    dot: 'bg-ok-500',
  },
  completed: HEALTH_META.completed,
  suspended: {
    label: 'To‘xtatilgan',
    chip: CHIP.warn,
    hex: '#DE9C31',
    hexDark: '#B7810F',
    bar: 'bg-warn-500',
    dot: 'bg-warn-500',
  },
  cancelled: {
    label: 'Bekor qilingan',
    chip: 'bg-neutral-100 text-neutral-500 line-through ring-1 ring-inset ring-neutral-300/70 dark:bg-white/6 dark:text-neutral-400',
    hex: '#64788F',
    hexDark: '#64788F',
    bar: 'bg-neutral-500',
    dot: 'bg-neutral-500',
  },
};

export const RISK_META: Record<RiskLevel, StatusMeta> = {
  low: { label: 'Past', chip: CHIP.ok, hex: '#0A924B', hexDark: '#2BA162', bar: 'bg-ok-500', dot: 'bg-ok-500' },
  medium: { label: 'O‘rta', chip: CHIP.warn, hex: '#DE9C31', hexDark: '#B7810F', bar: 'bg-warn-500', dot: 'bg-warn-500' },
  high: { label: 'Yuqori', chip: CHIP.danger, hex: '#D1545B', hexDark: '#C9646A', bar: 'bg-danger-400', dot: 'bg-danger-400' },
  critical: { label: 'Kritik', chip: CHIP.danger, hex: '#AC1730', hexDark: '#B63039', bar: 'bg-danger-500', dot: 'bg-danger-500' },
};

export const MILESTONE_LABELS: Record<MilestoneStatus, string> = {
  planned: 'Rejalashtirilgan',
  in_progress: 'Bajarilmoqda',
  done: 'Yakunlangan',
  delayed: 'Kechikayotgan',
  cancelled: 'Bekor qilingan',
};

export const DELAY_STATUS_META: Record<DelayStatus, StatusMeta> = {
  open: { label: 'Ochiq', chip: CHIP.danger, hex: '#AC1730', hexDark: '#B63039', bar: 'bg-danger-500', dot: 'bg-danger-500' },
  mitigating: { label: 'Bartaraf etilmoqda', chip: CHIP.warn, hex: '#DE9C31', hexDark: '#B7810F', bar: 'bg-warn-500', dot: 'bg-warn-500' },
  resolved: { label: 'Hal qilingan', chip: CHIP.ok, hex: '#0A924B', hexDark: '#2BA162', bar: 'bg-ok-500', dot: 'bg-ok-500' },
};

export const AI_VERDICT_META: Record<AiVerdict, StatusMeta> = {
  confirmed: { label: 'AI tasdiqladi', chip: CHIP.ok, hex: '#0A924B', hexDark: '#2BA162', bar: 'bg-ok-500', dot: 'bg-ok-500' },
  suspicious: { label: 'AI shubhali deb topdi', chip: CHIP.warn, hex: '#DE9C31', hexDark: '#B7810F', bar: 'bg-warn-500', dot: 'bg-warn-500' },
  rejected: { label: 'AI rad etdi', chip: CHIP.danger, hex: '#AC1730', hexDark: '#B63039', bar: 'bg-danger-500', dot: 'bg-danger-500' },
  pending: {
    label: 'Tekshirilmoqda',
    chip: CHIP.neutral,
    hex: '#94A6BD',
    hexDark: '#64788F',
    bar: 'bg-neutral-400',
    dot: 'bg-neutral-400',
  },
};

export const PHOTO_STATUS_LABELS = {
  pending: 'Ko‘rib chiqilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Bosh administrator',
  governor: 'Viloyat hokimi',
  region_admin: 'Viloyat admini',
  district_admin: 'Tuman mas’uli',
  supervisor: 'Kurator',
  contractor: 'Pudratchi vakili',
  viewer: 'Kuzatuvchi',
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  project: 'Loyiha hujjatlari',
  contract: 'Shartnoma',
  expertise: 'Ekspertiza xulosasi',
  permit: 'Ruxsatnoma',
  act: 'Dalolatnoma',
  estimate: 'Smeta',
  other: 'Boshqa',
};

export const CONTRACTOR_STATUS_META: Record<ContractorStatus, StatusMeta> = {
  active: { label: 'Faol', chip: CHIP.ok, hex: '#0A924B', hexDark: '#2BA162', bar: 'bg-ok-500', dot: 'bg-ok-500' },
  suspended: { label: 'To‘xtatilgan', chip: CHIP.warn, hex: '#DE9C31', hexDark: '#B7810F', bar: 'bg-warn-500', dot: 'bg-warn-500' },
  blacklisted: { label: 'Qora ro‘yxatda', chip: CHIP.danger, hex: '#AC1730', hexDark: '#B63039', bar: 'bg-danger-500', dot: 'bg-danger-500' },
};

/**
 * KATEGORIK PALITRA — «kimligi» ni bildiruvchi ranglar (qurilish turi,
 * kechikish sababi, moliya manbasi).
 *
 * ⚠️ TARTIB O‘ZGARMAYDI va rang AYLANTIRILMAYDI. Tartib — rang
 * ko‘rmaydiganlar uchun xavfsizlik mexanizmi: qo‘shni juftliklar
 * deyteranopiya/protanopiyada ajralib turishi tekshirilgan
 * (OKLab ΔE ≥ 8, oddiy ko‘rishda ≥ 15).
 *
 * ⚠️ 8-qator yo‘q: ortiqcha turkum «Boshqa» ga yig‘iladi va NEYTRAL
 * rang oladi — chunki «boshqa» bu alohida shaxs emas, qoldiq.
 *
 * ⚠️ BU PALITRA HOLAT RANGLARI BILAN QISMAN BIR OILADA (yashil, binafsha).
 * Buni rang bilan hal qilib BO‘LMAYDI: beshta holat yashil/sariq/qizil/
 * kulrang/binafsha ni egallagan, qolgan ettita turkum esa shu oilalarga
 * qaytib keladi. Shuning uchun qoida BOSHQACHA:
 *   1) bitta diagrammada rang FAQAT BITTA narsani bildiradi (holat YOKI
 *      turkum — hech qachon ikkalasi birga);
 *   2) har bir turkum belgisi yonida MATN va SON turadi.
 * Turkumga holat rangini (`HEALTH_META.hex`) bermang — o‘shanda ikki
 * ma’no bitta kartada uchrashadi.
 */
export const CATEGORICAL_HEX = [
  '#0F5FE0', // 1 — ko‘k
  '#0A6E3A', // 2 — to‘q yashil
  '#EC9A35', // 3 — qahrabo
  '#7628B2', // 4 — binafsha
  '#B32430', // 5 — to‘q qizil
] as const;

export const CATEGORICAL_HEX_DARK = [
  '#487CDE',
  '#00793D',
  '#BF8532',
  '#9763CC',
  '#C74A4D',
] as const;

export const CATEGORICAL_REST_HEX = '#8A9CB0';
export const CATEGORICAL_REST_HEX_DARK = '#6F8299';

/** Indeks bo‘yicha rang — ro‘yxat uzunroq bo‘lsa oxirgisi neytral qoladi. */
export function categoricalHex(index: number, dark = false): string {
  const list = dark ? CATEGORICAL_HEX_DARK : CATEGORICAL_HEX;
  if (index < 0 || index >= list.length) return dark ? CATEGORICAL_REST_HEX_DARK : CATEGORICAL_REST_HEX;
  return list[index];
}

/**
 * Bajarilish foiziga qarab progress bar rangi.
 * ⚠️ Brend rangi ISHLATILMAYDI — progress bu ma’lumot, interfeys urg‘usi emas.
 */
export function progressTone(percent: number): string {
  if (percent >= 85) return 'bg-ok-500';
  if (percent >= 60) return 'bg-ok-400';
  if (percent >= 35) return 'bg-warn-500';
  return 'bg-danger-500';
}

/**
 * MUDDAT RAMPASI — tartibli (ordinal) qator, turkum EMAS.
 *
 * «Muddati o‘tgan → joriy yil → keyingi → undan keyin» tabiiy tartibga ega,
 * shuning uchun bitta rang oilasining yorug‘lik pog‘onalari ishlatiladi:
 * yaqin muddat KO‘ZGA KO‘PROQ tashlanadi.
 *
 * ⚠️ Qorong‘i rejimda tartib TESKARI: oq fonda to‘q rang, qora fonda esa
 * yorug‘ rang ajralib turadi. Avtomatik «aylantirish» ishlamaydi —
 * shuning uchun ikkala qator alohida yozilgan va validatordan o‘tgan
 * (monoton yorug‘lik, qadam ΔL ≥ 0.06, yorug‘ uchi fon bilan ≥ 2:1).
 */
export const DEADLINE_RAMP = ['#0038B2', '#005FDB', '#598CDC', '#7DB2FF'] as const;
export const DEADLINE_RAMP_DARK = ['#8FBFFF', '#4794FF', '#206EE3', '#0047BA'] as const;

/**
 * XARITA ZICHLIGI — obyekt SONI bo‘yicha ketma-ket (sequential) shkala.
 *
 * Bitta rang oilasi (ko‘k), yorqinlik monoton pasayadi: ko‘proq obyekt =
 * to‘qroq tuman. Qadam ΔL ≥ 0.05 (OKLCH) — undan kichik qadam bosma
 * nusxada va arzon monitorda butunlay yo‘qoladi.
 *
 * ⚠️ Bu shkala HOLAT ranglaridan (yashil/qahrabo/qizil) ATAYLAB ajratilgan:
 * tuman ustidagi belgi holatni ko‘rsatadi, poligon esa sonini. Ikkalasi
 * bir xil oilada bo‘lsa, xarita bitta o‘zgaruvchini ikki marta aytib,
 * ikkinchisini umuman aytmay qolardi.
 *
 * ⚠️ Qorong‘i rejim avtomatik «aylantirish» EMAS: qora fonda shkala
 * to‘qdan yorug‘ga qarab o‘sadi, aks holda eng zich tuman fon bilan
 * qo‘shilib ketardi.
 */
export const DENSITY_RAMP = ['#eff4fc', '#d5e2f7', '#bbd1f3', '#a0bff0', '#86aeec', '#6b9ce8'] as const;
export const DENSITY_RAMP_DARK = ['#11151c', '#172438', '#1e3457', '#244477', '#2a5598', '#3066bb'] as const;

/** «Muddati o‘tgan» — bu TARTIB emas, HOLAT: rampadan tashqarida. */
export const DEADLINE_OVERDUE_HEX = '#AC1730';
export const DEADLINE_OVERDUE_HEX_DARK = '#B63039';
