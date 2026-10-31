import type { Milestone } from '@/shared/api/types';
import { MILESTONE_LABELS } from '@/shared/constants/health';
import { Badge, Card, CardBody, CardHeader, EmptyState, LoadingBlock, ProgressBar } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { diffInDays, formatDateUz, tashkentToday } from '@/shared/utils/date.utils';

const STATUS_CHIP: Record<Milestone['status'], string> = {
  planned: 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-400',
  in_progress: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
  done: 'bg-ok-50 text-ok-700 dark:bg-ok-500/10 dark:text-ok-500',
  delayed: 'bg-warn-50 text-warn-700 dark:bg-warn-500/10 dark:text-warn-500',
  cancelled: 'bg-neutral-100 text-neutral-500 line-through dark:bg-white/5',
};

/**
 * Obyekt ish rejasi — gorizontal vaqt chizig‘i (soddalashtirilgan Gantt).
 * ⚠️ Har bosqich kengligi uning ULUSHIGA mutanosib, davomiyligiga emas:
 * ulushlar yig‘indisi 100% va aynan shu bajarilish foizini hosil qiladi.
 */
export function ObjectMilestonesTab({ milestones, isLoading }: { milestones: Milestone[]; isLoading: boolean }) {
  if (isLoading) return <LoadingBlock />;

  if (milestones.length === 0) {
    return (
      <Card>
        <EmptyState
          title="Ish rejasi kiritilmagan"
          description="Obyekt bosqichlari qo‘shilgach, bu yerda vaqt chizig‘i ko‘rinadi."
        />
      </Card>
    );
  }

  const today = tashkentToday();
  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Bosqichlar bo‘yicha ulush"
          subtitle={`Jami ulush: ${totalWeight.toFixed(0)}%`}
        />
        <CardBody>
          <div className="flex h-7 w-full overflow-hidden rounded-lg">
            {milestones.map((milestone) => (
              <span
                key={milestone.id}
                title={`${milestone.name} — ${milestone.weight}% (bajarildi: ${milestone.progressPercent}%)`}
                style={{ width: `${(milestone.weight / Math.max(1, totalWeight)) * 100}%` }}
                className="relative border-r border-white/60 last:border-0 dark:border-neutral-900/60"
              >
                <span className="absolute inset-0 bg-neutral-200 dark:bg-white/10" />
                <span
                  className="absolute inset-y-0 left-0 bg-brand-500 transition-[width] duration-500"
                  style={{ width: `${milestone.progressPercent}%` }}
                />
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card flush>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader title="Ish rejasi" subtitle={`${milestones.length} ta bosqich`} />
        </div>
        <CardBody className="space-y-0 px-4 pb-4 sm:px-5 sm:pb-5">
          <ol className="relative border-l border-subtle pl-5">
            {milestones.map((milestone) => {
              const overdue = milestone.status !== 'done' && (diffInDays(milestone.plannedEnd, today) ?? 0) > 0;
              return (
                <li key={milestone.id} className="relative pb-5 last:pb-0">
                  <span
                    className={cn(
                      'absolute top-1 -left-[26px] size-3 rounded-full ring-4 ring-[var(--surface)]',
                      milestone.status === 'done' ? 'bg-ok-500'
                        : milestone.status === 'in_progress' ? 'bg-brand-500'
                        : overdue ? 'bg-danger-500'
                        : 'bg-neutral-300 dark:bg-neutral-600',
                    )}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-ui font-medium text-strong">{milestone.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-micro text-muted">Ulush: {milestone.weight}%</span>
                      <Badge className={STATUS_CHIP[milestone.status]}>{MILESTONE_LABELS[milestone.status]}</Badge>
                    </div>
                  </div>
                  <p className="num mt-0.5 text-meta text-muted">
                    {formatDateUz(milestone.plannedStart)} — {formatDateUz(milestone.plannedEnd)}
                    {milestone.actualEnd ? ` · yakunlandi: ${formatDateUz(milestone.actualEnd)}` : ''}
                  </p>
                  <ProgressBar value={milestone.progressPercent} showValue size="xs" className="mt-2 max-w-sm" />
                </li>
              );
            })}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
