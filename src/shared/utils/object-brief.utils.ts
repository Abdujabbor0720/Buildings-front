import type { ObjectBrief } from '@/shared/api/types';

/**
 * OBYEKT JOYLASHUVI VA MAS'ULINI NORMALLASHTIRISH.
 *
 * ⚠️ Bu SOF FUNKSIYA va u komponent faylida TURMAYDI: bitta fayl ham
 * komponent, ham funksiya eksport qilsa, Vite'ning tez yangilanishi
 * (fast refresh) ishlamay qoladi va tahrir qilganda butun sahifa
 * qayta yuklanadi.
 */

/**
 * Server IKKI SHAKLDA yuboradi va ikkalasi ham to‘g‘ri:
 *   • yassi (`address`, `responsibleName`, …) — xom so‘rovli
 *     endpointlar (dashboard, xarita, kalendar, KPI, AI);
 *   • ichma-ich (`object.responsible`) — entity qaytaradiganlar
 *     (kechikishlar, fotoarxiv, hujjatlar, moliyalashtirish).
 *
 * ⚠️ Ikkinchi shaklni BIRINCHISIGA shu yerda keltiramiz, komponent
 * ichida emas: aks holda har chaqiruv joyi o‘z o‘qish mantig‘ini
 * yozardi va ulardan biri, albatta, ismni boshqacha yig‘ardi.
 */
export interface NestedObjectSource {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  responsible?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    position?: string | null;
    phone?: string | null;
  } | null;
}

/** «Karimov Jahongir» — familiya oldinda (serverdagi `fullName` bilan AYNI). */
function joinFull(first?: string | null, last?: string | null): string {
  return [last, first].filter(Boolean).join(' ');
}

/**
 * «J. Karimov» — ixcham shakl.
 * ⚠️ Ism bo‘sh bo‘lsa nuqta ham qo‘yilmaydi: «. Karimov» degan yozuv
 * ma'lumot to‘liq emasligini emas, xatolikni bildirib qo‘yardi.
 */
function joinShort(first?: string | null, last?: string | null): string {
  const initial = first ? `${first.charAt(0)}.` : '';
  return [initial, last].filter(Boolean).join(' ');
}

/** Ichma-ich shaklni yassi `ObjectBrief` ga keltiradi. */
export function toObjectBrief(source: NestedObjectSource | null | undefined): ObjectBrief {
  const person = source?.responsible ?? null;
  const has = Boolean(person?.firstName ?? person?.lastName);

  return {
    address: source?.address ?? null,
    lat: source?.lat ?? null,
    lng: source?.lng ?? null,
    responsibleId: person?.id ?? null,
    responsibleName: has ? joinShort(person?.firstName, person?.lastName) : null,
    responsibleFullName: has ? joinFull(person?.firstName, person?.lastName) : null,
    responsiblePosition: person?.position ?? null,
    responsiblePhone: person?.phone ?? null,
  };
}
