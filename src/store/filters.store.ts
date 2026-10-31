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
  districtIds: string[];
  yearFrom: number;
  yearTo: number;

  setRegion: (regionId: string | null) => void;
  setDistricts: (districtIds: string[]) => void;
  toggleDistrict: (districtId: string) => void;
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

      setDistricts(districtIds) {
        set({ districtIds });
      },

      toggleDistrict(districtId) {
        const current = get().districtIds;
        set({
          districtIds: current.includes(districtId)
            ? current.filter((id) => id !== districtId)
            : [...current, districtId],
        });
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
