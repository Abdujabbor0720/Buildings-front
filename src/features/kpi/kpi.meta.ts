import {
  Building2,
  CircleCheckBig,
  Clock,
  Construction,
  Database,
  ShieldAlert,
  type LucideIcon,
} from 'lucide-react';
import type { KpiMetricDetail, KpiMetricKey } from '@/shared/api/types';
import type { KpiTone } from '@/shared/constants/kpi-tone';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';

/**
 * OLTITA KO‘RSATKICH SAHIFASINING TA’RIFI — YAGONA MANBA.
 *
 * ⚠️ Sahifa bitta (`KpiDetailPage`), oltita nusxa EMAS. Oltita fayl
 * bo‘lsa, bitta blokdagi tuzatish qolgan beshtasiga ko‘chirilmay
 * qolardi — tajriba shuni ko‘rsatadi. Farq faqat SHU TA’RIFDA:
 * sarlavha, rang, qaysi bloklar va qaysi tartibda.
 *
 * ⚠️ `label` bosh sahifadagi karta yozuvi bilan AYNAN bir xil:
 * foydalanuvchi «Xavfli holatda» ni bosib, ichkarida boshqa sarlavha
 * ko‘rsa, boshqa joyga tushganday bo‘lardi.
 */

export type KpiBlockKey =
  | 'health'
  | 'status'
  | 'risk'
  | 'progress'
  | 'months'
  | 'years'
  | 'yearsCost'
  | 'types'
  | 'typesCost'
  | 'districts'
  | 'districtsCost'
  | 'contractors'
  | 'funding'
  | 'reasons'
  | 'finance'
  | 'coverage';

/**
 * Blok kengligi — 12 ustunli to‘rda.
 *
 * ⚠️ Har qatordagi bloklar yig‘indisi ANIQ 12 bo‘lishi kerak. Aks
 * holda to‘rda bo‘sh katak qoladi va sahifa «yarim yuklangan» bo‘lib
 * ko‘rinadi. Yangi blok qo‘shganda qatorni qaytadan hisoblang.
 */
export type KpiSpan = 4 | 6 | 12;

export interface KpiBlock {
  key: KpiBlockKey;
  span: KpiSpan;
}

export type KpiStatKey =
  | 'scopeTotal'
  | 'avgProgress'
  | 'expectedProgress'
  | 'gap'
  | 'delayedCount'
  | 'avgDelayDays'
  | 'maxDelayDays'
  | 'over90'
  | 'overdue'
  | 'openDelays'
  | 'avgRisk'
  | 'totalCost'
  | 'fundedAmount'
  | 'fundedPercent'
  | 'paidAmount'
  | 'paidPercent'
  | 'unfunded';

export interface KpiMeta {
  key: KpiMetricKey;
  /** Bosh sahifadagi karta yorlig‘i — AYNAN bir xil. */
  label: string;
  title: string;
  description: string;
  tone: KpiTone;
  icon: LucideIcon;
  /** Sarlavhadagi raqam: soni yoki summasi. */
  headline: 'count' | 'money';
  /**
   * Ulush halqasi ko‘rsatiladimi.
   *
   * ⚠️ «Jami obyektlar» va «Umumiy qiymat» da YO‘Q: ular butunning
   * O‘ZI, «100%» degan halqa esa hech narsa aytmaydi.
   */
  share: boolean;
  stats: KpiStatKey[];
  blocks: KpiBlock[];
  /** Obyektlar jadvalining boshlang‘ich saralashi. */
  sort: { by: string; order: 'ASC' | 'DESC' };
}

export const KPI_ORDER: readonly KpiMetricKey[] = [
  'total',
  'on-plan',
  'delayed',
  'at-risk',
  'completing',
  'cost',
];

export const KPI_META: Record<KpiMetricKey, KpiMeta> = {
  total: {
    key: 'total',
    label: 'Jami obyektlar',
    title: 'Jami obyektlar',
    description:
      'Nazoratdagi barcha obyektlar — topshirilgan va bekor qilinganlarsiz. Quyidagi barcha kesimlar sarlavhadagi filtrga bo‘ysunadi.',
    tone: 'brand',
    icon: Building2,
    headline: 'count',
    share: false,
    stats: [
      'avgProgress',
      'expectedProgress',
      'delayedCount',
      'overdue',
      'openDelays',
      'totalCost',
    ],
    blocks: [
      { key: 'health', span: 4 },
      { key: 'status', span: 4 },
      { key: 'risk', span: 4 },
      { key: 'progress', span: 4 },
      { key: 'years', span: 4 },
      { key: 'types', span: 4 },
      { key: 'districts', span: 12 },
      { key: 'contractors', span: 6 },
      { key: 'funding', span: 6 },
      { key: 'finance', span: 6 },
      { key: 'coverage', span: 6 },
    ],
    sort: { by: 'plannedEndDate', order: 'ASC' },
  },

  'on-plan': {
    key: 'on-plan',
    label: 'Reja asosida',
    title: 'Reja asosidagi obyektlar',
    description:
      'Muddatdan ortda qolmagan obyektlar: reja asosida ketayotganlar va qurilishi hali boshlanmagan, lekin muddati ham kelmaganlar.',
    tone: 'ok',
    icon: CircleCheckBig,
    headline: 'count',
    share: true,
    stats: [
      'avgProgress',
      'expectedProgress',
      'gap',
      'overdue',
      'totalCost',
      'fundedAmount',
    ],
    blocks: [
      { key: 'health', span: 4 },
      { key: 'progress', span: 4 },
      { key: 'status', span: 4 },
      { key: 'years', span: 4 },
      { key: 'types', span: 4 },
      { key: 'risk', span: 4 },
      { key: 'districts', span: 12 },
      { key: 'contractors', span: 6 },
      { key: 'funding', span: 6 },
      { key: 'finance', span: 6 },
      { key: 'coverage', span: 6 },
    ],
    sort: { by: 'plannedEndDate', order: 'ASC' },
  },

  delayed: {
    key: 'delayed',
    label: 'Kechikayotgan',
    title: 'Kechikayotgan obyektlar',
    description:
      'Reja muddatidan ortda qolgan obyektlar. Sabablar, tumanlar va pudratchilar kesimi — «nega kechikdi» degan savolga javob.',
    tone: 'warn',
    icon: Clock,
    headline: 'count',
    share: true,
    stats: [
      'avgDelayDays',
      'maxDelayDays',
      'over90',
      'avgProgress',
      'gap',
      'openDelays',
    ],
    blocks: [
      { key: 'reasons', span: 6 },
      { key: 'risk', span: 6 },
      { key: 'progress', span: 4 },
      { key: 'status', span: 4 },
      { key: 'years', span: 4 },
      { key: 'districts', span: 12 },
      { key: 'types', span: 6 },
      { key: 'contractors', span: 6 },
      { key: 'finance', span: 6 },
      { key: 'coverage', span: 6 },
    ],
    sort: { by: 'delayDays', order: 'DESC' },
  },

  'at-risk': {
    key: 'at-risk',
    label: 'Xavfli holatda',
    title: 'Xavfli holatdagi obyektlar',
    description:
      'Jiddiy kechikish yoki yuqori risk bahosi olgan obyektlar — bugun aralashuv talab qiladiganlar.',
    tone: 'danger',
    icon: ShieldAlert,
    headline: 'count',
    share: true,
    stats: [
      'avgRisk',
      'avgDelayDays',
      'over90',
      'avgProgress',
      'gap',
      'openDelays',
    ],
    blocks: [
      { key: 'risk', span: 6 },
      { key: 'reasons', span: 6 },
      { key: 'progress', span: 4 },
      { key: 'status', span: 4 },
      { key: 'years', span: 4 },
      { key: 'districts', span: 12 },
      { key: 'types', span: 6 },
      { key: 'contractors', span: 6 },
      { key: 'finance', span: 6 },
      { key: 'coverage', span: 6 },
    ],
    sort: { by: 'riskScore', order: 'DESC' },
  },

  completing: {
    key: 'completing',
    label: 'Joriy yil yakunlanadi',
    title: 'Joriy yilda yakunlanadigan obyektlar',
    description:
      'Reja bo‘yicha shu yil oxirigacha topshirilishi kerak bo‘lgan obyektlar — oylar kesimida taqsimlangan.',
    tone: 'done',
    icon: Construction,
    headline: 'count',
    share: true,
    stats: [
      'avgProgress',
      'expectedProgress',
      'delayedCount',
      'overdue',
      'totalCost',
      'fundedAmount',
    ],
    blocks: [
      { key: 'months', span: 12 },
      { key: 'health', span: 4 },
      { key: 'progress', span: 4 },
      { key: 'risk', span: 4 },
      { key: 'districts', span: 12 },
      { key: 'types', span: 6 },
      { key: 'contractors', span: 6 },
      { key: 'finance', span: 6 },
      { key: 'coverage', span: 6 },
    ],
    sort: { by: 'plannedEndDate', order: 'ASC' },
  },

  cost: {
    key: 'cost',
    label: 'Umumiy qiymat',
    title: 'Obyektlarning umumiy qiymati',
    description:
      'Nazoratdagi obyektlarning loyiha qiymati: qancha ajratilgan, qancha to‘langan va qancha mablag‘ hali yopilmagan.',
    tone: 'brand',
    icon: Database,
    headline: 'money',
    share: false,
    stats: [
      'fundedAmount',
      'fundedPercent',
      'paidAmount',
      'paidPercent',
      'unfunded',
      'avgProgress',
    ],
    blocks: [
      { key: 'finance', span: 6 },
      { key: 'funding', span: 6 },
      { key: 'yearsCost', span: 12 },
      { key: 'typesCost', span: 6 },
      { key: 'contractors', span: 6 },
      { key: 'districtsCost', span: 12 },
      { key: 'progress', span: 4 },
      { key: 'status', span: 4 },
      { key: 'coverage', span: 4 },
    ],
    sort: { by: 'totalCost', order: 'DESC' },
  },
};

/** Havola — bosh sahifadagi karta ham, sahifaning o‘zi ham shuni ishlatadi. */
export function kpiPath(metric: KpiMetricKey): string {
  return `/kpi/${metric}`;
}

/**
 * URL'dagi bo‘lak haqiqiy ko‘rsatkichmi.
 *
 * ⚠️ Tekshiruvsiz `/kpi/foo` serverga ketib, 400 bilan qaytardi va
 * foydalanuvchi «xatolik» ekranini ko‘rardi — holbuki to‘g‘ri javob
 * «bunday sahifa yo‘q».
 */
export function isKpiMetric(value: string | undefined): value is KpiMetricKey {
  return Boolean(value) && value! in KPI_META;
}

/**
 * SARLAVHA OSTIDAGI BIR QATOR — raqam nimani anglatishini aytadi.
 *
 * ⚠️ Bosh sahifadagi karta izohi bilan BIR MA’NODA bo‘lishi kerak,
 * lekin bu yerda joy ko‘p: kartada sig‘magan sharh aynan shu qatorda
 * aytiladi.
 */
export function kpiCaption(meta: KpiMeta, detail: KpiMetricDetail): string {
  switch (meta.key) {
    case 'total':
      return 'Topshirilgan va bekor qilinganlar hisobga olinmagan';
    case 'on-plan':
      return 'Reja asosida ketayotgan va muddati hali kelmagan obyektlar';
    case 'delayed':
      return `O‘rtacha ${formatCount(detail.delays.avgDelayDays)} kun kechikish · ${formatCount(
        detail.delays.over90,
      )} tasi 90 kundan ortiq`;
    case 'at-risk':
      return `O‘rtacha risk bahosi ${formatCount(detail.delays.avgRiskScore)} / 100`;
    case 'completing':
      return `${detail.year}-yil oxirigacha topshirilishi rejalashtirilgan`;
    case 'cost':
      return `Ajratilgan: ${formatCompact(detail.finance.fundedAmount)} so‘m · ${formatCount(
        detail.count,
      )} ta obyekt`;
    default: {
      const exhaustive: never = meta.key;
      return String(exhaustive);
    }
  }
}

/* ───────────────────────── Ko‘rsatkich chiplari ───────────────────────── */

export interface KpiStat {
  label: string;
  value: string;
  /** Raqam ostidagi bir qatorli izoh — «nimaning» foizi ekanini aytadi. */
  hint?: string;
  tone?: 'ok' | 'warn' | 'danger' | 'muted';
}

/**
 * Sarlavha ostidagi ko‘rsatkich — SON EMAS, JAVOB.
 *
 * ⚠️ Har bir chipda izoh bor: «72.8%» o‘zicha hech nima demaydi,
 * «reja bo‘yicha 81%» bilan yonma-yon turganda esa hamma narsani
 * aytadi. Bosh sahifadagi kartalar bilan AYNI qoida.
 */
export function kpiStat(key: KpiStatKey, detail: KpiMetricDetail): KpiStat {
  const { progress, delays, finance } = detail;

  switch (key) {
    case 'scopeTotal':
      return {
        label: 'Filtrdagi jami',
        value: formatCount(detail.scopeTotal),
        hint: 'barcha faol obyekt',
      };
    case 'avgProgress':
      return {
        label: 'O‘rtacha bajarilish',
        value: formatPercent(progress.avg),
        hint: `reja bo‘yicha ${formatPercent(progress.expectedAvg)}`,
      };
    case 'expectedProgress':
      return {
        label: 'Reja bo‘yicha',
        value: formatPercent(progress.expectedAvg),
        hint: 'bugungi kunga bo‘lishi kerak',
      };
    case 'gap':
      return {
        label: 'Rejadan ortda',
        value: formatPercent(Math.max(0, progress.gapAvg)),
        hint: 'o‘rtacha farq',
        tone: progress.gapAvg > 10 ? 'danger' : progress.gapAvg > 0 ? 'warn' : 'ok',
      };
    case 'delayedCount':
      return {
        label: 'Kechikkanlari',
        value: formatCount(delays.delayedCount),
        hint: 'muddatdan ortda',
        tone: delays.delayedCount > 0 ? 'warn' : 'ok',
      };
    case 'avgDelayDays':
      return {
        label: 'O‘rtacha kechikish',
        value: `${formatCount(delays.avgDelayDays)} kun`,
        hint: 'faqat kechikkanlar bo‘yicha',
        tone: 'warn',
      };
    case 'maxDelayDays':
      return {
        label: 'Eng uzun kechikish',
        value: `${formatCount(delays.maxDelayDays)} kun`,
        hint: 'bitta obyekt bo‘yicha',
        tone: 'danger',
      };
    case 'over90':
      return {
        label: '90 kundan ortiq',
        value: formatCount(delays.over90),
        hint: 'chuqur kechikkanlar',
        tone: delays.over90 > 0 ? 'danger' : 'ok',
      };
    case 'overdue':
      return {
        label: 'Muddati o‘tgan',
        value: formatCount(delays.overdue),
        hint: 'reja sanasi o‘tib ketgan',
        tone: delays.overdue > 0 ? 'danger' : 'ok',
      };
    case 'openDelays':
      return {
        label: 'Ochiq muammolar',
        value: formatCount(delays.openDelays),
        hint: 'hal qilinmagan yozuvlar',
        tone: delays.openDelays > 0 ? 'warn' : 'ok',
      };
    case 'avgRisk':
      return {
        label: 'O‘rtacha risk',
        value: `${formatCount(delays.avgRiskScore)} / 100`,
        hint: 'baho qancha yuqori — shuncha xavfli',
        tone: 'danger',
      };
    case 'totalCost':
      return {
        label: 'Loyiha qiymati',
        value: `${formatCompact(finance.totalCost)} so‘m`,
        hint: 'jami smeta',
      };
    case 'fundedAmount':
      return {
        label: 'Ajratilgan',
        value: `${formatCompact(finance.fundedAmount)} so‘m`,
        hint: `qiymatning ${formatPercent(finance.fundedPercent)} i`,
      };
    case 'fundedPercent':
      return {
        label: 'Ajratilgan ulush',
        value: formatPercent(finance.fundedPercent),
        hint: 'loyiha qiymatidan',
        tone: finance.fundedPercent >= 90 ? 'ok' : 'warn',
      };
    case 'paidAmount':
      return {
        label: 'To‘langan',
        value: `${formatCompact(finance.paidAmount)} so‘m`,
        hint: `qiymatning ${formatPercent(finance.paidPercent)} i`,
      };
    case 'paidPercent':
      return {
        label: 'To‘langan ulush',
        value: formatPercent(finance.paidPercent),
        hint: 'loyiha qiymatidan',
        tone: finance.paidPercent >= 90 ? 'ok' : 'warn',
      };
    case 'unfunded':
      return {
        label: 'Ajratilmagan',
        value: `${formatCompact(finance.unfunded)} so‘m`,
        hint: 'qiymat − ajratilgan',
        tone: Number(finance.unfunded) > 0 ? 'warn' : 'ok',
      };
    default: {
      // ⚠️ Yangi kalit qo‘shilib, bu yerga shart yozilmasa — TIP XATOSI
      // (`never` ga tayinlash kompilyatsiyada yiqiladi). Jim `undefined`
      // qaytarilsa, chip ekranda bo‘sh bo‘lib turardi.
      const exhaustive: never = key;
      return { label: String(exhaustive), value: '—' };
    }
  }
}
