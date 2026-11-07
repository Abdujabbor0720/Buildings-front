import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CameraOff, MapPinOff, UserX, Wrench } from 'lucide-react';
import type {
  KpiBucket,
  KpiMetricDetail,
  KpiNamedRow,
  KpiPeriodRow,
  ObjectHealth,
  ObjectStatus,
  RiskLevel,
} from '@/shared/api/types';
import {
  HEALTH_META,
  progressTone,
  RISK_META,
  STATUS_META,
  type StatusMeta,
} from '@/shared/constants/health';
import {
  CHART_CURSOR_FILL,
  CHART_TOOLTIP_STYLE,
  useChartColors,
} from '@/shared/hooks/useChartColors';
import {
  Card,
  CardBody,
  CardHeader,
  ProgressBar,
  Table,
  TableWrap,
  TBody,
  Td,
  Th,
  THead,
  Tr,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { MONTHS_UZ_CAP, tashkentToday } from '@/shared/utils/date.utils';
import { formatCompact, formatCount, formatPercent } from '@/shared/utils/money.utils';
import type { KpiBlock, KpiBlockKey } from '../kpi.meta';
import { KpiDistribution, type DistRow } from './KpiDistribution';

/**
 * BLOK — sahifadagi bitta kesim kartasi.
 *
 * ⚠️ Qaysi bloklar va qaysi tartibda ko‘rinishi `kpi.meta.ts` da.
 * Bu yerda faqat HAR BIR BLOK QANDAY chiziladi. Ikkalasi bitta faylda
 * bo‘lsa, yangi ko‘rsatkich qo‘shish uchun chizish mantig‘iga
 * tegishga to‘g‘ri kelardi.
 */

export interface KpiFilterState {
  districtId: string | null;
  typeId: string | null;
  toggleDistrict: (id: string) => void;
  toggleType: (id: string) => void;
}

/** Holat tartibi — ekranda HAR DOIM bir xil, javobdagi tartibga qarab emas. */
const HEALTH_ORDER: ObjectHealth[] = [
  'on_schedule',
  'delayed',
  'at_risk',
  'not_started',
  'completed',
];
const STATUS_ORDER: ObjectStatus[] = [
  'not_started',
  'in_progress',
  'suspended',
  'completed',
  'cancelled',
];
const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

const PROGRESS_LABELS: Record<string, string> = {
  zero: 'Boshlanmagan (0%)',
  q1: '1–25%',
  q2: '26–50%',
  q3: '51–75%',
  q4: '76–99%',
  full: 'Yakunlangan (100%)',
};

/**
 * Bajarilish guruhining rangi — `progressTone()` DAN.
 *
 * ⚠️ Yangi rang o‘ylab topilmaydi: chiziq rangi butun tizimda bitta
 * funksiyadan keladi, aks holda bu ro‘yxatdagi 65% boshqa rangda,
 * jadvaldagi 65% boshqa rangda bo‘lardi.
 *
 * ⚠️ «Boshlanmagan» NEYTRAL, qizil emas: qurilish hali
 * boshlanmagani o‘zicha muammo degani emas — muddati kelgan-kelmagani
 * «Holat» kesimida aytiladi.
 */
const PROGRESS_BAR: Record<string, string> = {
  zero: 'bg-neutral-400 dark:bg-white/30',
  q1: progressTone(15),
  q2: progressTone(40),
  q3: progressTone(65),
  q4: progressTone(88),
  full: progressTone(100),
};

/**
 * HOLAT YORLIG‘I VA RANGI — XAVFSIZ qidiruv.
 *
 * ⚠️ To‘g‘ridan-to‘g‘ri `HEALTH_META[key].label` yozilmaydi.
 * `orderedBuckets` serverdan kelgan NOTANISH kalitni ataylab
 * ro‘yxatda qoldiradi (yo‘qolib ketmasin deb); o‘sha kalit uchun
 * jadvalda yozuv bo‘lmaydi va to‘g‘ridan-to‘g‘ri murojaat butun
 * sahifani «undefined.label» bilan yiqitardi.
 */
function metaRow(
  map: Record<string, StatusMeta | undefined>,
  bucket: KpiBucket,
  statusHex: (meta: StatusMeta) => string,
): DistRow {
  const meta = map[bucket.key];
  return {
    key: bucket.key,
    label: meta?.label ?? bucket.key,
    count: bucket.count,
    percent: bucket.percent,
    color: meta ? statusHex(meta) : undefined,
    barClass: meta ? undefined : 'bg-neutral-400 dark:bg-white/30',
  };
}

const BLOCK_SPAN: Record<number, string> = {
  4: 'xl:col-span-4',
  6: 'xl:col-span-6',
  12: 'xl:col-span-12',
};

interface BlockProps {
  block: KpiBlock;
  detail: KpiMetricDetail;
  filters: KpiFilterState;
}

export function KpiBlockCard({ block, detail, filters }: BlockProps) {
  const content = BLOCK_CONTENT[block.key];

  return (
    <Card className={cn('flex flex-col', BLOCK_SPAN[block.span])}>
      <CardHeader title={content.title} subtitle={content.subtitle} />
      <CardBody className="mt-2 flex-1">
        <BlockBody block={block} detail={detail} filters={filters} />
      </CardBody>
    </Card>
  );
}

const BLOCK_CONTENT: Record<KpiBlockKey, { title: string; subtitle?: string }> = {
  health: { title: 'Holat kesimi', subtitle: 'Muddat bo‘yicha sog‘lomlik' },
  status: { title: 'Hujjat bo‘yicha status', subtitle: 'Qurilish qaysi bosqichda' },
  risk: { title: 'Risk darajasi', subtitle: 'Avtomatik baho bo‘yicha' },
  progress: { title: 'Bajarilish taqsimoti', subtitle: 'Nechta obyekt qaysi oraliqda' },
  months: { title: 'Oylar kesimida topshirish', subtitle: 'Joriy yil rejasi' },
  years: { title: 'Topshirish yili', subtitle: 'Reja muddati bo‘yicha' },
  yearsCost: { title: 'Yillar kesimida qiymat', subtitle: 'Reja muddati bo‘yicha, so‘m' },
  types: { title: 'Qurilish turlari', subtitle: 'Bosib jadvalni filtrlang' },
  typesCost: { title: 'Qurilish turlari — qiymat bo‘yicha', subtitle: 'Bosib jadvalni filtrlang' },
  districts: { title: 'Tumanlar kesimi', subtitle: 'Qatorni bosib jadvalni filtrlang' },
  districtsCost: { title: 'Tumanlar kesimi — qiymat bo‘yicha', subtitle: 'Qatorni bosib jadvalni filtrlang' },
  contractors: { title: 'Pudratchilar (TOP 8)', subtitle: 'Obyektlar soni bo‘yicha' },
  funding: { title: 'Moliyalashtirish manbalari' },
  reasons: { title: 'Asosiy kechikish sabablari', subtitle: 'Obyekt kartasidagi asosiy sabab' },
  finance: { title: 'Moliya', subtitle: 'Qiymat, ajratilgan va to‘langan' },
  coverage: { title: 'Ma’lumot to‘liqligi', subtitle: 'To‘ldirilmagan joylar' },
};

function BlockBody({ block, detail, filters }: BlockProps) {
  const { statusHex, seriesHex, reasonHex } = useChartColors();

  switch (block.key) {
    case 'health':
      return (
        <KpiDistribution
          rows={orderedBuckets(detail.health, HEALTH_ORDER).map((bucket) =>
            metaRow(HEALTH_META, bucket, statusHex),
          )}
        />
      );

    case 'status':
      return (
        <KpiDistribution
          rows={orderedBuckets(detail.status, STATUS_ORDER).map((bucket) =>
            metaRow(STATUS_META, bucket, statusHex),
          )}
        />
      );

    case 'risk':
      return (
        <KpiDistribution
          rows={orderedBuckets(detail.risk, RISK_ORDER).map((bucket) =>
            metaRow(RISK_META, bucket, statusHex),
          )}
        />
      );

    case 'progress':
      return (
        <KpiDistribution
          rows={detail.progressBuckets.map((bucket) => ({
            key: bucket.key,
            label: PROGRESS_LABELS[bucket.key] ?? bucket.key,
            count: bucket.count,
            percent: bucket.percent,
            barClass: PROGRESS_BAR[bucket.key] ?? 'bg-neutral-400 dark:bg-white/30',
          }))}
        />
      );

    case 'types':
    case 'typesCost':
      return (
        <KpiDistribution
          measure={block.key === 'typesCost' ? 'amount' : 'count'}
          showAmount={block.span >= 6}
          empty="Qurilish turi bo‘yicha ma’lumot yo‘q"
          rows={detail.byType.map((row, index) => ({
            key: row.typeId,
            label: row.name,
            count: row.count,
            percent: row.percent,
            amount: row.totalCost,
            // ⚠️ Rang SERVERDAN olinmaydi (`row.color` ishlatilmaydi):
            // mijozdagi palitra validatordan o‘tgan va qorong‘i rejimni
            // faqat mijoz biladi (bosh sahifadagi `TypeBreakdown` bilan
            // AYNI qoida).
            color: seriesHex(index),
            active: filters.typeId === row.typeId,
            onClick: () => filters.toggleType(row.typeId),
          }))}
        />
      );

    case 'funding':
      return (
        <KpiDistribution
          showAmount={block.span >= 6}
          empty="Moliya manbasi ko‘rsatilmagan"
          rows={namedRows(detail.byFundingSource, 'Manba ko‘rsatilmagan', seriesHex)}
        />
      );

    case 'contractors':
      return (
        <KpiDistribution
          showAmount={block.span >= 6}
          empty="Pudratchi biriktirilmagan"
          rows={detail.byContractor.map((row) => ({
            key: row.id ?? 'none',
            label: row.name ?? 'Pudratchi biriktirilmagan',
            count: row.count,
            percent: row.percent,
            amount: row.totalCost,
            /* ⚠️ Pudratchilar — REYTING, turkum emas: ular bitta
               neytral rangda chiziladi. Har biriga alohida rang
               berilsa, rang hech narsani bildirmasdi. */
            barClass: row.id
              ? 'bg-neutral-400 dark:bg-white/35'
              : 'bg-warn-400 dark:bg-warn-500/60',
          }))}
        />
      );

    case 'reasons':
      return (
        <KpiDistribution
          showAmount={block.span >= 6}
          empty="Kechikish sababi qayd etilmagan"
          rows={namedRows(detail.byDelayReason, 'Sabab ko‘rsatilmagan', reasonHex)}
        />
      );

    case 'months':
      return <PeriodChart rows={detail.byMonth} kind="month" measure="count" year={detail.year} />;

    case 'years':
      return <PeriodChart rows={detail.byYear} kind="year" measure="count" />;

    case 'yearsCost':
      return <PeriodChart rows={detail.byYear} kind="year" measure="amount" />;

    case 'districts':
    case 'districtsCost':
      return (
        <DistrictBreakdown
          detail={detail}
          filters={filters}
          defaultSort={block.key === 'districtsCost' ? 'totalCost' : 'count'}
        />
      );

    case 'finance':
      return <FinanceBlock detail={detail} />;

    case 'coverage':
      return <CoverageBlock detail={detail} compact={block.span <= 4} />;

    default: {
      // Yangi blok qo‘shilib, bu yerga shoxcha yozilmasa — TIP XATOSI.
      const exhaustive: never = block.key;
      return <p className="t-meta">{String(exhaustive)}</p>;
    }
  }
}

/* ───────────────────────── Yordamchi bloklar ───────────────────────── */

/**
 * TARTIBLANGAN TAQSIMOT.
 *
 * ⚠️ Javobda bo‘lmagan guruh TUSHIRILADI, nol bilan to‘ldirilmaydi:
 * «Bekor qilingan — 0» degan qator har sahifada turib, ro‘yxatni
 * uzaytirardi, holbuki bekor qilinganlar bu doiraga umuman kirmaydi.
 */
function orderedBuckets(buckets: KpiBucket[], order: string[]): KpiBucket[] {
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));
  const known = order.map((key) => byKey.get(key)).filter((item): item is KpiBucket => Boolean(item));
  // Tartibda sanab o‘tilmagan kalit bo‘lsa (server yangi qiymat
  // qo‘shsa) — u YO‘QOLMAYDI, oxiriga qo‘shiladi.
  const rest = buckets.filter((bucket) => !order.includes(bucket.key));
  return [...known, ...rest];
}

function namedRows(
  rows: KpiNamedRow[],
  emptyLabel: string,
  hex: (index: number) => string,
): DistRow[] {
  return rows.map((row, index) => ({
    key: row.id ?? 'none',
    label: row.name ?? emptyLabel,
    count: row.count,
    percent: row.percent,
    amount: row.totalCost,
    color: row.id ? hex(index) : undefined,
    barClass: row.id ? undefined : 'bg-neutral-400 dark:bg-white/30',
  }));
}

interface PeriodProps {
  rows: KpiPeriodRow[];
  kind: 'month' | 'year';
  measure: 'count' | 'amount';
  year?: number;
}

/**
 * DAVR DIAGRAMMASI — oylar yoki yillar bo‘yicha ustunlar.
 *
 * ⚠️ Joriy oy AJRATILADI (to‘q rang): «qaysi oy hozir» degan savol
 * diagrammaga qarayotgan odamda birinchi tug‘iladi va uni o‘qlar
 * bo‘ylab sanashga majburlash ortiqcha.
 */
function PeriodChart({ rows, kind, measure, year }: PeriodProps) {
  const { seriesHex, grid, axis } = useChartColors();
  const currentMonth = tashkentToday().getUTCMonth() + 1;

  const data = rows.map((row) => {
    // ⚠️ Oy nomi massivdan OLINADI, nusxa ko‘chirilmaydi (`dates.md`).
    // Kutilmagan raqam kelsa (`0` yoki `13`) — `undefined.slice()`
    // butun diagrammani yiqitardi, shuning uchun zaxira qiymat bor.
    const monthName = kind === 'month' ? MONTHS_UZ_CAP[row.key - 1] : undefined;
    return {
      label: monthName ? monthName.slice(0, 3) : `${row.key}`,
      full: monthName ? `${monthName}${year ? `, ${year}` : ''}` : `${row.key}-yil`,
      value: measure === 'amount' ? Number(row.amount) : row.count,
      highlight: kind === 'month' && row.key === currentMonth,
    };
  });

  if (data.every((item) => item.value === 0)) {
    return <p className="t-meta py-10 text-center">Bu davrda ma’lumot yo‘q</p>;
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={grid} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: axis }}
            tickLine={false}
            axisLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axis }}
            tickLine={false}
            axisLine={false}
            width={measure === 'amount' ? 56 : 36}
            tickFormatter={(value: number) =>
              measure === 'amount' ? formatCompact(value) : formatCount(value)
            }
          />
          <Tooltip
            cursor={{ fill: CHART_CURSOR_FILL }}
            contentStyle={CHART_TOOLTIP_STYLE}
            labelFormatter={(_label, payload) =>
              (payload?.[0]?.payload as { full?: string } | undefined)?.full ?? ''
            }
            formatter={(value) => [
              measure === 'amount'
                ? `${formatCompact(Number(value))} so‘m`
                : `${formatCount(Number(value))} ta`,
              measure === 'amount' ? 'Qiymati' : 'Obyektlar',
            ]}
          />
          <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={44}>
            {data.map((item, index) => (
              <Cell
                key={index}
                fill={seriesHex(0)}
                fillOpacity={kind === 'month' && !item.highlight ? 0.55 : 1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

type DistrictSort = 'count' | 'totalCost' | 'avgProgress' | 'delayed' | 'atRisk';

function DistrictBreakdown({
  detail,
  filters,
  defaultSort,
}: {
  detail: KpiMetricDetail;
  filters: KpiFilterState;
  defaultSort: DistrictSort;
}) {
  const [sortKey, setSortKey] = useState<DistrictSort>(defaultSort);

  const rows = useMemo(() => {
    const list = [...detail.byDistrict];
    return list.sort((a, b) =>
      sortKey === 'totalCost'
        ? Number(b.totalCost) - Number(a.totalCost)
        : Number(b[sortKey]) - Number(a[sortKey]),
    );
  }, [detail.byDistrict, sortKey]);

  if (rows.length === 0) {
    return <p className="t-meta py-8 text-center">Tuman kesimida ma’lumot yo‘q</p>;
  }

  const activeSort = { by: sortKey, order: 'DESC' as const };

  return (
    <TableWrap>
      <Table>
        <THead>
          <Tr>
            <Th className="w-9">#</Th>
            <Th>Tuman</Th>
            <Th align="right" sortKey="count" activeSort={activeSort} onSort={(key) => setSortKey(key as DistrictSort)}>
              Soni
            </Th>
            <Th align="right">Ulush</Th>
            <Th align="right" sortKey="delayed" activeSort={activeSort} onSort={(key) => setSortKey(key as DistrictSort)}>
              Kechikayotgan
            </Th>
            <Th align="right" sortKey="atRisk" activeSort={activeSort} onSort={(key) => setSortKey(key as DistrictSort)}>
              Xavfli
            </Th>
            <Th className="w-[150px]" sortKey="avgProgress" activeSort={activeSort} onSort={(key) => setSortKey(key as DistrictSort)}>
              Bajarilish
            </Th>
            <Th align="right" sortKey="totalCost" activeSort={activeSort} onSort={(key) => setSortKey(key as DistrictSort)}>
              Qiymati
            </Th>
          </Tr>
        </THead>
        <TBody>
          {rows.map((row, index) => (
            <Tr
              key={row.districtId}
              className={cn(filters.districtId === row.districtId && 'bg-brand-500/[0.07] dark:bg-brand-400/10')}
              onClick={() => filters.toggleDistrict(row.districtId)}
            >
              <Td muted className="num text-micro">
                {index + 1}
              </Td>
              <Td className="font-medium whitespace-nowrap">{row.name}</Td>
              <Td align="right" className="num font-semibold">
                {formatCount(row.count)}
              </Td>
              <Td align="right" className="num text-muted">
                {formatPercent(row.percent)}
              </Td>
              {/* ⚠️ NOL qiymat XIRA: ko‘z bu jadvalda noldan FARQLI
                  raqamlarni qidiradi; «0» ham to‘q rangda bo‘lsa, u ham
                  muammo bordek ko‘rinadi (tumanlar jadvali bilan AYNI
                  qoida). */}
              <Count value={row.delayed} tone="text-warn-600 dark:text-warn-500" />
              <Count value={row.atRisk} tone="text-danger-600 dark:text-danger-500" />
              <Td>
                <ProgressBar value={row.avgProgress} showValue size="xs" />
              </Td>
              <Td align="right" className="num whitespace-nowrap">
                {formatCompact(row.totalCost)}
              </Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </TableWrap>
  );
}

function Count({ value, tone }: { value: number; tone: string }) {
  return (
    <Td align="right" className={cn('num', value > 0 ? tone : 'text-faint')}>
      {value}
    </Td>
  );
}

/**
 * MOLIYA BLOKI.
 *
 * ⚠️ Chiziqlar BIR XIL maxrajga (loyiha qiymatiga) nisbatan: ajratilgan
 * va to‘langan bir-biri bilan taqqoslanishi kerak. Har biri o‘z
 * maxrajiga nisbatan chizilsa, ikkalasi ham «deyarli to‘la» bo‘lib
 * ko‘rinardi.
 */
function FinanceBlock({ detail }: { detail: KpiMetricDetail }) {
  const { finance } = detail;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-label">Loyiha qiymati</span>
          <span className="num text-body font-semibold text-strong">
            {formatCompact(finance.totalCost)} so‘m
          </span>
        </div>
        <ProgressBar value={100} tone="bg-neutral-300 dark:bg-white/20" size="sm" className="mt-1.5" />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-label">Ajratilgan</span>
          <span className="num text-body font-semibold text-strong">
            {formatCompact(finance.fundedAmount)} so‘m
            <span className="ml-1.5 text-micro font-normal text-muted">
              {formatPercent(finance.fundedPercent)}
            </span>
          </span>
        </div>
        <ProgressBar value={finance.fundedPercent} tone="bg-brand-500" size="sm" className="mt-1.5" />
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="t-label">To‘langan</span>
          <span className="num text-body font-semibold text-strong">
            {formatCompact(finance.paidAmount)} so‘m
            <span className="ml-1.5 text-micro font-normal text-muted">
              {formatPercent(finance.paidPercent)}
            </span>
          </span>
        </div>
        <ProgressBar value={finance.paidPercent} tone="bg-ok-500" size="sm" className="mt-1.5" />
      </div>

      <div className="surface-inset flex items-baseline justify-between gap-2 rounded-lg px-3 py-2">
        <span className="t-label">Hali ajratilmagan</span>
        <span
          className={cn(
            'num text-body font-semibold',
            Number(finance.unfunded) > 0 ? 'text-warn-700 dark:text-warn-300' : 'text-ok-700 dark:text-ok-300',
          )}
        >
          {formatCompact(finance.unfunded)} so‘m
        </span>
      </div>
    </div>
  );
}

/**
 * MA’LUMOT TO‘LIQLIGI.
 *
 * ⚠️ Nol ham KO‘RSATILADI va u YAXSHI xabar: «mas’ulsiz 0 ta» degan
 * yozuv «bu tekshirildi» deyishning yagona yo‘li. Blok butunlay
 * yashirilsa, foydalanuvchi tekshiruv umuman bor-yo‘qligini bilmas
 * edi.
 */
function CoverageBlock({ detail, compact }: { detail: KpiMetricDetail; compact?: boolean }) {
  const { coverage } = detail;

  const items = [
    {
      key: 'responsible',
      label: 'Mas’uli yo‘q',
      value: coverage.withoutResponsible,
      icon: UserX,
      hint: 'kurator biriktirilmagan',
    },
    {
      key: 'contractor',
      label: 'Pudratchisi yo‘q',
      value: coverage.withoutContractor,
      icon: Wrench,
      hint: 'shartnoma kiritilmagan',
    },
    {
      key: 'coords',
      label: 'Xaritada yo‘q',
      value: coverage.withoutCoords,
      icon: MapPinOff,
      hint: 'koordinata kiritilmagan',
    },
    {
      key: 'reports',
      label: 'Hisobot eskirgan',
      value: coverage.staleReports,
      icon: CameraOff,
      hint: '30 kundan beri foto yo‘q',
    },
  ];

  return (
    <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
      {items.map((item) => {
        const Icon = item.icon;
        const bad = item.value > 0;
        return (
          <div
            key={item.key}
            className="surface-inset flex min-w-0 flex-col gap-1 rounded-lg px-2.5 py-2"
          >
            <span className="flex items-center gap-1.5">
              <Icon
                className={cn(
                  'size-3.5 shrink-0',
                  bad ? 'text-warn-600 dark:text-warn-400' : 'text-ok-600 dark:text-ok-400',
                )}
              />
              <span className="t-label truncate" title={item.label}>
                {item.label}
              </span>
            </span>
            <span
              className={cn(
                'num text-head leading-none',
                bad ? 'text-warn-700 dark:text-warn-300' : 'text-faint',
              )}
            >
              {formatCount(item.value)}
            </span>
            <span className="text-faint truncate text-nano" title={item.hint}>
              {item.hint}
            </span>
          </div>
        );
      })}
    </div>
  );
}
