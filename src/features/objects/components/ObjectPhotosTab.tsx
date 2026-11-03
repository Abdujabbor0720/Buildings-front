import { Camera, Plus } from 'lucide-react';
import { useState } from 'react';
import { resolveFileUrl } from '@/shared/api/client';
import { usePhotoReports } from '@/shared/api/queries';
import type { ConstructionObject } from '@/shared/api/types';
import { AI_VERDICT_META, PHOTO_STATUS_LABELS } from '@/shared/constants/health';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, LoadingBlock } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { useAuthStore } from '@/store/auth.store';
import { NewPhotoReportModal } from '@/features/photos/components/NewPhotoReportModal';

export function ObjectPhotosTab({ object }: { object: ConstructionObject }) {
  const { data, isLoading } = usePhotoReports({ objectId: object.id, limit: 24 });
  const can = useAuthStore((state) => state.can);
  const [addOpen, setAddOpen] = useState(false);

  const addButton = can('photos.upload') ? (
    <Button size="sm" onClick={() => setAddOpen(true)} leftIcon={<Plus className="size-3.5" />}>
      Surat yuborish
    </Button>
  ) : null;

  const modal = (
    <NewPhotoReportModal
      open={addOpen}
      onClose={() => setAddOpen(false)}
      lockedObject={{ id: object.id, code: object.code, name: object.name }}
    />
  );

  if (isLoading) return <LoadingBlock />;
  const reports = data?.items ?? [];

  if (reports.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            title="Foto-hisobot yo‘q"
            description="Obyekt bo‘yicha surat yuborilmagan. Bosqichni topshirgandagi suratlar ham shu yerda to‘planadi."
            icon={<Camera className="size-5" />}
            action={addButton}
          />
        </Card>
        {modal}
      </>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Foto-hisobotlar"
        subtitle={`${data?.meta.total ?? 0} ta hisobot`}
        action={addButton}
      />
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

      {modal}
    </Card>
  );
}
