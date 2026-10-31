/**
 * FON XARITASI (basemap).
 *
 * ⚠️ Sukut bo‘yicha O‘CHIQ. Tuman chegaralari va holat ranglari o‘zi
 * yetarli ma’lumot beradi, ko‘chalar esa uni ko‘mib yuboradi.
 *
 * ⚠️ Bepul ochiq plitkalar (CARTO, OSM) ishlab chiqarish yuklamasi uchun
 * MO‘LJALLANMAGAN: CARTO endi API kalit talab qiladi va kalitsiz
 * chaqirilganda plitka o‘rniga «API KEY REQUIRED» yozuvi qaytaradi —
 * aynan shu xatolik xaritani suv belgilari bilan to‘ldirgan edi.
 * Shuning uchun manzil SOZLAMADAN olinadi; berilmasa, fon umuman
 * chizilmaydi.
 *
 * Yoqish uchun `.env` ga:
 *   VITE_BASEMAP_URL=https://{s}.tile.example.uz/{z}/{x}/{y}.png
 *   VITE_BASEMAP_ATTRIBUTION=© Xarita manbasi
 */
const url = (import.meta.env.VITE_BASEMAP_URL ?? '').trim();

export const BASEMAP_URL: string | null = url || null;

export const BASEMAP_ATTRIBUTION: string =
  (import.meta.env.VITE_BASEMAP_ATTRIBUTION ?? '').trim() || '';

/** Fon xaritasi sozlanganmi — komponentlar shunga qarab chizadi. */
export const HAS_BASEMAP = BASEMAP_URL !== null;
