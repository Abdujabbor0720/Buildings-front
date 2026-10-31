import { Loader2, RefreshCw, ScanEye, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useReanalyzePhoto } from '@/shared/api/queries';
import type { PhotoReport } from '@/shared/api/types';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatPercent } from '@/shared/utils/money.utils';

/**
 * SURATDAN BAHOLASH PANELI.
 *
 * Asosiy savol bitta: «hisobotda yozilgan foiz suratdagi holatga mos keladimi».
 * Shuning uchun ikkita raqam YONMA-YON va bitta shkalada ko‘rsatiladi —
 * ikki alohida kartada bo‘lsa, odam ularni o‘zi taqqoslashga majbur bo‘lardi.
 *
 * ⚠️ Model bahosi ORALIQ bilan beriladi. Bitta son ko‘rsatilsa, u aniq
 * o‘lchov kabi ko‘rinardi — holbuki suratdan 58% ni 61% dan ajratib
 * bo‘lmaydi va shu aniqlik asosida odamni ayblab bo‘lmaydi.
 */
export function AiVisionPanel({
  report,
  canModerate,
}: {
  report: PhotoReport;
  canModerate: boolean;
}) {
  const reanalyze = useReanalyzePhoto();
  const analysis = report.aiAnalysis;

  async function onReanalyze() {
    try {
      await reanalyze.mutateAsync(report.id);
      toast.success('Tahlil yangilandi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h3 className="t-section inline-flex items-center gap-2">
        <ScanEye className="size-4 text-brand-600 dark:text-brand-400" />
        Suratdan baholash
      </h3>
      {canModerate ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReanalyze}
          loading={reanalyze.isPending}
          leftIcon={<RefreshCw className="size-3.5" />}
        >
          Qayta tahlil
        </Button>
      ) : null}
    </div>
  );

  /* ───── Navbatda ───── */
  if (report.aiVisionStatus === 'pending' || report.aiVisionStatus === 'failed') {
    return (
      <section className="surface-inset rounded-xl p-3.5">
        {header}
        <p className="t-meta mt-2 inline-flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" />
          {report.aiVisionStatus === 'failed'
            ? 'Tahlil qilib bo‘lmadi — tizim yana urinib ko‘radi'
            : 'Surat tahlil navbatida'}
        </p>
      </section>
    );
  }

  /* ───── Tahlil qilib bo‘lmadi ─────
     ⚠️ Sabab YASHIRILMAYDI: «tahlil yo‘q» deb qoldirilsa, foydalanuvchi
     tizim buzuq deb o‘ylardi. Sabab ko‘rsatilsa — nima qilish kerakligi
     ma’lum bo‘ladi (masalan, OpenAI hisobini to‘ldirish). */
  if (report.aiVisionStatus === 'unavailable' || !analysis) {
    return (
      <section className="surface-inset rounded-xl p-3.5">
        {header}
        <p className="t-meta mt-2 inline-flex items-start gap-2">
          <TriangleAlert className="text-faint mt-0.5 size-3.5 shrink-0" />
          <span>
            {analysis?.unavailableReason ?? 'Bu hisobot uchun tahlil mavjud emas'}
          </span>
        </p>
        <p className="text-faint mt-2 text-micro">
          Hisobot baribir tekshirilgan: surat vaqti, joylashuvi va bajarilish
          dinamikasi qoidalar bo‘yicha baholandi.
        </p>
      </section>
    );
  }

  /* ───── Tahlil tayyor ───── */
  const reported = report.progressPercent;
  const low = analysis.rangeMin;
  const high = analysis.rangeMax;
  const withinRange = reported >= low && reported <= high;
  const deviation = withinRange ? 0 : reported > high ? reported - high : reported - low;
  const remaining = Math.max(0, 100 - analysis.estimatedProgressPercent);

  return (
    <section className="surface-inset rounded-xl p-3.5">
      {header}

      {/* Ikkita raqam yonma-yon — asosiy taqqoslash */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        <Figure label="Hisobotda" value={formatPercent(reported)} />
        <Figure
          label="Suratdan"
          value={`${low}–${high}%`}
          tone={withinRange ? 'text-ok-700 dark:text-ok-300' : 'text-danger-700 dark:text-danger-300'}
        />
        <Figure label="Qolgan ish" value={`~${Math.round(remaining)}%`} muted />
      </div>

      {/* Bitta shkala: ikkala qiymat ham shu yerda */}
      <ComparisonBar reported={reported} low={low} high={high} />

      <p
        className={cn(
          'mt-2.5 text-meta',
          withinRange ? 'text-ok-700 dark:text-ok-300' : 'text-danger-700 dark:text-danger-300',
        )}
      >
        {withinRange
          ? 'Hisobotdagi foiz suratga mos keladi'
          : deviation > 0
            ? `Hisobotda ${Math.abs(Math.round(deviation * 10) / 10)}% ga oshirib ko‘rsatilgan`
            : `Hisobotda ${Math.abs(Math.round(deviation * 10) / 10)}% ga kam ko‘rsatilgan`}
      </p>

      {analysis.summary ? (
        <p className="t-meta mt-2 leading-relaxed">{analysis.summary}</p>
      ) : null}

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <WorkList title="Bajarilgan" items={analysis.completedWorks} tone="ok" />
        <WorkList title="Qolgan" items={analysis.remainingWorks} tone="warn" />
      </div>

      {/* Natijaga qanchalik ishonish mumkinligi — yashirilmaydi */}
      <dl className="text-faint mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-subtle pt-2.5 text-micro">
        <Meta label="Bosqich" value={analysis.stage} />
        <Meta label="Ishonch" value={formatPercent(analysis.confidence * 100, 0)} />
        <Meta label="Surat sifati" value={QUALITY_UZ[analysis.imageQuality]} />
        {analysis.imagesAnalyzed ? (
          <Meta label="Tahlil qilingan surat" value={String(analysis.imagesAnalyzed)} />
        ) : null}
        {report.aiModel ? <Meta label="Model" value={report.aiModel} /> : null}
      </dl>
    </section>
  );
}

const QUALITY_UZ = { good: 'yaxshi', partial: 'qisman', poor: 'sifatsiz' } as const;

function Figure({
  label,
  value,
  tone,
  muted,
}: {
  label: string;
  value: string;
  tone?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="t-label">{label}</p>
      <p className={cn('num mt-0.5 text-head', tone ?? (muted ? 'text-muted' : 'text-strong'))}>
        {value}
      </p>
    </div>
  );
}

/**
 * Taqqoslash shkalasi: model oralig‘i — zolg‘in maydon, hisobotdagi foiz —
 * ustidagi chiziq. Bitta o‘qda turgani uchun farq o‘lchab o‘tirmasdan
 * ko‘rinadi.
 */
function ComparisonBar({
  reported,
  low,
  high,
}: {
  reported: number;
  low: number;
  high: number;
}) {
  const clamp = (value: number) => Math.max(0, Math.min(100, value));
  const left = clamp(low);
  const width = Math.max(1.5, clamp(high) - left);

  return (
    <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-white/12">
      <span
        className="absolute inset-y-0 rounded-full bg-ok-500/35"
        style={{ left: `${left}%`, width: `${width}%` }}
        title={`Suratdan: ${low}–${high}%`}
      />
      <span
        className="absolute inset-y-0 w-0.5 bg-neutral-950 dark:bg-white"
        style={{ left: `${clamp(reported)}%` }}
        title={`Hisobotda: ${reported}%`}
      />
    </div>
  );
}

function WorkList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: 'ok' | 'warn';
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="t-label mb-1">{title}</p>
      <ul className="space-y-1">
        {items.slice(0, 6).map((item) => (
          <li key={item} className="t-meta flex items-start gap-1.5">
            <span
              className={cn(
                'mt-1.5 size-1.5 shrink-0 rounded-full',
                tone === 'ok' ? 'bg-ok-500' : 'bg-warn-500',
              )}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex gap-1">
      <dt>{label}:</dt>
      <dd className="text-muted">{value}</dd>
    </div>
  );
}
