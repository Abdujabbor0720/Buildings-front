/**
 * MANZIL QIDIRUVI (geokodlash).
 *
 * ⚠️ Bu BIZNING API EMAS — tashqi xizmat (sukut bo‘yicha Nominatim,
 * OpenStreetMap ustida). Shuning uchun u `api/client.ts` dagi axios
 * nusxasidan FOYDALANMAYDI: u yerda `Authorization` sarlavhasi va
 * 401 da chiqib ketish mantig‘i bor, ularni begona hostga yuborish
 * mumkin emas.
 *
 * ⚠️ Nominatim sekundiga BITTA so‘rovga ruxsat beradi. Chaqiruvchi
 * `useDebounce` bilan ishlaydi va eski so‘rov `AbortSignal` bilan
 * bekor qilinadi.
 *
 * ⚠️ Xizmat yiqilsa yoki tashqi internet yopiq bo‘lsa, funksiya
 * BO‘SH ro‘yxat qaytaradi va xato OTMAYDI: manzil qidiruvi —
 * qulaylik, nuqtani xaritadan qo‘lda ham belgilash mumkin.
 */
const BASE = (import.meta.env.VITE_GEOCODER_URL ?? '').trim() || 'https://nominatim.openstreetmap.org';

export interface GeoPlace {
  id: string;
  /** Ko‘rsatiladigan to‘liq nom. */
  label: string;
  lat: number;
  lng: number;
}

export interface SearchOptions {
  signal?: AbortSignal;
  /** Qidiruvni shu to‘rtburchak ichiga YAQINLASHTIRADI (cheklamaydi). */
  viewbox?: [number, number, number, number];
  limit?: number;
}

interface NominatimItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export async function searchPlaces(
  query: string,
  { signal, viewbox, limit = 6 }: SearchOptions = {},
): Promise<GeoPlace[]> {
  const text = query.trim();
  if (text.length < 3) return [];

  const params = new URLSearchParams({
    q: text,
    format: 'jsonv2',
    addressdetails: '0',
    limit: String(limit),
    // Faqat O‘zbekiston: «Andijon» dunyoning boshqa burchagidagi
    // o‘xshash nomni birinchi qilib chiqarmasin.
    countrycodes: 'uz',
    'accept-language': 'uz,ru,en',
  });
  if (viewbox) {
    params.set('viewbox', viewbox.join(','));
    // `bounded=0`: to‘rtburchak faqat TARTIBGA ta’sir qiladi, natijani
    // kesib tashlamaydi — qo‘shni tumandagi manzil ham topilsin.
    params.set('bounded', '0');
  }

  try {
    const response = await fetch(`${BASE}/search?${params.toString()}`, { signal });
    if (!response.ok) return [];
    const data = (await response.json()) as NominatimItem[];
    return data.map((item) => ({
      id: String(item.place_id),
      label: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
    }));
  } catch {
    return [];
  }
}

/** Nuqta bo‘yicha manzil — «to‘g‘ri joyni bosdimmi» degan savolga javob. */
export async function reverseGeocode(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'jsonv2',
    zoom: '18',
    'accept-language': 'uz,ru,en',
  });

  try {
    const response = await fetch(`${BASE}/reverse?${params.toString()}`, { signal });
    if (!response.ok) return null;
    const data = (await response.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}
