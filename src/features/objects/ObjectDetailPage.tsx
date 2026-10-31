import { ArrowLeft, Building2, CalendarDays, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/client';
import {
  useObject, useObjectAi, useObjectFunding, useObjectMilestones, useObjectProgress,
} from '@/shared/api/queries';
import { HEALTH_META, RISK_META, STATUS_META } from '@/shared/constants/health';
import { Badge, Card, ErrorState, LoadingBlock, ProgressBar, Tabs, type TabOption } from '@/shared/ui';
import { formatDateUz, formatRelativeUz } from '@/shared/utils/date.utils';
import { formatMoneyFull, formatPercent } from '@/shared/utils/money.utils';
import { ObjectOverviewTab } from './components/ObjectOverviewTab';
import { ObjectProgressTab } from './components/ObjectProgressTab';
import { ObjectMilestonesTab } from './components/ObjectMilestonesTab';
import { ObjectFundingTab } from './components/ObjectFundingTab';
import { ObjectAiTab } from './components/ObjectAiTab';
import { ObjectPhotosTab } from './components/ObjectPhotosTab';
import { ObjectDocumentsTab } from './components/ObjectDocumentsTab';
import { ObjectDelaysTab } from './components/ObjectDelaysTab';

type Tab = 'overview' | 'progress' | 'milestones' | 'photos' | 'documents' | 'funding' | 'delays' | 'ai';

const TABS: ReadonlyArray<TabOption<Tab>> = [
  { value: 'overview', label: 'Umumiy' },
  { value: 'progress', label: 'Bajarilish' },
  { value: 'milestones', label: 'Ish rejasi' },
  { value: 'photos', label: 'Foto-hisobotlar' },
  { value: 'documents', label: 'Hujjatlar' },
  { value: 'funding', label: 'Moliyalashtirish' },
  { value: 'delays', label: 'Kechikishlar' },
  { value: 'ai', label: 'AI tahlil' },
];

export default function ObjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: object, isLoading, isError, error, refetch } = useObject(id);
  const progress = useObjectProgress(tab === 'progress' || tab === 'overview' ? id : undefined);
  const milestones = useObjectMilestones(tab === 'milestones' ? id : undefined);
  const funding = useObjectFunding(tab === 'funding' ? id : undefined);
  const ai = useObjectAi(tab === 'ai' || tab === 'overview' ? id : undefined);

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (isError || !object) {
    return (
      <Card>
        <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />
      </Card>
    );
  }

  const health = HEALTH_META[object.healthStatus];
  const status = STATUS_META[object.status];
  const risk = RISK_META[object.riskLevel];

  return (
    <>
      {/* ───── Sarlavha ───── */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-meta text-muted transition-colors hover:text-strong"
        >
          <ArrowLeft className="size-3.5" />
          Orqaga
        </button>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono surface-inset rounded-md px-2 py-0.5 text-micro text-muted">
                  {object.code}
                </span>
                <Badge className={health.chip} dot={health.dot}>{health.label}</Badge>
                {/* ⚠️ Holat (`status`) belgisi faqat HOLAT (`health`) dan
                    FARQ QILSA ko‘rsatiladi: «Topshirilgan / Topshirilgan»
                    kabi ikki bir xil belgi yonma-yon turib, foydalanuvchini
                    «nega ikkita?» degan savolga qo‘yardi. */}
                {status.label !== health.label ? (
                  <Badge className={status.chip}>{status.label}</Badge>
                ) : null}
                {object.delayDays > 0 ? (
                  <Badge className="bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-500/20 dark:bg-danger-500/12 dark:text-danger-300">
                    {object.delayDays} kun ortda
                  </Badge>
                ) : null}
                <Badge className={risk.chip}>Risk: {risk.label}</Badge>
              </div>

              <h1 className="t-page mt-2.5 text-[clamp(21px,1.7vw,26px)]">
                {object.name}
              </h1>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {object.district?.name ?? '—'}
                  {object.address ? ` · ${object.address}` : ''}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-3.5" />
                  {object.type?.name ?? '—'}
                </span>
                {object.contractor ? (
                  <Link to={`/contractors/${object.contractor.id}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600">
                    <Users className="size-3.5" />
                    {object.contractor.name}
                  </Link>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  {formatDateUz(object.plannedStartDate)} — {formatDateUz(object.plannedEndDate)}
                </span>
              </div>
            </div>

            {/* ───── O‘ng: bajarilish ───── */}
            <div className="w-full shrink-0 sm:w-64">
              <div className="flex items-end justify-between">
                <span className="text-meta text-muted">Bajarilish</span>
                <span className="num text-sub leading-none font-bold text-strong">
                  {formatPercent(object.progressPercent)}
                </span>
              </div>
              <ProgressBar
                value={object.progressPercent}
                target={object.expectedProgress}
                tone={health.bar}
                size="md"
                className="mt-2"
              />
              <p className="mt-1.5 text-micro text-muted">
                Reja bo‘yicha: <span className="num">{formatPercent(object.expectedProgress)}</span>
                {object.progressGap > 0 ? (
                  <span className="ml-1 text-danger-600 dark:text-danger-500">
                    ({formatPercent(object.progressGap)} ortda)
                  </span>
                ) : null}
              </p>
              <p className="mt-0.5 text-micro text-muted">
                Loyiha qiymati: <span className="num font-medium text-strong">{formatMoneyFull(object.totalCost)}</span>
              </p>
              {object.lastReportAt ? (
                <p className="mt-0.5 text-micro text-muted">
                  Oxirgi hisobot: {formatRelativeUz(object.lastReportAt)}
                </p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      {/* ───── Tablar ───── */}
      <div className="mb-4 overflow-x-auto">
        <Tabs options={TABS} value={tab} onChange={setTab} size="md" />
      </div>

      {tab === 'overview' ? (
        <ObjectOverviewTab object={object} progress={progress.data ?? []} ai={ai.data ?? []} />
      ) : null}
      {tab === 'progress' ? (
        <ObjectProgressTab object={object} history={progress.data ?? []} isLoading={progress.isLoading} />
      ) : null}
      {tab === 'milestones' ? (
        <ObjectMilestonesTab milestones={milestones.data ?? []} isLoading={milestones.isLoading} />
      ) : null}
      {tab === 'photos' ? <ObjectPhotosTab objectId={object.id} /> : null}
      {tab === 'documents' ? <ObjectDocumentsTab objectId={object.id} /> : null}
      {tab === 'funding' ? (
        <ObjectFundingTab object={object} data={funding.data} isLoading={funding.isLoading} />
      ) : null}
      {tab === 'delays' ? <ObjectDelaysTab objectId={object.id} /> : null}
      {tab === 'ai' ? <ObjectAiTab analyses={ai.data ?? []} isLoading={ai.isLoading} /> : null}
    </>
  );
}
