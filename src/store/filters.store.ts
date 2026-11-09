import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * GLOBAL FILTR — sarlavhadagi boshqaruvlar (viloyat, tuman, yil oralig‘i).
 *
 * ⚠️ Bu filtr BARCHA sahifalarga ta’sir qiladi va saqlanadi: hokim «2026»
 * ni tanlab, obyektlar ro‘yxatiga o‘tsa, u yerda ham 2026 ko‘rinishi kerak.
 * Sahifaga xos filtrlar (qidiruv, saralash) esa URL'da qoladi.
 */
interface FiltersState {
  regionId: string | null;
  /**
   * TANLANGAN TUMAN — ko‘pi bilan BITTA.
   *
   * ⚠️ Tur MASSIV bo‘lib qoladi, lekin ichida nol yoki bitta element
   * bo‘ladi. Sabab: so‘rov parametri (`districtIds`) serverda ro‘yxat
   * sifatida o‘qiladi va uni bitta satrga o‘zgartirish o‘n besh
   * joydagi shartnomani qayta yozishni talab qilardi. Massiv shakli
   * saqlangani uchun server ham, jadval filtrlari ham tegilmaydi.
   *
   * ⚠️ BIR NECHTA TUMAN TANLASH OLIB TASHLANDI (biznes qarori):
   * ikkita tuman tanlanganda «qaysi tumanning mahallalari» degan
   * savolga javob yo‘q edi va xarita tuman kesimiga umuman
   * o‘tolmasdi — natijada hokim tumanni alohida ko‘ra olmasdi.
   */
  districtIds: string[];
  yearFrom: number;
  yearTo: number;

  setRegion: (regionId: string | null) => void;
  /** `null` — «Barcha tumanlar». */
  selectDistrict: (districtId: string | null) => void;
  setYearRange: (from: number, to: number) => void;
  reset: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const DEFAULTS = {
  regionId: null as string | null,
  districtIds: [] as string[],
  // Maketdagi «2024 – 2027» oynasi: ikki yil orqaga, bir yil oldinga.
  yearFrom: CURRENT_YEAR - 2,
  yearTo: CURRENT_YEAR + 1,
};

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      setRegion(regionId) {
        // Viloyat o‘zgarsa tuman tanlovi BEKOR qilinadi — boshqa
        // viloyatning tumani filtrda qolib, ro‘yxat bo‘sh chiqardi.
        set({ regionId, districtIds: [] });
      },

      /**
       * ⚠️ AYNI tuman qayta tanlansa — tanlov BEKOR qilinadi
       * («Barcha tumanlar» ga qaytadi). Busiz tanlangan tumandan
       * chiqish uchun alohida «Tozalash» ni topish kerak bo‘lardi.
       */
      selectDistrict(districtId) {
        const current = get().districtIds;
        if (districtId === null || current[0] === districtId) {
          set({ districtIds: [] });
          return;
        }
        set({ districtIds: [districtId] });
      },

      setYearRange(from, to) {
        set({ yearFrom: Math.min(from, to), yearTo: Math.max(from, to) });
      },

      reset() {
        set({ ...DEFAULTS });
      },
    }),
    { name: 'qnt.filters' },
  ),
);

/** So‘rov parametrlari — `queryKey` da ham, `params` da ham AYNI shakl. */
export function useFilterParams(): {
  regionId?: string;
  districtIds?: string;
  yearFrom: number;
  yearTo: number;
} {
  const { regionId, districtIds, yearFrom, yearTo } = useFiltersStore();
  return {
    ...(regionId ? { regionId } : {}),
    ...(districtIds.length ? { districtIds: districtIds.join(',') } : {}),
    yearFrom,
    yearTo,
  };
}
