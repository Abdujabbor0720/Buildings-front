import { ArrowLeft, Building, Mail, MapPin, Pencil, Phone, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/client';
import { useContractor, useObjects } from '@/shared/api/queries';
import { CONTRACTOR_STATUS_META, HEALTH_META } from '@/shared/constants/health';
import {
  Badge, Button, Card, CardBody, CardHeader, ErrorState, LoadingBlock, ProgressBar,
  Table, TableEmpty, TableWrap, TBody, Td, Th, THead, Tr
} from '@/shared/ui';
import { formatDateUz } from '@/shared/utils/date.utils';
import { formatCompact, formatMoneyFull, formatPercent } from '@/shared/utils/money.utils';
import { useAuthStore } from '@/store/auth.store';
import { ContractorFormModal } from './components/ContractorFormModal';
import { RatingStars } from './ContractorsPage';

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contractor, isLoading, isError, error, refetch } = useContractor(id);
  const objects = useObjects({ contractorId: id, limit: 50, sortBy: 'plannedEndDate', sortOrder: 'ASC' });
  const can = useAuthStore((state) => state.can);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  if (isError || !contractor) {
    return <Card><ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} /></Card>;
  }

  const meta = CONTRACTOR_STATUS_META[contractor.status];
  const stats = contractor.stats;

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-meta text-muted transition-colors hover:text-strong"
        >
          <ArrowLeft className="size-3.5" />
          Orqaga
        </button>
        {can('contractors.manage') ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditOpen(true)}
            leftIcon={<Pencil className="size-3.5" />}
          >
            Tahrirlash
          </Button>
        ) : null}
      </div>

      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <Building className="size-6" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-head font-bold tracking-tight text-strong">{contractor.name}</h1>
                <Badge className={meta.chip} dot={meta.dot}>{meta.label}</Badge>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
                <span>STIR: <span className="mono text-strong">{contractor.inn}</span></span>
                {contractor.director ? <span>Rahbar: <span className="font-medium">{contractor.director}</span></span> : null}
                {contractor.foundedYear ? <span>Tashkil etilgan: <span className="num">{contractor.foundedYear}</span></span> : null}
                {contractor.employeesCount ? (
                  <span className="inline-flex items-center gap-1"><Users className="size-3.5" />{contractor.employeesCount} xodim</span>
                ) : null}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-meta text-muted">
                {contractor.phone ? (
                  <a href={`tel:${contractor.phone}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                    <Phone className="size-3.5" />{contractor.phone}
                  </a>
                ) : null}
                {contractor.email ? (
                  <a href={`mailto:${contractor.email}`} className="inline-flex items-center gap-1.5 hover:text-brand-600">
                    <Mail className="size-3.5" />{contractor.email}
                  </a>
                ) : null}
                {contractor.address ? (
                  <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{contractor.address}</span>
                ) : null}
                {contractor.licenseNumber ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    {contractor.licenseNumber}
                    {contractor.licenseExpiry ? ` (${formatDateUz(contractor.licenseExpiry)} gacha)` : ''}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-micro text-muted">Reyting</p>
            <div className="mt-1 flex justify-end"><RatingStars value={contractor.rating} size="md" /></div>
            <p className="mt-1 max-w-[220px] text-micro text-muted">
              Muddatida topshirish, o‘rtacha kechikish va xavfli obyektlardan hisoblanadi
            </p>
          </div>
        </div>
      </Card>

      {stats ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          <StatCard label="Jami obyektlar" value={String(stats.totalObjects)} />
          <StatCard label="Faol" value={String(stats.activeObjects)} />
          <StatCard label="Topshirilgan" value={String(stats.completedObjects)} tone="text-brand-600 dark:text-brand-400" />
          <StatCard label="Muddatida" value={String(stats.onTimeCompleted)} tone="text-ok-600 dark:text-ok-500" />
          <StatCard label="Kechikayotgan" value={String(stats.delayedObjects)} tone="text-warn-600 dark:text-warn-500" />
          <StatCard label="Xavfli" value={String(stats.atRiskObjects)} tone="text-danger-600 dark:text-danger-500" />
          <StatCard label="Shartnoma qiymati" value={formatCompact(stats.totalContractValue)} />
        </div>
      ) : null}

      <Card flush>
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <CardHeader
            title="Pudratchi obyektlari"
            subtitle={stats ? `O‘rtacha bajarilish: ${formatPercent(stats.avgProgress)} · O‘rtacha kechikish: ${stats.avgDelayDays} kun` : undefined}
          />
        </div>
        <CardBody className="px-4 pb-1 sm:px-5">
          <TableWrap>
            <Table>
              <THead>
                <Tr>
                  <Th>Obyekt nomi</Th>
                  <Th className="w-28">Tuman</Th>
                  <Th className="w-36">Reja muddati</Th>
                  <Th className="w-[130px]">Bajarilish</Th>
                  <Th className="w-36">Holati</Th>
                  <Th align="right" className="w-32">Qiymati</Th>
                </Tr>
              </THead>
              <TBody>
                {objects.isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Tr key={index}><Td colSpan={6}><div className="skeleton h-6 rounded" /></Td></Tr>
                  ))
                ) : objects.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>Bu pudratchiga obyekt biriktirilmagan</TableEmpty>
                ) : (
                  objects.data?.items.map((object) => {
                    const health = HEALTH_META[object.healthStatus];
                    return (
                      <Tr key={object.id}>
                        <Td className="max-w-[300px]">
                          <Link to={`/objects/${object.id}`} className="block truncate font-medium text-strong hover:text-brand-600">
                            {object.name}
                          </Link>
                        </Td>
                        <Td muted className="whitespace-nowrap">{object.district?.shortName ?? '—'}</Td>
                        <Td className="tabular whitespace-nowrap">{formatDateUz(object.plannedEndDate)}</Td>
                        <Td><ProgressBar value={object.progressPercent} showValue size="xs" tone={health.bar} /></Td>
                        <Td><Badge className={health.chip} dot={health.dot}>{health.label}</Badge></Td>
                        <Td align="right" className="num whitespace-nowrap">{formatMoneyFull(object.totalCost)}</Td>
                      </Tr>
                    );
                  })
                )}
              </TBody>
            </Table>
          </TableWrap>
        </CardBody>
      </Card>
      <ContractorFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        contractor={contractor}
      />
    </>
  );
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card px-3 py-2.5">
      <p className="truncate text-micro text-muted">{label}</p>
      <p className={`num mt-0.5 text-lede font-bold ${tone ?? 'text-strong'}`}>{value}</p>
    </div>
  );
}
