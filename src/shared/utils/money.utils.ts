import { EMPTY_VALUE } from './date.utils';

/**
 * PUL — serverdan STRING bo‘lib keladi (`numeric(18,2)`).
 *
 * ⚠️ Bu yerdagi funksiyalar faqat KO‘RSATADI. Yig‘indi hech qachon
 * frontendda hisoblanmaydi: 7.4 trln so‘mni JS `number` bilan qo‘shish
 * oxirgi tiyinlarni yo‘qotadi va ekrandagi jami serverdagidan farq qiladi.
 */
export type MoneyInput = string | number | null | undefined;

export function toNumber(value: MoneyInput): number {
  if (value === null || value === undefined || value === '') return 0;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** `7 400 000 000 000` — uzlukli probel bilan guruhlangan. */
export function formatAmount(value: MoneyInput, fractionDigits = 0): string {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE;
  const fixed = toNumber(value).toFixed(fractionDigits);
  const [intPart, frac] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac ? `${grouped},${frac}` : grouped;
}

const SCALES = [
  { limit: 1e12, divisor: 1e12, suffix: 'trln' },
  { limit: 1e9, divisor: 1e9, suffix: 'mlrd' },
  { limit: 1e6, divisor: 1e6, suffix: 'mln' },
  { limit: 1e3, divisor: 1e3, suffix: 'ming' },
] as const;

/** `7.4 trln`, `48.5 mlrd`, `450 mln` */
export function formatCompact(value: MoneyInput, maxFractionDigits = 1): string {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE;
  const n = toNumber(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';

  for (const scale of SCALES) {
    if (abs >= scale.limit) {
      const scaled = abs / scale.divisor;
      const text = scaled
        .toFixed(scaled >= 100 ? 0 : maxFractionDigits)
        .replace(/\.0+$/, '')
        .replace(/(\.\d*?)0+$/, '$1');
      return `${sign}${text} ${scale.suffix}`;
    }
  }
  return `${sign}${Math.round(abs)}`;
}

/** `7.4 trln so‘m` */
export function formatMoney(value: MoneyInput, maxFractionDigits = 1): string {
  const compact = formatCompact(value, maxFractionDigits);
  return compact === EMPTY_VALUE ? EMPTY_VALUE : `${compact} so‘m`;
}

/** `7 400 000 000 000 so‘m` — hisobot va tafsilot oynalari uchun. */
export function formatMoneyFull(value: MoneyInput): string {
  const amount = formatAmount(value);
  return amount === EMPTY_VALUE ? EMPTY_VALUE : `${amount} so‘m`;
}

/** `72.8%` — ortiqcha nollarsiz. */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY_VALUE;
  const text = value.toFixed(digits).replace(/\.0+$/, '');
  return `${text}%`;
}

/** `1 248` — soni, guruhlangan. */
export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined) return EMPTY_VALUE;
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Fayl hajmi — o‘lchov birligi O‘ZI tanlanadi.
 * ⚠️ Har doim MB da ko‘rsatilsa, 3 KB lik fayl «0.0 MB» bo‘lib,
 * foydalanuvchiga fayl bo‘sh yoki yuklanmagandek ko‘rinadi.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  const mb = bytes / 1024 / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}
