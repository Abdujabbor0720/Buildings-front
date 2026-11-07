/**
 * KO‘RSATKICH TUSLARI — YAGONA MANBA.
 *
 * ⚠️ Bu jadvallar bosh sahifadagi kartada ham, o‘sha kartaning
 * batafsil sahifasidagi sarlavhada ham ishlatiladi. Ikki nusxa
 * bo‘lsa, bitta ekranda qahrabo «Kechikayotgan» kartasi, ikkinchisida
 * boshqa tusdagi sarlavha chiqib, foydalanuvchi boshqa joyga
 * tushganday his qilardi.
 *
 * ⚠️ Klass nomlari TO‘LIQ yozilgan, `bg-${tone}-100` kabi
 * YIG‘ILMAYDI: Tailwind klasslarni fayl MATNIDAN qidiradi va
 * yig‘ilgan nomni topa olmaydi — plitka rangsiz, shaffof bo‘lib
 * qolardi.
 *
 * ⚠️ `brand` — holat EMAS, neytral: «Jami obyektlar» va «Umumiy
 * qiymat» yaxshi ham, yomon ham emas, shuning uchun ular
 * yashil/qizil tus olmaydi.
 */

export type KpiTone = 'brand' | 'ok' | 'warn' | 'danger' | 'done';

/** Karta foni — toifaga mos ingichka tus (`index.css` dagi `.kpi-*`). */
export const KPI_SURFACE: Record<KpiTone, string> = {
  brand: 'kpi-brand outline-brand-500/14 dark:outline-brand-400/16',
  ok: 'kpi-ok outline-ok-500/16 dark:outline-ok-400/18',
  warn: 'kpi-warn outline-warn-500/22 dark:outline-warn-400/20',
  danger: 'kpi-danger outline-danger-500/16 dark:outline-danger-400/18',
  done: 'kpi-done outline-done-500/16 dark:outline-done-400/18',
};

/**
 * Ikonka plitkasi — DIAGONAL o‘tish bilan.
 *
 * ⚠️ Yassi `bg-*-100` emas: plitka kartaning o‘z tusi ustida turadi
 * va ikkalasi yassi bo‘lganda plitka «dog‘» bo‘lib ko‘rinardi.
 */
export const KPI_TILE: Record<KpiTone, string> = {
  brand:
    'bg-linear-to-br from-brand-100 to-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/14 shadow-[0_1px_2px_rgb(10_108_240/0.16)] dark:from-brand-500/22 dark:to-brand-500/8 dark:text-brand-300 dark:ring-brand-400/18 dark:shadow-none',
  ok: 'bg-linear-to-br from-ok-100 to-ok-50 text-ok-600 ring-1 ring-inset ring-ok-500/14 shadow-[0_1px_2px_rgb(10_146_75/0.16)] dark:from-ok-500/22 dark:to-ok-500/8 dark:text-ok-300 dark:ring-ok-400/18 dark:shadow-none',
  warn: 'bg-linear-to-br from-warn-100 to-warn-50 text-warn-600 ring-1 ring-inset ring-warn-500/18 shadow-[0_1px_2px_rgb(222_156_49/0.22)] dark:from-warn-500/22 dark:to-warn-500/8 dark:text-warn-300 dark:ring-warn-400/18 dark:shadow-none',
  danger:
    'bg-linear-to-br from-danger-100 to-danger-50 text-danger-500 ring-1 ring-inset ring-danger-500/14 shadow-[0_1px_2px_rgb(172_23_48/0.16)] dark:from-danger-500/22 dark:to-danger-500/8 dark:text-danger-300 dark:ring-danger-400/18 dark:shadow-none',
  done: 'bg-linear-to-br from-done-100 to-done-50 text-done-600 ring-1 ring-inset ring-done-500/14 shadow-[0_1px_2px_rgb(123_71_191/0.16)] dark:from-done-500/22 dark:to-done-500/8 dark:text-done-300 dark:ring-done-400/18 dark:shadow-none',
};

/**
 * Yorliq rangi — plitka bilan BITTA oiladan.
 *
 * ⚠️ Kulrang yorliq ishlatilmaydi: oltita karta yonma-yon turganda
 * faqat plitka rangli bo‘lsa, ko‘z ularni «bir xil oltita karta» deb
 * o‘qiydi.
 */
export const KPI_LABEL: Record<KpiTone, string> = {
  brand: 'text-brand-700 dark:text-brand-300',
  ok: 'text-ok-700 dark:text-ok-300',
  warn: 'text-warn-700 dark:text-warn-300',
  danger: 'text-danger-600 dark:text-danger-300',
  done: 'text-done-700 dark:text-done-300',
};

export const KPI_CAPTION: Record<KpiTone, string> = {
  brand: 'text-brand-600/80 dark:text-brand-300/70',
  ok: 'text-ok-600/85 dark:text-ok-300/70',
  warn: 'text-warn-600/85 dark:text-warn-300/70',
  danger: 'text-danger-500/85 dark:text-danger-300/70',
  done: 'text-done-600/80 dark:text-done-300/70',
};
