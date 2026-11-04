import {
  Building2,
  Camera,
  ClipboardList,
  FileText,
  History,
  Settings2,
  TriangleAlert,
  Users,
  UsersRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

/**
 * RUXSATLARNING ODAM TILIDAGI TARJIMASI.
 *
 * ⚠️ Serverdagi kalit (`objects.create`) — DASTURCHI uchun. Uni
 * ekranda xom holda ko‘rsatish mumkin emas: hokim ham, kurator ham
 * dasturchi emas va «objects.create» ularga hech narsa aytmaydi.
 * Shu fayl ikkisi orasidagi yagona ko‘prik.
 *
 * ⚠️ Kalitlar `server/src/common/constants/permissions.ts` bilan
 * QO‘LDA sinxron. Serverda yangi ruxsat paydo bo‘lsa, shu yerga ham
 * qo‘shiladi — aks holda u ekranda «noma’lum amal» bo‘lib qoladi
 * (`describePermission` shunday qaytaradi, jim o‘tkazib yubormaydi).
 */
export interface PermissionAction {
  /** To‘liq kalit: `objects.create`. */
  key: string;
  /** Tugma yoki amal nomi: «Yangi obyekt qo‘shish». */
  label: string;
}

export interface PermissionGroup {
  /** Bo‘lim prefiksi: `objects`. */
  key: string;
  label: string;
  /** Bu bo‘lim nimani qamrab olishini bir jumlada tushuntiradi. */
  description: string;
  icon: LucideIcon;
  actions: PermissionAction[];
}

export const PERMISSION_GROUPS: readonly PermissionGroup[] = [
  {
    key: 'objects',
    label: 'Qurilish obyektlari',
    description: 'Obyektlar ro‘yxati, muddatlari va bajarilish foizi',
    icon: Building2,
    actions: [
      { key: 'objects.view', label: 'Ko‘rish' },
      { key: 'objects.create', label: 'Yangi obyekt qo‘shish' },
      { key: 'objects.update', label: 'Ma’lumotini tahrirlash' },
      { key: 'objects.delete', label: 'O‘chirish' },
      { key: 'objects.progress', label: 'Bajarilishni yangilash' },
    ],
  },
  {
    key: 'photos',
    label: 'Foto-hisobotlar',
    description: 'Qurilish maydonidan kelgan suratlar va ularni tekshirish',
    icon: Camera,
    actions: [
      { key: 'photos.view', label: 'Ko‘rish' },
      { key: 'photos.upload', label: 'Surat yuborish' },
      { key: 'photos.moderate', label: 'Tasdiqlash va rad etish' },
    ],
  },
  {
    key: 'delays',
    label: 'Kechikishlar va risklar',
    description: 'Muammolarni qayd etish, sababini ko‘rsatish va yopish',
    icon: TriangleAlert,
    actions: [
      { key: 'delays.view', label: 'Ko‘rish' },
      { key: 'delays.manage', label: 'Qayd etish va yopish' },
    ],
  },
  {
    key: 'documents',
    label: 'Hujjatlar',
    description: 'Loyiha-smeta, shartnoma, ekspertiza va ruxsatnomalar',
    icon: FileText,
    actions: [
      { key: 'documents.view', label: 'Ko‘rish' },
      { key: 'documents.manage', label: 'Qo‘shish va o‘chirish' },
    ],
  },
  {
    key: 'funding',
    label: 'Moliyalashtirish',
    description: 'Ajratilgan mablag‘, to‘lovlar va yillik rejalar',
    icon: Wallet,
    actions: [
      { key: 'funding.view', label: 'Ko‘rish' },
      { key: 'funding.manage', label: 'Harakat qayd etish' },
    ],
  },
  {
    key: 'contractors',
    label: 'Pudratchilar',
    description: 'Pudrat tashkilotlari, litsenziyalari va reytingi',
    icon: UsersRound,
    actions: [
      { key: 'contractors.view', label: 'Ko‘rish' },
      { key: 'contractors.manage', label: 'Qo‘shish va tahrirlash' },
    ],
  },
  {
    key: 'reports',
    label: 'Hisobotlar',
    description: 'Umumiy ko‘rsatkichlar, dinamika va Excel eksporti',
    icon: ClipboardList,
    actions: [
      { key: 'reports.view', label: 'Ko‘rish' },
      { key: 'reports.export', label: 'Excelga yuklab olish' },
    ],
  },
  {
    key: 'users',
    label: 'Foydalanuvchilar',
    description: 'Mas’ullar, kuratorlar va ularning tizimga kirishi',
    icon: Users,
    actions: [
      { key: 'users.view', label: 'Ko‘rish' },
      { key: 'users.manage', label: 'Qo‘shish va tahrirlash' },
    ],
  },
  {
    key: 'settings',
    label: 'Tizim sozlamalari',
    description: 'Platforma parametrlari va ma’lumotnomalar',
    icon: Settings2,
    actions: [
      { key: 'settings.view', label: 'Ko‘rish' },
      { key: 'settings.manage', label: 'O‘zgartirish' },
    ],
  },
  {
    key: 'audit',
    label: 'Harakatlar tarixi',
    description: 'Kim, qachon va nimani o‘zgartirgani qayd etiladi',
    icon: History,
    actions: [{ key: 'audit.view', label: 'Ko‘rish' }],
  },
];

/**
 * Bitta kalitni odam tiliga o‘giradi.
 *
 * ⚠️ Noma’lum kalit JIM O‘TKAZILMAYDI: u ekranda «Qo‘shimcha ruxsat»
 * bo‘lib ko‘rinadi, shunda serverga yangi ruxsat qo‘shilib bu fayl
 * yangilanmagani darhol sezilаdi.
 */
export function describePermission(key: string): { group: string; action: string } {
  for (const group of PERMISSION_GROUPS) {
    const action = group.actions.find((item) => item.key === key);
    if (action) return { group: group.label, action: action.label };
  }
  return { group: 'Qo‘shimcha ruxsat', action: key };
}

/** Ro‘yxatda bo‘lmagan (yangi qo‘shilgan) ruxsatlar. */
export function unknownPermissions(keys: readonly string[]): string[] {
  const known = new Set(PERMISSION_GROUPS.flatMap((g) => g.actions.map((a) => a.key)));
  return keys.filter((key) => !known.has(key));
}
