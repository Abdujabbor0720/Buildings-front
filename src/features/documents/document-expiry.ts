import type { ObjectDocument } from '@/shared/api/types';
import { diffInDays, tashkentToday } from '@/shared/utils/date.utils';
import { formatCount } from '@/shared/utils/money.utils';

/**
 * HUJJAT MUDDATI — YAGONA MANBA.
 *
 * ⚠️ Mantiq uch joyda kerak: obyekt kartasidagi «Hujjatlar» tabi,
 * umumiy «Hujjatlar» bo‘limi va hujjatning batafsil oynasi. Nusxa
 * ko‘chirilganda ular darhol ajralib ketgan edi — obyekt tabida
 * muddati ALLAQACHON O‘TGAN ruxsatnoma «tugayapti» deb QAHRABO
 * rangda turardi, umumiy ro‘yxatda esa to‘g‘ri qizil edi. Qurilish
 * nazorati tizimida bu farq arzimas emas.
 */

/** Muddat holati — rang ham, matn ham shu yerdan. */
export type ExpiryState = 'none' | 'valid' | 'soon' | 'expired';

export interface ExpiryInfo {
  state: ExpiryState;
  label: string;
  /** Qancha kun qolgani / o‘tgani — matn ko‘rinishida. */
  detail: string | null;
  chip: string;
}

/**
 * ⚠️ Chegara 30 KUN — ro‘yxatdagi «tugayapti» bo‘yog‘i bilan AYNI
 * (`ObjectDocumentsTab`, `DocumentsPage`). Ikki joyda ikki xil
 * chegara bo‘lsa, jadvalda qahrabo ko‘ringan hujjat oynada
 * «amal qiladi» bo‘lib chiqardi.
 */
export const EXPIRY_SOON_DAYS = 30;

export function resolveExpiry(document: ObjectDocument): ExpiryInfo {
  if (!document.expiryDate) {
    return {
      state: 'none',
      label: 'Muddatsiz',
      detail: 'Amal qilish muddati belgilanmagan',
      chip: 'surface-muted text-muted',
    };
  }

  // ⚠️ Server `daysUntilExpiry` yuborsa — O‘SHA ishlatiladi. Mijozda
  // qayta hisoblansa, taymzona farqi tufayli «1 kun qoldi» bilan
  // «muddati o‘tgan» yonma-yon chiqishi mumkin edi.
  const days =
    document.daysUntilExpiry ?? diffInDays(tashkentToday(), document.expiryDate) ?? 0;

  if (days < 0) {
    return {
      state: 'expired',
      label: 'Muddati o‘tgan',
      detail: `${formatCount(Math.abs(days))} kun oldin tugagan`,
      chip: 'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-500/12 dark:text-danger-300',
    };
  }
  if (days <= EXPIRY_SOON_DAYS) {
    return {
      state: 'soon',
      label: 'Muddati tugayapti',
      detail: days === 0 ? 'Bugun tugaydi' : `${formatCount(days)} kun qoldi`,
      chip: 'bg-warn-50 text-warn-700 ring-1 ring-inset ring-warn-500/20 dark:bg-warn-500/12 dark:text-warn-300',
    };
  }
  return {
    state: 'valid',
    label: 'Amal qiladi',
    detail: `${formatCount(days)} kun qoldi`,
    chip: 'bg-ok-50 text-ok-700 ring-1 ring-inset ring-ok-500/20 dark:bg-ok-500/12 dark:text-ok-300',
  };
}
