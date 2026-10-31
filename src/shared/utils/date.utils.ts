/**
 * SANA FORMATI — YAGONA MANBA (frontend).
 *
 * ⚠️ TAQIQLANGAN: `toLocaleDateString('uz-UZ')`, `Intl.DateTimeFormat`,
 * qo‘lda yig‘ilgan `${d}.${m}.${y}` shabloni. Ularning natijasi kod
 * yozilgan joyga emas, brauzer sozlamasiga bog‘liq bo‘ladi va bitta
 * jadvalda «21-may, 2025» bilan «21.05.2025» yonma-yon turib qoladi.
 *
 * Butun tizim Asia/Tashkent (+5, DST yo‘q) da ishlaydi.
 */

/** ⚠️ Bu massivni boshqa faylga NUSXA KO‘CHIRMANG. */
export const MONTHS_UZ = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
] as const;

export const MONTHS_UZ_CAP = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
] as const;

export const WEEKDAYS_UZ_SHORT = ['Du', 'Se', 'Cho', 'Pay', 'Ju', 'Sha', 'Yak'] as const;

/** Bo‘sh / yaroqsiz qiymat — `Invalid Date` yoki bo‘sh satr EMAS. */
export const EMPTY_VALUE = '—';

const TASHKENT_OFFSET_MINUTES = 5 * 60;

export type DateInput = Date | string | number | null | undefined;

export interface DateFormatOptions {
  /**
   * `true` — qiymat KUN (serverdan `"2026-12-30"` ko‘rinishida kelgan).
   * `false` — haqiqiy instant (`createdAt`, `capturedAt`), Toshkent
   * devor-soatiga o‘tkaziladi.
   *
   * Sukut: satr `YYYY-MM-DD` bo‘lsa avtomatik `true`.
   */
  utc?: boolean;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  // `"2026-12-30"` → UTC yarim tuni (JS spetsifikatsiyasi bo‘yicha).
  const parsed = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00.000Z` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

interface Parts {
  day: number;
  monthIndex: number;
  year: number;
  hours: number;
  minutes: number;
  weekday: number;
}

function parts(value: DateInput, opts?: DateFormatOptions): Parts | null {
  const date = toDate(value);
  if (!date) return null;

  const isDateOnly = typeof value === 'string' && DATE_ONLY.test(value);
  const asUtc = opts?.utc ?? isDateOnly;
  const shifted = asUtc ? date : new Date(date.getTime() + TASHKENT_OFFSET_MINUTES * 60_000);

  return {
    day: shifted.getUTCDate(),
    monthIndex: shifted.getUTCMonth(),
    year: shifted.getUTCFullYear(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
    // 0 = dushanba (O‘zbekistonda hafta dushanbadan boshlanadi).
    weekday: (shifted.getUTCDay() + 6) % 7,
  };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `21-may, 2025` */
export function formatDateUz(value: DateInput, opts?: DateFormatOptions): string {
  const p = parts(value, opts);
  return p ? `${p.day}-${MONTHS_UZ[p.monthIndex]}, ${p.year}` : EMPTY_VALUE;
}

/** `21-may, 2025 14:30` */
export function formatDateTimeUz(value: DateInput, opts?: DateFormatOptions): string {
  const p = parts(value, opts);
  return p
    ? `${p.day}-${MONTHS_UZ[p.monthIndex]}, ${p.year} ${pad2(p.hours)}:${pad2(p.minutes)}`
    : EMPTY_VALUE;
}

/** `14:30` */
export function formatTimeUz(value: DateInput, opts?: DateFormatOptions): string {
  const p = parts(value, opts);
  return p ? `${pad2(p.hours)}:${pad2(p.minutes)}` : EMPTY_VALUE;
}

/** `Yanvar, 2026` — mustaqil yorliq, oy nomi KATTA harf bilan. */
export function formatMonthUz(value: DateInput, opts?: DateFormatOptions): string {
  const p = parts(value, opts);
  return p ? `${MONTHS_UZ_CAP[p.monthIndex]}, ${p.year}` : EMPTY_VALUE;
}

/** `21-may, 2025 — 30-iyun, 2025` */
export function formatDateRangeUz(from: DateInput, to: DateInput, opts?: DateFormatOptions): string {
  const a = formatDateUz(from, opts);
  const b = formatDateUz(to, opts);
  if (a === EMPTY_VALUE && b === EMPTY_VALUE) return EMPTY_VALUE;
  return `${a} — ${b}`;
}

/** `21-may` — yilsiz, joriy yil kontekstida (kalendar kataklari). */
export function formatDayMonthUz(value: DateInput, opts?: DateFormatOptions): string {
  const p = parts(value, opts);
  return p ? `${p.day}-${MONTHS_UZ[p.monthIndex]}` : EMPTY_VALUE;
}

/* ───────────────────────── Nisbiy vaqt ───────────────────────── */

/** `3 kun oldin`, `2 soat oldin`, `hozir` */
export function formatRelativeUz(value: DateInput): string {
  const date = toDate(value);
  if (!date) return EMPTY_VALUE;

  const diffMs = Date.now() - date.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);

  const minutes = Math.floor(abs / 60_000);
  if (minutes < 1) return 'hozir';

  const units: Array<[number, string]> = [
    [60, 'daqiqa'],
    [24, 'soat'],
    [30, 'kun'],
    [12, 'oy'],
  ];

  let value_ = minutes;
  let label = 'daqiqa';
  for (const [divisor, nextLabel] of units) {
    if (value_ < divisor) break;
    value_ = Math.floor(value_ / divisor);
    label = nextLabel;
  }
  if (label === 'daqiqa' && value_ >= 60) label = 'soat';

  return future ? `${value_} ${label}dan keyin` : `${value_} ${label} oldin`;
}

/* ───────────────────────── Mashina formatlari ───────────────────────── */

/**
 * `"2026-12-30"` — `<input type="date">`, so‘rov parametri, `queryKey`.
 * ⚠️ EKRANGA CHIQARILMAYDI — buning uchun `formatDateUz` bor.
 */
export function toInputDate(value: DateInput): string {
  const p = parts(value, { utc: true });
  return p ? `${p.year}-${pad2(p.monthIndex + 1)}-${pad2(p.day)}` : '';
}

/** `"2026-12"` — `<input type="month">`. */
export function toInputMonth(value: DateInput): string {
  const p = parts(value, { utc: true });
  return p ? `${p.year}-${pad2(p.monthIndex + 1)}` : '';
}

/** Toshkent bo‘yicha bugungi kun, `Date` sifatida (UTC yarim tunida). */
export function tashkentToday(): Date {
  const now = new Date(Date.now() + TASHKENT_OFFSET_MINUTES * 60_000);
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const MS_PER_DAY = 86_400_000;

export function diffInDays(from: DateInput, to: DateInput): number | null {
  const a = toDate(from);
  const b = toDate(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

export function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * MS_PER_DAY);
}

/** `12 kun qoldi` / `5 kun kechikdi` / `bugun` */
export function formatDaysLeftUz(days: number | null | undefined): string {
  if (days === null || days === undefined) return EMPTY_VALUE;
  if (days === 0) return 'bugun';
  return days > 0 ? `${days} kun qoldi` : `${Math.abs(days)} kun kechikdi`;
}
