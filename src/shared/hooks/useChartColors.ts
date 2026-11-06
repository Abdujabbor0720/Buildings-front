import { useCallback } from 'react';
import { useUiStore } from '@/store/ui.store';
import {
  categoricalHex,
  DENSITY_RAMP,
  DENSITY_RAMP_DARK,
  DEADLINE_OVERDUE_HEX,
  DEADLINE_OVERDUE_HEX_DARK,
  DEADLINE_RAMP,
  DEADLINE_RAMP_DARK,
  reasonHex as reasonHexFn,
  type StatusMeta,
} from '@/shared/constants/health';

/**
 * Diagramma va xarita ranglari — rejimga qarab.
 *
 * ⚠️ Yorug‘ rejim rangini qorong‘i fonda qoldirib bo‘lmaydi: to‘q yashil
 * (#12805C) qora fonda deyarli ko‘rinmaydi. Shuning uchun har bir holatda
 * ikkita HEX bor (`hex` / `hexDark`) va tanlov SHU YERDA — har bir
 * diagrammada qayta yozilsa, bittasi albatta esdan chiqardi.
 */
export function useChartColors() {
  const dark = useUiStore((state) => state.theme === 'dark');

  const statusHex = useCallback((meta: StatusMeta) => (dark ? meta.hexDark : meta.hex), [dark]);
  const seriesHex = useCallback((index: number) => categoricalHex(index, dark), [dark]);

  /**
   * Kechikish sabablari — turkum palitrasining boshqa tartibi.
   * ⚠️ `seriesHex` bilan almashtirib yubormang: ikkala ro‘yxat bir
   * ekranda turadi va bir xil tartibda bo‘lsa, ular o‘zaro bog‘liqdek
   * ko‘rinadi (batafsil `health.ts` dagi `REASON_ORDER`).
   */
  const reasonHex = useCallback((index: number) => reasonHexFn(index, dark), [dark]);

  /**
   * Muddat guruhi — tartibli ramp; «muddati o‘tgan» undan tashqarida.
   *
   * ⚠️ Pog‘ona guruhlar SONIGA yoyiladi. Ketma-ket 0,1,2 olinsa, uchta
   * guruh rampaning faqat to‘q uchidan rang olib, uchalasi ham bir xil
   * jigarrang bo‘lib qolardi — tartib ko‘rinmay ketardi.
   */
  const deadlineHex = useCallback(
    (index: number, count = 4, overdue = false) => {
      if (overdue) return dark ? DEADLINE_OVERDUE_HEX_DARK : DEADLINE_OVERDUE_HEX;
      const ramp = dark ? DEADLINE_RAMP_DARK : DEADLINE_RAMP;
      if (count <= 1) return ramp[0];
      const step = Math.round((index * (ramp.length - 1)) / (count - 1));
      return ramp[Math.min(Math.max(step, 0), ramp.length - 1)];
    },
    [dark],
  );

  /**
   * Xarita poligoni — OBYEKT SONI bo‘yicha ketma-ket (sequential) shkala.
   *
   * ⚠️ Poligon HOLAT rangida bo‘yalmaydi: tuman ustidagi belgi allaqachon
   * holatni ko‘rsatadi. Ikkalasi ham holatni kodlasa, xarita bitta
   * o‘zgaruvchini ikki marta aytib, ikkinchisini (nechta obyekt borligini)
   * umuman aytmay qolardi.
   */
  const densityHex = useCallback(
    (total: number) => {
      const ramp = dark ? DENSITY_RAMP_DARK : DENSITY_RAMP;
      if (total <= 0) return ramp[0];
      // Chegaralar: 1–4, 5–9, 10–14, 15–19, 20–24, 25+
      const step = Math.min(ramp.length - 1, 1 + Math.floor(total / 5));
      return ramp[step];
    },
    [dark],
  );

  /**
   * NISBIY zichlik shkalasi — qatlamning O'Z oralig'iga moslashadi.
   *
   * ⚠️ `densityHex` chegaralari MUTLAQ (1–4, 5–9, … 25+) va ular
   * viloyat xaritasi uchun tanlangan: u yerda tumanlarda 5 dan 29
   * tagacha obyekt bor va shkala chiroyli yoyiladi.
   *
   * MAHALLA kesimida esa sonlar 0–3 oralig'ida bo'ladi va mutlaq
   * shkalada HAMMASI eng och pog'onaga tushib, xarita bo'm-bo'sh oq
   * bo'lib ko'rinardi. Shuning uchun tuman xaritasi shkalani o'z eng
   * katta qiymatiga moslaydi: «1 ta obyekt» och, «eng ko'pi» to'q.
   *
   * ⚠️ Viloyat xaritasi AVVALGIDEK `densityHex` ni ishlatadi —
   * tumanlar rangi o'zgarmasligi kerak.
   */
  const densityHexOf = useCallback(
    (total: number, max: number) => {
      const ramp = dark ? DENSITY_RAMP_DARK : DENSITY_RAMP;
      if (total <= 0) return ramp[0];
      if (max <= 1) return ramp[ramp.length - 1];
      /*
       * ⚠️ Shkala 2-pog'onadan boshlanadi, 1-dan emas. Mahalla
       * kesimida sonlar kichik (ko'pincha 1) va eng past pog'ona
       * («#d5e2f7») bo'sh mahalladan deyarli farq qilmasdi: xarita
       * oq bo'lib, «qayerda obyekt bor» degan savol javobsiz
       * qolardi. Ikkinchi pog'onadan boshlanganda esa bitta obyektli
       * mahalla ham darhol ko'rinadi, nol esa baribir eng och qoladi.
       */
      const FIRST = 2;
      const t = (total - 1) / (max - 1);
      return ramp[Math.min(ramp.length - 1, FIRST + Math.round(t * (ramp.length - 1 - FIRST)))];
    },
    [dark],
  );

  return {
    dark,
    statusHex,
    seriesHex,
    reasonHex,
    deadlineHex,
    densityHex,
    densityHexOf,
    /** Diagramma to‘ri va o‘qi — matndan ancha ochroq. */
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,42,76,0.08)',
    axis: dark ? '#6f8299' : '#94a6bd',
    /** Ko‘rsatma (tooltip) yuzasi. */
    tooltipBg: dark ? '#1b2937' : '#ffffff',
    tooltipText: dark ? '#eef3f8' : '#16222f',
  };
}

/**
 * Recharts ko‘rsatmasining ko‘rinishi — YAGONA manba.
 *
 * ⚠️ Sakkizta diagrammada qo‘lda takrorlangan edi; bittasi o‘zgartirilsa
 * qolgan yettitasi eski ko‘rinishda qolib ketardi.
 */
export const CHART_TOOLTIP_STYLE = {
  borderRadius: 10,
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  border: 'none',
  boxShadow: 'var(--shadow-pop)',
  background: 'var(--surface)',
  color: 'var(--ink-body)',
  padding: '8px 10px',
} as const;

/** Ustun ustiga kelganda fon — brend emas, neytral. */
export const CHART_CURSOR_FILL = 'rgb(16 42 76 / 0.05)';
