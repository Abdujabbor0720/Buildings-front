import { Camera, Check, ImagePlus, Sparkles, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { getErrorMessage, resolveFileUrl } from '@/shared/api/client';
import { useDistricts, usePhotoReports, usePhotoStats, useReviewPhoto } from '@/shared/api/queries';
import type { PhotoReport } from '@/shared/api/types';
import { AI_VERDICT_META, PHOTO_STATUS_LABELS } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import {
  Badge, Button, Card, EmptyState, LoadingBlock, Modal, PageHeader, Pagination,
  SearchInput, Select, StatPills, Textarea,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { formatCount, formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { useFiltersStore } from '@/store/filters.store';
import { AiVisionPanel } from './components/AiVisionPanel';
import { NewPhotoReportModal } from './components/NewPhotoReportModal';

export default function PhotosPage() {
  const { regionId } = useFiltersStore();
  const can = useAuthStore((state) => state.can);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [verdict, setVerdict] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [preview, setPreview] = useState<PhotoReport | null>(null);
  const [creating, setCreating] = useState(false);
  const [rejecting, setRejecting] = useState<PhotoReport | null>(null);

  const { data: districts } = useDistricts(regionId ?? undefined);
  const stats = usePhotoStats(regionId ?? undefined);
  const review = useReviewPhoto();

  const params = useMemo(
    () => ({
      page,
      limit: 24,
      ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
      ...(status ? { status } : {}),
      ...(verdict ? { aiVerdict: verdict } : {}),
      ...(districtId ? { districtId } : {}),
    }),
    [page, debouncedSearch, status, verdict, districtId],
  );

  const { data, isLoading } = usePhotoReports(params);
  const reports = data?.items ?? [];

  async function approve(report: PhotoReport) {
    try {
      await review.mutateAsync({ id: report.id, status: 'approved' });
      toast.success('Hisobot tasdiqlandi');
      setPreview(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <>
      <PageHeader
        title="Fotoarxiv"
        description="Obyektlardan kelgan foto-hisobotlar va ularning tekshiruv natijalari"
        actions={
          can('photos.upload') ? (
            <Button onClick={() => setCreating(true)} leftIcon={<ImagePlus className="size-4" />}>
              Yangi hisobot
            </Button>
          ) : null
        }
        stats={
          stats.data ? (
            <StatPills
              items={[
                { label: 'Jami', value: formatCount(stats.data.total) },
                { label: 'Ko‘rib chiqilmoqda', value: formatCount(stats.data.pending), tone: 'text-warn-600 dark:text-warn-500' },
                { label: 'Tasdiqlangan', value: formatCount(stats.data.approved), tone: 'text-ok-600 dark:text-ok-500' },
                { label: 'AI shubhali', value: formatCount(stats.data.aiSuspicious), tone: 'text-danger-600 dark:text-danger-500' },
              ]}
            />
          ) : null
        }
      />

      <Card flush>
        <div className="flex flex-wrap items-center gap-2 border-b border-subtle p-3 sm:p-4">
          <SearchInput
            value={search}
            onValueChange={(value) => { setSearch(value); setPage(1); }}
            placeholder="Obyekt nomi yoki izoh…"
            className="min-w-[200px] flex-1"
          />
          <Select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            placeholder="Barcha holatlar"
            options={[
              { value: 'pending', label: 'Ko‘rib chiqilmoqda' },
              { value: 'approved', label: 'Tasdiqlangan' },
              { value: 'rejected', label: 'Rad etilgan' },
            ]}
            className="w-auto min-w-[160px]"
          />
          <Select
            value={verdict}
            onChange={(e) => { setVerdict(e.target.value); setPage(1); }}
            placeholder="Barcha AI xulosalari"
            options={[
              { value: 'confirmed', label: 'AI tasdiqladi' },
              { value: 'suspicious', label: 'AI shubhali' },
              { value: 'rejected', label: 'AI rad etdi' },
            ]}
            className="w-auto min-w-[170px]"
          />
          <Select
            value={districtId}
            onChange={(e) => { setDistrictId(e.target.value); setPage(1); }}
            placeholder="Barcha tumanlar"
            options={(districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
            className="w-auto min-w-[150px]"
          />
        </div>

        <div className="p-3 sm:p-4">
          {isLoading ? (
            <LoadingBlock />
          ) : reports.length === 0 ? (
            <EmptyState title="Foto-hisobot topilmadi" icon={<Camera className="size-5" />} />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {reports.map((report) => {
                  const meta = AI_VERDICT_META[report.aiVerdict];
                  const cover = resolveFileUrl(report.images?.[0]?.url);
                  return (
                    <article key={report.id} className="overflow-hidden rounded-xl border border-subtle surface">
                      <button
                        type="button"
                        onClick={() => setPreview(report)}
                        className="relative block aspect-[4/3] w-full surface-muted"
                      >
                        {cover ? (
                          <img src={cover} alt={report.object?.name ?? ''} loading="lazy" className="size-full object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-neutral-400"><Camera className="size-6" /></span>
                        )}
                        {/* Hisobotdagi foiz va — tahlil bo‘lsa — model bahosi.
                            ⚠️ Ikkalasi BIRGA ko‘rsatiladi: moderator ro‘yxatni
                            ko‘zdan kechirayotganda nomuvofiqlikni kartani
                            ochmasdan sezishi kerak. */}
                        <span className="absolute right-2 bottom-2 flex items-center gap-1">
                          <span className="num rounded-md bg-neutral-950/80 px-1.5 py-0.5 text-micro text-white">
                            {Math.round(report.progressPercent)}%
                          </span>
                          {report.aiAnalysis && report.aiVisionStatus === 'done' ? (
                            <span
                              title={`Suratdan baholangan: ${report.aiAnalysis.rangeMin}–${report.aiAnalysis.rangeMax}%`}
                              className={cn(
                                'num rounded-md px-1.5 py-0.5 text-micro text-white',
                                report.aiAnalysis.matchesReported
                                  ? 'bg-ok-600/90'
                                  : 'bg-danger-600/90',
                              )}
                            >
                              AI {Math.round(report.aiAnalysis.estimatedProgressPercent)}%
                            </span>
                          ) : null}
                        </span>
                        {report.images && report.images.length > 1 ? (
                          <span className="absolute top-2 right-2 rounded-md bg-neutral-900/70 px-1.5 py-0.5 text-nano text-white">
                            +{report.images.length - 1}
                          </span>
                        ) : null}
                      </button>

                      <div className="space-y-1.5 p-3">
                        <Link to={`/objects/${report.objectId}`} className="block truncate text-meta font-medium text-strong hover:text-brand-600">
                          {report.object?.name ?? '—'}
                        </Link>
                        <p className="tabular text-micro text-muted">{formatDateTimeUz(report.capturedAt)}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge className={meta.chip}><Sparkles className="size-2.5" />{meta.label}</Badge>
                          <Badge className="surface-muted text-muted">{PHOTO_STATUS_LABELS[report.status]}</Badge>
                        </div>

                        {report.status === 'pending' && can('photos.moderate') ? (
                          <div className="flex gap-1.5 pt-1">
                            <Button size="sm" className="flex-1 justify-center" onClick={() => approve(report)} leftIcon={<Check className="size-3.5" />}>
                              Tasdiqlash
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setRejecting(report)} aria-label="Rad etish">
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>

              <Pagination meta={data?.meta} onPageChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <PreviewModal report={preview} onClose={() => setPreview(null)} onApprove={approve} canModerate={can('photos.moderate')} />
      <RejectModal report={rejecting} onClose={() => setRejecting(null)} />
      <NewPhotoReportModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

function PreviewModal({
  report, onClose, onApprove, canModerate,
}: {
  report: PhotoReport | null;
  onClose: () => void;
  onApprove: (report: PhotoReport) => void;
  canModerate: boolean;
}) {
  const meta = report ? AI_VERDICT_META[report.aiVerdict] : null;

  return (
    <Modal
      open={Boolean(report)}
      onClose={onClose}
      size="xl"
      title={report?.object?.name ?? 'Foto-hisobot'}
      description={report ? formatDateTimeUz(report.capturedAt) : undefined}
      footer={
        report && report.status === 'pending' && canModerate ? (
          <>
            <Button variant="ghost" onClick={onClose}>Yopish</Button>
            <Button onClick={() => onApprove(report)} leftIcon={<Check className="size-4" />}>Tasdiqlash</Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>Yopish</Button>
        )
      }
    >
      {report ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(report.images ?? []).map((image) => {
              const src = resolveFileUrl(image.url);
              return src ? (
                <img key={image.id} src={src} alt={image.caption ?? ''} className="w-full rounded-lg border border-subtle" />
              ) : null;
            })}
          </div>

          {report.note ? <p className="text-ui text-strong">{report.note}</p> : null}

          <dl className="grid grid-cols-2 gap-3 rounded-lg surface-muted p-3 text-meta sm:grid-cols-4">
            <div>
              <dt className="text-muted">Bajarilish</dt>
              <dd className="num font-semibold">{formatPercent(report.progressPercent)}</dd>
            </div>
            <div>
              <dt className="text-muted">AI xulosasi</dt>
              <dd className={cn('font-semibold', meta ? '' : '')}>{meta?.label}</dd>
            </div>
            <div>
              <dt className="text-muted">Ishonch darajasi</dt>
              <dd className="num font-semibold">
                {report.aiConfidence === null ? '—' : formatPercent(report.aiConfidence * 100, 0)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Yuborgan</dt>
              <dd className="font-semibold">
                {report.author ? `${report.author.lastName} ${report.author.firstName}` : '—'}
              </dd>
            </div>
          </dl>

          {/* ⚠️ Suratdan baholash ALOHIDA panelda: u qoidalar dvigateli
              izohidan boshqa narsani aytadi (surat ichidagi holat), va
              ikkalasi bitta xatboshida aralashsa, foydalanuvchi qaysi
              e’tiroz nimaga tegishli ekanini ajrata olmasdi. */}
          <AiVisionPanel report={report} canModerate={canModerate} />

          {report.aiComment ? (
            <p className="rounded-lg bg-warn-50 p-3 text-meta text-warn-800 dark:bg-warn-500/10 dark:text-warn-400">
              <Sparkles className="mr-1.5 inline size-3.5" />
              {report.aiComment}
            </p>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}

function RejectModal({ report, onClose }: { report: PhotoReport | null; onClose: () => void }) {
  const review = useReviewPhoto();
  const [reason, setReason] = useState('');

  async function onSubmit() {
    if (!report) return;
    try {
      await review.mutateAsync({ id: report.id, status: 'rejected', reason: reason.trim() });
      toast.success('Hisobot rad etildi');
      setReason('');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={Boolean(report)}
      onClose={onClose}
      title="Hisobotni rad etish"
      description={report?.object?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button variant="danger" onClick={onSubmit} loading={review.isPending} disabled={reason.trim().length < 5}>
            Rad etish
          </Button>
        </>
      }
    >
      <Textarea
        label="Rad etish sababi"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        required
        hint="Sabab majburiy — mas’ul nima xato bo‘lganini bilishi kerak"
      />
    </Modal>
  );
}
