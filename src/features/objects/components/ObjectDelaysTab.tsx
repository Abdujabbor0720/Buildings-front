import { CheckCircle2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useDelays, useResolveDelay } from '@/shared/api/queries';
import type { ObjectDelay } from '@/shared/api/types';
import { DELAY_STATUS_META, RISK_META } from '@/shared/constants/health';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, LoadingBlock, Modal, Textarea } from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { useAuthStore } from '@/store/auth.store';

export function ObjectDelaysTab({ objectId }: { objectId: string }) {
  const { data, isLoading } = useDelays({ objectId, limit: 50 });
  const [resolving, setResolving] = useState<ObjectDelay | null>(null);
  const can = useAuthStore((state) => state.can);

  if (isLoading) return <LoadingBlock />;
  const delays = data?.items ?? [];

  if (delays.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Kechikish qayd etilmagan"
          description="Obyekt bo‘yicha ochiq muammolar yo‘q."
          icon={<CheckCircle2 className="size-5 text-ok-500" />}
        />
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {delays.map((delay) => {
          const status = DELAY_STATUS_META[delay.status];
          const severity = RISK_META[delay.severity];
          return (
            <Card key={delay.id}>
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-[3px]" style={{ backgroundColor: delay.reason?.color }} />
                    {delay.reason?.name ?? 'Noma’lum sabab'}
                  </span>
                }
                subtitle={`Aniqlangan: ${formatDateUz(delay.detectedAt)}${delay.resolvedAt ? ` · Hal qilingan: ${formatDateUz(delay.resolvedAt)}` : ''}`}
                action={
                  <div className="flex items-center gap-2">
                    <Badge className="bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400">
                      {delay.delayDays} kun
                    </Badge>
                    <Badge className={severity.chip}>{severity.label}</Badge>
                    <Badge className={status.chip} dot={status.dot}>{status.label}</Badge>
                  </div>
                }
              />
              <CardBody className="space-y-2">
                <p className="text-ui leading-relaxed text-strong">{delay.description}</p>
                {delay.mitigationPlan ? (
                  <div className="rounded-lg surface-muted p-3">
                    <p className="text-micro font-medium text-muted">Bartaraf etish rejasi</p>
                    <p className="mt-1 text-meta whitespace-pre-line text-strong">{delay.mitigationPlan}</p>
                  </div>
                ) : null}
                {delay.status !== 'resolved' && can('delays.manage') ? (
                  <Button size="sm" variant="secondary" onClick={() => setResolving(delay)} leftIcon={<CheckCircle2 className="size-3.5" />}>
                    Hal qilindi deb belgilash
                  </Button>
                ) : null}
              </CardBody>
            </Card>
          );
        })}
      </div>

      <ResolveModal delay={resolving} onClose={() => setResolving(null)} />
    </>
  );
}

function ResolveModal({ delay, onClose }: { delay: ObjectDelay | null; onClose: () => void }) {
  const mutation = useResolveDelay();
  const [resolution, setResolution] = useState('');

  async function onSubmit() {
    if (!delay) return;
    try {
      await mutation.mutateAsync({ id: delay.id, resolution: resolution.trim() });
      toast.success('Muammo hal qilindi deb belgilandi');
      setResolution('');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <Modal
      open={Boolean(delay)}
      onClose={onClose}
      title="Muammoni yopish"
      description={delay?.reason?.name}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Bekor qilish</Button>
          <Button onClick={onSubmit} loading={mutation.isPending} disabled={resolution.trim().length < 5}>
            Hal qilindi
          </Button>
        </>
      }
    >
      <Textarea
        label="Qanday hal qilindi?"
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder="Masalan: materiallar yetkazildi, ish qayta boshlandi"
        required
        hint="Izoh majburiy — muammo qanday yopilgani tarixda qolishi kerak"
      />
      {delay && delay.delayDays > 0 ? (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-warn-50 p-2.5 text-meta text-warn-700 dark:bg-warn-500/10 dark:text-warn-500">
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
          Yopilgandan keyin obyekt holati qayta hisoblanadi.
        </p>
      ) : null}
    </Modal>
  );
}
