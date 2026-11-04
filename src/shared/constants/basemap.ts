/**
 * FON XARITASI (basemap) — ko‘chalar, binolar, daryolar.
 *
 * ⚠️ Sukut bo‘yicha OpenStreetMap. Ilgari fon umuman chizilmasdi va
 * obyekt joylashuvini tanlash oynasida faqat tuman konturlari
 * ko‘rinardi: bo‘m-bo‘sh ko‘pburchak ustiga maktab nuqtasini ANIQ
 * qo‘yib bo‘lmaydi — ko‘cha va mahalla ko‘rinmaydi.
 *
 * ⚠️ OSM ning rasmiy plitkalari BEPUL, lekin «og‘ir yuklama» uchun
 * mo‘ljallanmagan: ularning foydalanish shartlari sekundiga bir
 * nechta so‘rovdan ko‘pini va plitkalarni o‘z serveringizga
 * ko‘chirishni taqiqlaydi. Hokimlikdagi o‘nlab xodim uchun bu
 * yetarli; yuklama o‘ssa yoki tashqi internet yopiq bo‘lsa, manzil
 * `.env` dan almashtiriladi (MapTiler, Stadia yoki o‘z serveringiz).
 *
 * ⚠️ Plitka server YIQILSA ham xarita ISHLAYDI: ostida tuman
 * chegaralari alohida qatlam sifatida chiziladi va nuqta tanlash
 * baribir mumkin.
 *
 * `.env` bilan boshqarish:
 *   VITE_BASEMAP_URL=https://{s}.tile.example.uz/{z}/{x}/{y}.png
 *   VITE_BASEMAP_ATTRIBUTION=© Xarita manbasi
 *   VITE_BASEMAP_URL=off      ← fonni butunlay o‘chirish
 */
const DEFAULT_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTRIBUTION = '© OpenStreetMap hissadorlari';

const configured = (import.meta.env.VITE_BASEMAP_URL ?? '').trim();
const disabled = configured.toLowerCase() === 'off';

export const BASEMAP_URL: string | null = disabled
  ? null
  : configured || DEFAULT_URL;

export const BASEMAP_ATTRIBUTION: string =
  (import.meta.env.VITE_BASEMAP_ATTRIBUTION ?? '').trim() ||
  (configured && !disabled ? '' : DEFAULT_ATTRIBUTION);

/** Fon xaritasi mavjudmi — komponentlar shunga qarab chizadi. */
export const HAS_BASEMAP = BASEMAP_URL !== null;

/**
 * ⚠️ Plitkalar 19-darajadan narigisini bermaydi. Chegarasiz Leaflet
 * bo‘sh kulrang kataklarni so‘rab, xaritani «buzilgan» holga
 * keltirardi.
 */
export const BASEMAP_MAX_ZOOM = 19;
