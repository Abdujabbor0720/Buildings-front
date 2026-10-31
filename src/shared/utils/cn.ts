import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * ⚠️ MAXSUS MATN O‘LCHAMLARI `tailwind-merge` GA AYTILISHI SHART.
 *
 * Dizayn tizimida o‘lchamlar vazifa bo‘yicha nomlangan (`text-ui`,
 * `text-meta`, `text-body`…). `tailwind-merge` bu nomlarni tanimaydi va
 * ularni MATN RANGI deb hisoblaydi — natijada
 * `cn('text-white', 'text-body')` dan `text-white` O‘CHIB KETADI va
 * tugma matni fon rangida qolib, ko‘rinmay qoladi (aynan shunday bo‘lgan).
 *
 * Shuning uchun nomlar `font-size` guruhiga ochiq yoziladi. Yangi o‘lcham
 * `index.css` ga qo‘shilsa, SHU RO‘YXATGA ham qo‘shiladi.
 */
const FONT_SIZES = [
  'nano',
  'micro',
  'meta',
  'ui',
  'body',
  'lede',
  'head',
  'sub',
  'display',
  'major',
  'figure',
] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: [...FONT_SIZES] }],
    },
  },
});

/**
 * Tailwind klasslarini birlashtirish.
 * `twMerge` ziddiyatli klasslarni hal qiladi: `cn('p-2', 'p-4')` → `p-4`.
 * Busiz komponentga tashqaridan berilgan `className` ichki qiymatni
 * bosa olmasdi.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
