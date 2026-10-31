import { RefreshCw } from 'lucide-react';
import { useDashboard, useDistrictGeoJson } from '@/shared/api/queries';
import { getErrorMessage } from '@/shared/api/client';
import { Button, Card, CardBody, CardHeader, ErrorState, Skeleton } from '@/shared/ui';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { useFilterParams } from '@/store/filters.store';
import { DeadlineDonut } from './components/DeadlineDonut';
import { DelayReasons } from './components/DelayReasons';
import { DistrictMap } from './components/DistrictMap';
import { DistrictTable } from './components/DistrictTable';
import { KpiCards, KpiCardsSkeleton } from './components/KpiCards';
import { RecentPhotos } from './components/RecentPhotos';
import { TopDelayed } from './components/TopDelayed';
import { TypeBreakdown } from './components/TypeBreakdown';
import { UpcomingTable } from './components/UpcomingTable';

/**
 * BOSH SAHIFA.
 *
 * ⚠️ Butun sahifa BITTA so‘rov bilan to‘ladi (`GET /dashboard`). Har blok
 * uchun alohida endpoint chaqirilsa, sakkizta yumaloq safar bo‘lardi va
 * bloklar bir-biridan keyin «sakrab» chiqardi. Xarita chegaralari esa
 * alohida: ular og‘ir, lekin filtrdan deyarli mustaqil va keshlanadi.
 */
export default function DashboardPage() {
  const params = useFilterParams();
  const dashboard = useDashboard(params);
  const geojson = useDistrictGeoJson({
    regionId: params.regionId,
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
  });

  if (dashboard.isError) {
    return (
      <Card>
        <ErrorState message={getErrorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} />
      </Card>
    );
  }

  const data = dashboard.data;

  return (
    <div className="space-y-4 rise-in">
      {/* ───── 1-qator: ko‘rsatkichlar ───── */}
      {/* ⚠️ Kartalar TENG kenglikda emas: «Joriy yil yakunlanadi» va
          «Umumiy qiymat» uzunroq matn saqlaydi, shuning uchun ularga
          ko‘proq ulush beriladi (maketdagi kabi). Teng ustunlarda
          sarlavhalar qirqilib ketardi. */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1fr_1fr_1fr_1fr_1.1fr_1.35fr]">
        {data ? <KpiCards summary={data.summary} /> : <KpiCardsSkeleton />}
      </section>

      {/* ───── 2-qator: xarita · tumanlar · diagrammalar ───── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* ⚠️ `flex flex-col` + `flex-1`: xarita va jadval o‘ng ustundagi
            ikki kartaning umumiy balandligiga TO‘LADI. Busiz ularning
            ostida katta bo‘sh joy qolardi. */}
        <Card className="flex flex-col xl:col-span-5">
          <CardHeader title="Andijon viloyati xaritasi" moreTo="/map" moreLabel="Kattalashtirish" />
          <CardBody className="flex min-h-0 flex-1">
            <DistrictMap geojson={geojson.data} className="flex-1" heightClass="h-full min-h-[300px]" />
          </CardBody>
        </Card>

        <Card className="flex flex-col xl:col-span-4">
          <CardHeader title="Tumanlar kesimida obyektlar" moreTo="/districts" />
          <CardBody className="flex min-h-0 flex-1 flex-col">
            {data ? <DistrictTable districts={data.districts} /> : <BlockSkeleton rows={8} />}
          </CardBody>
        </Card>

        {/* ⚠️ O‘ng ustun chap kartalarning BALANDLIGINI belgilaydi: u
            qancha baland bo‘lsa, xarita ostida shuncha bo‘sh joy qoladi.
            Shuning uchun bu yerdagi ikki karta ataylab zich. */}
        <div className="flex flex-col gap-4 xl:col-span-3">
          <Card className="p-3.5">
            <CardHeader title="Muddatlar bo‘yicha" moreTo="/reports" />
            <CardBody className="mt-3">
              {data ? <DeadlineDonut buckets={data.byDeadline} /> : <BlockSkeleton rows={5} />}
            </CardBody>
          </Card>

          <Card className="p-3.5">
            <CardHeader title="Qurilish turlari bo‘yicha" />
            <CardBody className="mt-3">
              {data ? <TypeBreakdown items={data.byType} /> : <BlockSkeleton rows={6} />}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ───── 3-qator: kechikishlar ───── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-8" flush>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader title="Kechikayotgan obyektlar (TOP 5)" moreTo="/delays" moreLabel="Barchasini ko‘rish" />
          </div>
          <div className="mt-4 px-4 pb-1 sm:px-5">
            {data ? <TopDelayed items={data.topDelayed} /> : <BlockSkeleton rows={5} />}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <CardHeader title="Asosiy kechikish sabablari" moreTo="/delays" />
          <CardBody>
            {data ? <DelayReasons items={data.delayReasons} /> : <BlockSkeleton rows={6} />}
          </CardBody>
        </Card>
      </section>

      {/* ───── 4-qator: muddat va fotoarxiv ───── */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7" flush>
          <div className="px-4 pt-4 sm:px-5 sm:pt-5">
            <CardHeader
              title="Yaqin muddatda topshiriladigan obyektlar"
              moreTo="/objects?dueWithinDays=90"
            />
          </div>
          <div className="mt-4 px-4 pb-1 sm:px-5">
            {data ? <UpcomingTable items={data.upcoming} /> : <BlockSkeleton rows={5} />}
          </div>
        </Card>

        <Card className="xl:col-span-5">
          <CardHeader title="So‘nggi foto-hisobotlar" moreTo="/photos" />
          <CardBody>
            {data ? <RecentPhotos items={data.recentPhotos} /> : <BlockSkeleton rows={3} />}
          </CardBody>
        </Card>
      </section>

      {/* ───── Yangilanish vaqti ───── */}
      <footer className="flex items-center justify-between px-1 pb-2">
        <span className="t-meta">
          Oxirgi yangilanish:{' '}
          <span className="tabular text-strong">{data ? formatDateTimeUz(data.generatedAt) : '—'}</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void dashboard.refetch();
            void geojson.refetch();
          }}
          loading={dashboard.isFetching}
          leftIcon={<RefreshCw className="size-3.5" />}
        >
          Yangilash
        </Button>
      </footer>
    </div>
  );
}

function BlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-7 w-full" />
      ))}
    </div>
  );
}
