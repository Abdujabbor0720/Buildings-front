import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * SAHIFANI KECHIKTIRIB YUKLASH — eskirgan bo‘lakni o‘zi tuzatadi.
 *
 * ⚠️ MUAMMO. Ilova sahifalarga bo‘lib yuklanadi va har bo‘lak nomida
 * mazmun xeshi bor (`MapPage-DFmo0HS0.js`). Yangi versiya chiqarilganda
 * eski bo‘laklar serverdan O‘CHADI. Ochiq turgan ilova esa hali ESKI
 * `index.html` ni ushlab turadi va menyudan yangi sahifaga o‘tilganda
 * mavjud bo‘lmagan bo‘lakni so‘raydi:
 *
 *   TypeError: Failed to fetch dynamically imported module
 *
 * Foydalanuvchi uchun bu «sayt buzildi» bo‘lib ko‘rinadi, holbuki
 * sahifani yangilash yetarli. Hokimlikda brauzer kun bo‘yi ochiq
 * turadi, ya’ni HAR deploy shu xatoni keltirib chiqarardi.
 *
 * ⚠️ YECHIM. Bo‘lak yuklanmasa sahifa BIR MARTA qayta yuklanadi —
 * shunda brauzer yangi `index.html` va yangi bo‘lak nomlarini oladi.
 *
 * ⚠️ `sessionStorage` BELGISI SHART. Busiz, server haqiqatan ishlamay
 * qolganda (tarmoq uzilgan, fayl yo‘q) sahifa CHEKSIZ qayta yuklanib,
 * brauzerni qotirib qo‘yardi. Belgi bilan ikkinchi urinishda xato
 * oddiy xato bo‘lib ko‘rinadi va React xato chegarasiga tushadi.
 */
const RELOAD_FLAG = 'chunk-reload-at';
/** Shu vaqt ichida ikkinchi marta yiqilsa — bu deploy emas, haqiqiy xato. */
const RELOAD_WINDOW_MS = 10_000;

export function lazyPage<T extends ComponentType<unknown>>(
  load: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  return lazy(() =>
    load().catch((error: unknown) => {
      const last = Number(sessionStorage.getItem(RELOAD_FLAG) ?? 0);
      const recentlyReloaded = Date.now() - last < RELOAD_WINDOW_MS;

      if (!recentlyReloaded) {
        sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
        // ⚠️ `replace` — tarixga yangi yozuv qo‘shmaydi: aks holda
        // «Orqaga» tugmasi foydalanuvchini yana buzuq holatga qaytarardi.
        window.location.reload();
        // Qayta yuklash boshlangunicha React kutib tursin.
        return new Promise<{ default: T }>(() => {});
      }

      throw error;
    }),
  );
}
