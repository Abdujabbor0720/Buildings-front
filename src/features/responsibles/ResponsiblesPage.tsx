import { Mail, Phone, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useResponsibles } from '@/shared/api/queries';
import { ROLE_LABELS } from '@/shared/constants/health';
import { Avatar, Card, EmptyState, LoadingBlock, PageHeader, ProgressBar, StatPills } from '@/shared/ui';
import { formatCount } from '@/shared/utils/money.utils';
import { useFiltersStore } from '@/store/filters.store';

/** «Mas’ullar» — har kurator va uning obyektlari kesimi. */
export default function ResponsiblesPage() {
  const { regionId } = useFiltersStore();
  const { data, isLoading } = useResponsibles(regionId ?? undefined);

  if (isLoading) return <LoadingBlock className="min-h-[50vh]" />;
  const items = data ?? [];

  const totals = items.reduce(
    (acc, item) => ({
      objects: acc.objects + item.objectCount,
      delayed: acc.delayed + item.delayedCount,
      atRisk: acc.atRisk + item.atRiskCount,
    }),
    { objects: 0, delayed: 0, atRisk: 0 },
  );

  return (
    <>
      <PageHeader
        title="Mas’ullar"
        description="Obyektlarga biriktirilgan kuratorlar va ularning natijalari"
        stats={
          <StatPills
            items={[
              { label: 'Mas’ullar', value: formatCount(items.length) },
              { label: 'Obyektlar', value: formatCount(totals.objects) },
              { label: 'Kechikayotgan', value: formatCount(totals.delayed), tone: 'text-warn-600 dark:text-warn-500' },
              { label: 'Xavfli', value: formatCount(totals.atRisk), tone: 'text-danger-600 dark:text-danger-500' },
            ]}
          />
        }
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState title="Mas’ul biriktirilmagan" icon={<UserCog className="size-5" />} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(({ user, objectCount, delayedCount, atRiskCount, avgProgress }) => {
            const fullName = `${user.lastName} ${user.firstName}`;
            return (
              <Card key={user.id}>
                <div className="flex items-start gap-3">
                  <Avatar name={fullName} src={user.avatarUrl} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-semibold text-strong">{fullName}</p>
                    <p className="truncate text-meta text-muted">{user.position ?? ROLE_LABELS[user.role]}</p>
                    {user.district ? (
                      <p className="mt-0.5 truncate text-micro text-muted">{user.district.name}</p>
                    ) : null}
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Metric label="Obyektlar" value={objectCount} />
                  <Metric label="Kechikayotgan" value={delayedCount} tone="text-warn-600 dark:text-warn-500" />
                  <Metric label="Xavfli" value={atRiskCount} tone="text-danger-600 dark:text-danger-500" />
                </dl>

                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-micro text-muted">
                    <span>O‘rtacha bajarilish</span>
                  </div>
                  <ProgressBar value={avgProgress} showValue size="xs" />
                </div>

                <div className="mt-3 flex flex-wrap gap-3 border-t border-subtle pt-3 text-meta text-muted">
                  <a href={`mailto:${user.email}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600">
                    <Mail className="size-3.5" />
                    <span className="truncate">{user.email}</span>
                  </a>
                  {user.phone ? (
                    <a href={`tel:${user.phone}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600">
                      <Phone className="size-3.5" />
                      {user.phone}
                    </a>
                  ) : null}
                </div>

                <Link
                  to={`/objects?responsibleId=${user.id}`}
                  className="mt-3 block rounded-lg surface-muted py-1.5 text-center text-meta font-medium text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
                >
                  Obyektlarini ko‘rish
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg surface-muted py-2">
      <dt className="text-micro text-muted">{label}</dt>
      <dd className={`num text-lede font-bold ${tone ?? 'text-strong'}`}>{value}</dd>
    </div>
  );
}
