import {
  Building2,
  Camera,
  Headset,
  LayoutDashboard,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

/**
 * TIZIM SOZLAMALARINING ODAM TILIDAGI TA’RIFI.
 *
 * ⚠️ Serverdagi kalit (`photos.maxDistanceMeters`) ekranda
 * KO‘RSATILMAYDI. Bu sahifani dasturchi emas, hokimlik xodimi
 * ochadi: unga «qaysi o‘zgaruvchi» emas, «bu nimani o‘zgartiradi»
 * kerak. Shu sababli har sozlamaning qisqa nomi, tushuntirishi va
 * o‘lchov birligi shu yerda yoziladi.
 *
 * ⚠️ Serverda yangi sozlama paydo bo‘lsa, u ekrandan YO‘QOLMAYDI:
 * ta’rif topilmasa serverning o‘z izohi ishlatiladi
 * (`settings.service.ts` dagi `description`).
 */
export interface SettingMeta {
  label: string;
  hint: string;
  /** Son maydonidan keyingi birlik: «kun», «metr». */
  unit?: string;
  /** Obyekt qiymatli sozlama uchun ichki maydonlar nomi. */
  fields?: Record<string, string>;
}

export const SETTING_META: Record<string, SettingMeta> = {
  'dashboard.deadlineWarningDays': {
    label: 'Muddat ogohlantirishi',
    hint: 'Obyekt topshirilishiga shuncha kun qolganda u «yaqin muddatda topshiriladigan» ro‘yxatiga tushadi.',
    unit: 'kun',
  },
  'dashboard.defaultYearFrom': {
    label: 'Boshlang‘ich yil',
    hint: 'Bosh sahifa ochilganda sukut bo‘yicha shu yildan boshlab ko‘rsatiladi.',
    unit: 'yil',
  },
  'dashboard.defaultYearTo': {
    label: 'Oxirgi yil',
    hint: 'Bosh sahifadagi yil oralig‘ining oxiri.',
    unit: 'yil',
  },
  'objects.staleReportDays': {
    label: 'Hisobotsiz kunlar chegarasi',
    hint: 'Obyektdan shuncha kun foto-hisobot kelmasa, u «e’tibor talab qiladi» deb belgilanadi va risk bahosi oshadi.',
    unit: 'kun',
  },
  'photos.requireModeration': {
    label: 'Surat tasdiqdan o‘tsin',
    hint: 'Yoqilgan bo‘lsa, yuborilgan surat obyekt bajarilishiga faqat moderator tasdiqlagandan keyin ta’sir qiladi.',
  },
  'photos.maxDistanceMeters': {
    label: 'Suratning ruxsat etilgan masofasi',
    hint: 'Surat obyektdan shuncha metrdan uzoqda olingan bo‘lsa, u «shubhali» deb belgilanadi va qo‘lda tekshiriladi.',
    unit: 'metr',
  },
  'support.phone': {
    label: 'Yordam markazi telefoni',
    hint: 'Yon menyuning pastida va xato xabarlarida ko‘rinadi.',
  },
  'support.workingHours': {
    label: 'Yordam markazi ish vaqti',
    hint: 'Telefon raqami yonida ko‘rsatiladi. Masalan: 24/7 yoki 09:00–18:00.',
  },
  'app.organizationName': {
    label: 'Tashkilot nomi',
    hint: 'Yon menyuning yuqorisida va hisobotlarning sarlavhasida chiqadi.',
  },
  'app.systemName': {
    label: 'Tizim nomi',
    hint: 'Brauzer oynasining sarlavhasida va yon menyuda ko‘rinadi.',
  },
  'app.mobileAppLinks': {
    label: 'Mobil ilova havolalari',
    hint: 'Yon menyuning pastidagi uchta tugma shu manzillarga olib boradi.',
    fields: {
      telegram: 'Telegram bot',
      appStore: 'App Store (iPhone)',
      googlePlay: 'Google Play (Android)',
    },
  },
};

export interface CategoryMeta {
  label: string;
  hint: string;
  icon: LucideIcon;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  app: {
    label: 'Tashkilot va tizim nomi',
    hint: 'Ekranda ko‘rinadigan nomlar va mobil ilova havolalari',
    icon: Building2,
  },
  dashboard: {
    label: 'Bosh sahifa',
    hint: 'Bosh sahifa qaysi yillarni va qaysi ogohlantirishlarni ko‘rsatishi',
    icon: LayoutDashboard,
  },
  objects: {
    label: 'Obyektlar nazorati',
    hint: 'Obyekt qachon «e’tibor talab qiladi» deb belgilanishi',
    icon: Settings2,
  },
  photos: {
    label: 'Foto-hisobot qoidalari',
    hint: 'Surat qanday tekshirilishi va qachon tasdiq talab qilishi',
    icon: Camera,
  },
  support: {
    label: 'Yordam markazi',
    hint: 'Foydalanuvchiga ko‘rsatiladigan aloqa ma’lumotlari',
    icon: Headset,
  },
};

/** Toifalar ekranda shu tartibda chiqadi — eng ko‘p ishlatiladigani tepada. */
export const CATEGORY_ORDER = ['app', 'dashboard', 'objects', 'photos', 'support'];
