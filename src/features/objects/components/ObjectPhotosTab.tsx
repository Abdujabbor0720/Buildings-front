import { Camera } from 'lucide-react';
import { resolveFileUrl } from '@/shared/api/client';
import { usePhotoReports } from '@/shared/api/queries';
import { AI_VERDICT_META, PHOTO_STATUS_LABELS } from '@/shared/constants/health';
import { Badge, Card, CardBody, CardHeader, EmptyState, LoadingBlock } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';

export function ObjectPhotosTab({ objectId }: { objectId: string }) {
  const { data, isLoading } = usePhotoReports({ objectId, limit: 24 });

  if (isLoading) return <LoadingBlock />;
  const reports = data?.items ?? [];

  if (reports.length === 0) {
    return (
      <Card>
        <EmptyState title="Foto-hisobot yo‘q" description="Obyekt bo‘yicha surat yuborilmagan." icon={<Camera className="size-5" />} />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Foto-hisobotlar" subtitle={`${data?.meta.total ?? 0} ta hisobot`} />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => {
            const verdict = AI_VERDICT_META[report.aiVerdict];
            const cover = resolveFileUrl(report.images?.[0]?.url);
            return (
              <figure key={report.id} className="overflow-hidden rounded-xl border border-subtle">
                <div className="relative aspect-[4/3] surface-muted">
                  {cover ? (
                    <img src={cover} alt={report.note ?? 'Foto-hisobot'} loading="lazy" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-neutral-400"><Camera className="size-6" /></span>
                  )}
                  {/* Hisobotdagi foiz va model bahosi — birga, taqqoslash uchun. */}
                  <span className="absolute right-2 bottom-2 flex items-center gap-1">
                    <span className="num rounded-md bg-neutral-950/80 px-1.5 py-0.5 text-micro text-white">
                      {Math.round(report.progressPercent)}%
                    </span>
                    {report.aiAnalysis && report.aiVisionStatus === 'done' ? (
                      <span
                        title={`Suratdan baholangan: ${report.aiAnalysis.rangeMin}–${report.aiAnalysis.rangeMax}%`}
                        className={cn(
                          'num rounded-md px-1.5 py-0.5 text-micro text-white',
                          report.aiAnalysis.matchesReported ? 'bg-ok-600/90' : 'bg-danger-600/90',
                        )}
                      >
                        AI {Math.round(report.aiAnalysis.estimatedProgressPercent)}%
                      </span>
                    ) : null}
                  </span>
                </div>
                <figcaption className="space-y-1.5 p-2.5">
                  <p className="tabular text-micro text-muted">{formatDateTimeUz(report.capturedAt)}</p>
                  {report.note ? <p className="line-clamp-2 text-meta text-strong">{report.note}</p> : null}
                  <div className="flex flex-wrap gap-1">
                    <Badge className={verdict.chip}>{verdict.label}</Badge>
                    <Badge className="surface-muted text-muted">{PHOTO_STATUS_LABELS[report.status]}</Badge>
                  </div>
                  {report.aiComment ? (
                    <p className="text-micro leading-snug text-muted">{report.aiComment}</p>
                  ) : null}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
