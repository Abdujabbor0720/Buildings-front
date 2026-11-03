import { RefreshCw } from 'lucide-react';
import { useDashboard, useDistrictGeoJson } from '@/shared/api/queries';
import { getErrorMessage } from '@/shared/api/client';
import { Card, CardBody, CardHeader, ErrorState, Skeleton } from '@/shared/ui';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { useFilterParams } from '@/store/filters.store';
import { DeadlineDonut } from './components/DeadlineDonut';
import { DelayReasons } from './components/DelayReasons';
import { DistrictMap, DistrictMapLegend } from './components/DistrictMap';
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
 *
 * ⚠️ SAHIFA BITTA EKRANGA SIG‘ADI — bu MAJBURIY talab, bezak emas.
 * Hokim bosh sahifaga «hozir ahvol qanday» degan savol bilan kiradi va
 * javob skroll ortida qolmasligi kerak.
 *
 * Shuning uchun tuzilma `flex flex-col` + `lg:h-[...]`:
 *   • balandlik oynadan kelib chiqadi (`100dvh` − sarlavha − to‘ldirish);
 *   • har qator `flex-[N]` bilan QOLGAN joyni nisbatda bo‘lishadi;
 *   • sig‘magan ro‘yxatlar (tumanlar jadvali) KARTA ICHIDA skroll bo‘ladi,
 *     sahifa esa skrollsiz qoladi.
 *
 * ⚠️ `lg:` dan pastda (planshet, telefon) qat’iy balandlik QO‘YILMAYDI:
 * u yerda kartalar ustma-ust tushadi va bitta ekranga sig‘dirish
 * ularni o‘qib bo‘lmas holga keltirardi.
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
    /*
     * ⚠️ Balandlik FAQAT `lg` dan boshlab qat’iy:
     *   80px = sarlavha (56) + `main` to‘ldirishi (2 × 12).
     * `AppLayout` dagi `py-3` yoki sarlavha balandligi o‘zgarsa, bu
     * son ham qayta hisoblanadi.
     *
     * ⚠️ `lg:` dan pastda (planshet, telefon) qat’iy balandlik YO‘Q:
     * u yerda kartalar ustma-ust tushadi va ularni bir ekranga siqish
     * o‘qib bo‘lmas holga keltirardi — odatiy oqim va skroll.
     */
    <div className="rise-in flex flex-col gap-1 lg:h-[calc(100dvh-80px)] lg:min-h-[600px]">
      {/* ───── 1-qator: ko‘rsatkichlar ───── */}
      {/* ⚠️ Oltita TENG ustun. Ilgari oxirgi ikkitasiga kengroq ulush
          berilgan edi (`1.1fr`, `1.35fr`) va 1280px li ekranda oltinchi
          karta qatordan butunlay chiqib ketardi. Endi kenglik teng,
          uzun matn esa karta ichida qisqaradi. */}
      {/* ⚠️ Oltita TENG ustun va har kartada `min-w-0`. Ilgari oxirgi
          ikkitasiga kengroq ulush berilgan edi va 1280px li ekranda
          oltinchi karta qatordan butunlay chiqib ketardi. Uzun
          yorliqli kartalarda grafika endi suzadi (`floatVisual`),
          shuning uchun qo‘shimcha kenglik kerak emas. */}
      <section className="grid shrink-0 grid-cols-2 gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
        {data ? <KpiCards summary={data.summary} /> : <KpiCardsSkeleton />}
      </section>

      {/* ───── 2-qator: xarita · tumanlar · diagrammalar ───── */}
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[47] xl:grid-cols-12">
        <Card className="flex min-h-0 flex-col p-3 xl:col-span-5">
          {/* ⚠️ Afsona SARLAVHA qatorida (`action`), xarita ustida emas:
              suzuvchi afsona o‘ng yuqoridagi tumanlarni yopib qo‘yardi. */}
          <CardHeader title="Andijon viloyati xaritasi" action={<DistrictMapLegend />} />
          <CardBody className="mt-1.5 flex min-h-0 flex-1">
            <DistrictMap geojson={geojson.data} className="flex-1" heightClass="h-full" />
          </CardBody>
        </Card>

        <Card className="flex min-h-0 flex-col p-3 xl:col-span-4">
          <CardHeader title="Tumanlar kesimida obyektlar" moreTo="/districts" />
          <CardBody className="mt-1.5 flex min-h-0 flex-1 flex-col">
            {data ? <DistrictTable districts={data.districts} /> : <BlockSkeleton rows={8} />}
          </CardBody>
        </Card>

        {/* ⚠️ Ikki karta BIR USTUNDA va ikkalasi ham `min-h-0`: halqa
            diagrammasi o‘z balandligini `ResponsiveContainer` dan oladi
            va ota element cheksiz bo‘lsa u 0px bo‘lib qolardi. */}
        <div className="flex min-h-0 flex-col gap-1.5 xl:col-span-3">
          <Card className="flex min-h-0 flex-[46] flex-col p-3">
            {/* ⚠️ Yorliqsiz havola (faqat strelka): bu ustun 240px va
                «Barchasi →» sarlavhani «Muddatlar bo‘…» ga qisqartirardi. */}
            <CardHeader title="Muddatlar bo‘yicha" moreTo="/reports" moreLabel="" />
            <CardBody className="mt-1.5 flex min-h-0 flex-1 flex-col">
              {data ? <DeadlineDonut buckets={data.byDeadline} /> : <BlockSkeleton rows={5} />}
            </CardBody>
          </Card>

          <Card className="flex min-h-0 flex-[54] flex-col p-3">
            <CardHeader title="Qurilish turlari bo‘yicha" />
            <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
              {data ? <TypeBreakdown items={data.byType} /> : <BlockSkeleton rows={6} />}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ───── 3-qator: kechikishlar ───── */}
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[26] xl:grid-cols-12">
        <Card className="flex min-h-0 flex-col p-3 xl:col-span-7">
          <CardHeader
            title="Kechikayotgan obyektlar (TOP 5)"
            moreTo="/delays"
            moreLabel="Barchasini ko‘rish"
          />
          <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
            {data ? <TopDelayed items={data.topDelayed} /> : <BlockSkeleton rows={5} />}
          </CardBody>
        </Card>

        <Card className="flex min-h-0 flex-col p-3 xl:col-span-5">
          <CardHeader title="Asosiy kechikish sabablari" moreTo="/delays" />
          <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
            {data ? <DelayReasons items={data.delayReasons} /> : <BlockSkeleton rows={6} />}
          </CardBody>
        </Card>
      </section>

      {/* ───── 4-qator: muddat va fotoarxiv ───── */}
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[26] xl:grid-cols-12">
        <Card className="flex min-h-0 flex-col p-3 xl:col-span-5">
          <CardHeader
            title="Yaqin muddatda topshiriladigan obyektlar"
            moreTo="/objects?dueWithinDays=90"
          />
          <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
            {data ? <UpcomingTable items={data.upcoming} /> : <BlockSkeleton rows={5} />}
          </CardBody>
        </Card>

        <Card className="flex min-h-0 flex-col p-3 xl:col-span-7">
          {/* ⚠️ «Yangilash» AYNAN shu yerda: sahifa bir ekranga sig‘ishi
              kerak va pastdagi alohida qator yana 40px yeb, skroll
              hosil qilardi. Oxirgi yangilanish vaqti esa tugmaning
              tooltipida — u kundalik ishda kerak emas, lekin «ma’lumot
              eskirdimi» degan savol tug‘ilganda darhol topiladi. */}
          <CardHeader
            title="So‘nggi foto-hisobotlar"
            moreTo="/photos"
            action={
              <button
                type="button"
                onClick={() => {
                  void dashboard.refetch();
                  void geojson.refetch();
                }}
                title={`Oxirgi yangilanish: ${data ? formatDateTimeUz(data.generatedAt) : '—'}`}
                aria-label="Ma’lumotlarni yangilash"
                className="grid size-6 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
              >
                <RefreshCw className={`size-3.5 ${dashboard.isFetching ? 'animate-spin' : ''}`} />
              </button>
            }
          />
          <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
            {data ? <RecentPhotos items={data.recentPhotos} /> : <BlockSkeleton rows={3} />}
          </CardBody>
        </Card>
      </section>
    </div>
  );
}

function BlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-6 w-full" />
      ))}
    </div>
  );
}
