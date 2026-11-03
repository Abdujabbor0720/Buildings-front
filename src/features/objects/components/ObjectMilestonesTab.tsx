import {
  CalendarDays,
  Camera,
  ClipboardList,
  HardHat,
  Lightbulb,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useAnalyzeMilestone,
  useAnalyzeObject,
  useDeleteMilestone,
  useMilestoneAi,
} from '@/shared/api/queries';
import type { AiAnalysis, ConstructionObject, Milestone } from '@/shared/api/types';
import { MILESTONE_LABELS, RISK_META } from '@/shared/constants/health';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  LoadingBlock,
  ProgressBar,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { diffInDays, formatDateUz, tashkentToday } from '@/shared/utils/date.utils';
import { formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { MilestoneFormModal } from './MilestoneFormModal';
import { MilestonePlanModal } from './MilestonePlanModal';
import { MilestoneSubmitModal } from './MilestoneSubmitModal';

const STATUS_CHIP: Record<Milestone['status'], string> = {
  planned: 'bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-400',
  in_progress: 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400',
  done: 'bg-ok-50 text-ok-700 dark:bg-ok-500/10 dark:text-ok-500',
  delayed: 'bg-warn-50 text-warn-700 dark:bg-warn-500/10 dark:text-warn-500',
  cancelled: 'bg-neutral-100 text-neutral-500 line-through dark:bg-white/5',
};

/**
 * ISH REJASI — bosqichlarni tuzish, tahrirlash va TOPSHIRISH.
 *
 * ⚠️ Obyektning umumiy bajarilishi SHU YERDAN kelib chiqadi: har
 * bosqichning ulushi (`weight`) va bajarilishi (`progressPercent`)
 * ko‘paytirilib yig‘iladi. Shuning uchun bosqichga tegilsa, obyekt
 * kartasidagi foiz ham o‘zgaradi — buni server hisoblaydi, interfeys
 * faqat ko‘rsatadi.
 *
 * ⚠️ Bosqich kengligi uning ULUSHIGA mutanosib, davomiyligiga emas.
 */
export function ObjectMilestonesTab({
  object,
  milestones,
  isLoading,
}: {
  object: ConstructionObject;
  milestones: Milestone[];
  isLoading: boolean;
}) {
  const can = useAuthStore((state) => state.can);
  const canEdit = can('objects.update');
  const canSubmit = can('photos.upload');

  const ai = useMilestoneAi(object.id);
  const analyzeAll = useAnalyzeObject(object.id);
  const analyzeOne = useAnalyzeMilestone(object.id);
  const remove = useDeleteMilestone(object.id);

  const [planOpen, setPlanOpen] = useState(false);
  const [formFor, setFormFor] = useState<Milestone | 'new' | null>(null);
  const [submitFor, setSubmitFor] = useState<Milestone | null>(null);

  const byMilestone = new Map<string, AiAnalysis>();
  for (const item of ai.data ?? []) {
    if (item.milestoneId) byMilestone.set(item.milestoneId, item);
  }

  if (isLoading) return <LoadingBlock />;

  const totalWeight = milestones.reduce((sum, m) => sum + m.weight, 0);
  const usedWeight = Number(totalWeight.toFixed(2));
  const submittedCount = milestones.filter((m) => m.reportCount > 0).length;
  const doneCount = milestones.filter((m) => m.status === 'done').length;
  const today = tashkentToday();

  /* ───── Reja yo‘q ───── */
  if (milestones.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            title="Ish rejasi kiritilmagan"
            description={
              canEdit
                ? 'Qurilishni bosqichlarga bo‘ling — poydevor, karkas, tom… Har bosqichning ulushi belgilangach, obyektning umumiy bajarilishi o‘sha ulushlardan avtomatik hisoblanadi va har bosqich alohida topshiriladi.'
                : 'Obyekt bosqichlari qo‘shilgach, bu yerda vaqt chizig‘i ko‘rinadi.'
            }
            icon={<ClipboardList className="size-5" />}
            action={
              canEdit ? (
                <Button onClick={() => setPlanOpen(true)} leftIcon={<Plus className="size-3.5" />}>
                  Ish rejasini tuzish
                </Button>
              ) : null
            }
          />
        </Card>
        <MilestonePlanModal
          open={planOpen}
          onClose={() => setPlanOpen(false)}
          object={object}
          existing={milestones}
        />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {/* ───── Ulushlar chizig‘i ───── */}
      <Card>
        <CardHeader
          title="Bosqichlar bo‘yicha ulush"
          subtitle={`Jami ulush: ${usedWeight}% · ${doneCount}/${milestones.length} bosqich yakunlangan · ${submittedCount} tasi topshirilgan`}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={analyzeAll.isPending}
                onClick={async () => {
                  try {
                    await analyzeAll.mutateAsync(true);
                    toast.success('Barcha bosqich qayta tahlil qilindi');
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                }}
                leftIcon={<Sparkles className="size-3.5" />}
              >
                AI tahlil
              </Button>
              {canEdit ? (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setFormFor('new')}
                    leftIcon={<Plus className="size-3.5" />}
                  >
                    Bosqich
                  </Button>
                  <Button size="sm" onClick={() => setPlanOpen(true)} leftIcon={<ClipboardList className="size-3.5" />}>
                    Rejani tahrirlash
                  </Button>
                </>
              ) : null}
            </div>
          }
        />
        <CardBody>
          <div className="flex h-7 w-full overflow-hidden rounded-lg">
            {milestones.map((milestone) => (
              <span
                key={milestone.id}
                title={`${milestone.name} — ulushi ${milestone.weight}% (bajarildi: ${milestone.progressPercent}%)`}
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

          {/* ⚠️ Yig‘indi 100 bo‘lmasa AYTILADI: u paytda obyekt foizi
              qolgan ulushlarga NORMALLASHTIRILIB hisoblanadi va raqam
              kutilganidan boshqacha chiqadi. */}
          {Math.abs(usedWeight - 100) > 0.01 ? (
            <p className="mt-2 text-meta text-warn-700 dark:text-warn-500">
              Ulushlar yig‘indisi {usedWeight}% — bajarilish shu yig‘indiga nisbatan
              hisoblanmoqda. Reja to‘liq bo‘lishi uchun yig‘indini 100% ga yetkazing.
            </p>
          ) : null}
        </CardBody>
      </Card>

      {/* ───── Bosqichlar ───── */}
      <div className="space-y-3">
        {milestones.map((milestone) => {
          const overdue =
            milestone.status !== 'done' &&
            milestone.status !== 'cancelled' &&
            (diffInDays(milestone.plannedEnd, today) ?? 0) > 0;
          const analysis = byMilestone.get(milestone.id);

          return (
            <Card key={milestone.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'size-2.5 shrink-0 rounded-full',
                        milestone.status === 'done'
                          ? 'bg-ok-500'
                          : milestone.status === 'in_progress'
                            ? 'bg-brand-500'
                            : overdue
                              ? 'bg-danger-500'
                              : 'bg-neutral-300 dark:bg-neutral-600',
                      )}
                    />
                    <p className="text-ui font-semibold text-strong">{milestone.name}</p>
                    <Badge className={STATUS_CHIP[milestone.status]}>
                      {MILESTONE_LABELS[milestone.status]}
                    </Badge>
                    <Badge className="bg-neutral-100 text-neutral-600 dark:bg-white/5 dark:text-neutral-400">
                      Ulush: {milestone.weight}%
                    </Badge>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDateUz(milestone.plannedStart)} — {formatDateUz(milestone.plannedEnd)}
                    </span>
                    {milestone.workerCount !== null ? (
                      <span className="inline-flex items-center gap-1.5">
                        <HardHat className="size-3.5" />
                        {milestone.workerCount} ishchi
                      </span>
                    ) : null}
                    <span className="inline-flex items-center gap-1.5">
                      <Camera className="size-3.5" />
                      {milestone.reportCount} hisobot
                    </span>
                    {milestone.actualEnd ? (
                      <span className="text-ok-600 dark:text-ok-500">
                        Yakunlandi: {formatDateUz(milestone.actualEnd)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* ───── Amallar ───── */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {canSubmit && milestone.status !== 'cancelled' ? (
                    <Button
                      size="sm"
                      variant={milestone.status === 'done' ? 'secondary' : 'primary'}
                      onClick={() => setSubmitFor(milestone)}
                      leftIcon={<Upload className="size-3.5" />}
                    >
                      Topshirish
                    </Button>
                  ) : null}
                  <IconAction
                    label={`«${milestone.name}» bosqichini qayta tahlil qilish`}
                    busy={analyzeOne.isPending}
                    onClick={async () => {
                      try {
                        await analyzeOne.mutateAsync(milestone.id);
                        toast.success('Bosqich tahlil qilindi');
                      } catch (error) {
                        toast.error(getErrorMessage(error));
                      }
                    }}
                  >
                    <Sparkles className="size-3.5" />
                  </IconAction>
                  {canEdit ? (
                    <>
                      <IconAction
                        label={`«${milestone.name}» bosqichini tahrirlash`}
                        onClick={() => setFormFor(milestone)}
                      >
                        <Pencil className="size-3.5" />
                      </IconAction>
                      <IconAction
                        label={`«${milestone.name}» bosqichini o‘chirish`}
                        danger
                        busy={remove.isPending}
                        onClick={async () => {
                          /* ⚠️ Tasdiq SO‘RALADI: o‘chirish rejani va u bilan
                             birga obyekt foizini o‘zgartiradi. */
                          if (!window.confirm(`«${milestone.name}» bosqichi o‘chirilsinmi?`)) return;
                          try {
                            await remove.mutateAsync(milestone.id);
                            toast.success('Bosqich o‘chirildi');
                          } catch (error) {
                            toast.error(getErrorMessage(error));
                          }
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </IconAction>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={milestone.progressPercent} size="xs" className="flex-1" />
                <span className="num w-14 shrink-0 text-right text-meta font-semibold text-strong">
                  {formatPercent(milestone.progressPercent)}
                </span>
              </div>

              {milestone.submissionNote ? (
                <p className="mt-2 text-meta text-muted">
                  <span className="font-medium text-strong">Oxirgi topshiruv:</span>{' '}
                  {milestone.submissionNote}
                  {milestone.submittedBy
                    ? ` — ${milestone.submittedBy.lastName} ${milestone.submittedBy.firstName}`
                    : ''}
                </p>
              ) : null}

              {analysis ? <MilestoneAnalysis analysis={analysis} /> : null}
            </Card>
          );
        })}
      </div>

      <MilestonePlanModal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        object={object}
        existing={milestones}
      />
      <MilestoneFormModal
        open={formFor !== null}
        onClose={() => setFormFor(null)}
        objectId={object.id}
        milestone={formFor === 'new' || formFor === null ? undefined : formFor}
        usedWeight={
          formFor === 'new' || formFor === null
            ? usedWeight
            : Number((usedWeight - formFor.weight).toFixed(2))
        }
      />
      <MilestoneSubmitModal
        open={submitFor !== null}
        onClose={() => setSubmitFor(null)}
        objectId={object.id}
        milestone={submitFor}
      />
    </div>
  );
}

/** Bosqich ostidagi AI xulosasi — yig‘ilgan holda, ochib o‘qiladi. */
function MilestoneAnalysis({ analysis }: { analysis: AiAnalysis }) {
  const risk = RISK_META[analysis.riskLevel];
  return (
    <details className="mt-3 rounded-lg surface-muted px-3 py-2">
      <summary className="flex cursor-pointer flex-wrap items-center gap-2 text-meta select-none">
        <Sparkles className="size-3.5 shrink-0 text-brand-500" />
        <span className="font-medium text-strong">AI tahlili</span>
        <Badge className={risk.chip}>Xavf: {risk.label}</Badge>
        <span className="truncate text-muted">{analysis.summary.slice(0, 80)}…</span>
      </summary>
      <p className="mt-2 text-meta leading-relaxed text-strong">{analysis.summary}</p>
      {analysis.recommendations?.length ? (
        <ul className="mt-2 space-y-1">
          {analysis.recommendations.map((item, index) => (
            <li key={index} className="flex gap-2 text-meta text-muted">
              <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-warn-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </details>
  );
}

function IconAction({
  children,
  label,
  onClick,
  danger,
  busy,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      title={label}
      aria-label={label}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-muted transition-colors disabled:opacity-50',
        danger
          ? 'hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-danger-500/10'
          : 'hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8',
      )}
    >
      {children}
    </button>
  );
}
