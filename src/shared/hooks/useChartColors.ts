import { useCallback } from 'react';
import { useUiStore } from '@/store/ui.store';
import {
  categoricalHex,
  DEADLINE_OVERDUE_HEX,
  DEADLINE_OVERDUE_HEX_DARK,
  DEADLINE_RAMP,
  DEADLINE_RAMP_DARK,
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

  return {
    dark,
    statusHex,
    seriesHex,
    deadlineHex,
    /** Diagramma to‘ri va o‘qi — matndan ancha ochroq. */
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,20,15,0.07)',
    axis: dark ? '#7a7a82' : '#8a8a93',
    /** Ko‘rsatma (tooltip) yuzasi. */
    tooltipBg: dark ? '#1d1d1d' : '#ffffff',
    tooltipText: dark ? '#f5f5f4' : '#0a0a0a',
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
export const CHART_CURSOR_FILL = 'rgb(16 20 15 / 0.05)';
