import { RefreshCw } from 'lucide-react';
import { useDashboard, useDistrictGeoJson, useMahallaGeoJson } from '@/shared/api/queries';
import { getErrorMessage } from '@/shared/api/client';
import type { ReactNode } from 'react';
import { Card, CardBody, CardHeader, ErrorState, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { useNavigate } from 'react-router-dom';
import { useFilterParams, useFiltersStore } from '@/store/filters.store';
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
  const selectDistrict = useFiltersStore((state) => state.selectDistrict);
  const navigate = useNavigate();
  const dashboard = useDashboard(params);
  const geojson = useDistrictGeoJson({
    regionId: params.regionId,
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
  });

  /*
   * ───── TUMAN KESIMIGA O'TISH ─────
   *
   * ⚠️ Faqat BITTA tuman tanlanganda. Ikkita tuman tanlangan bo'lsa
   * «qaysi tumanning mahallalari» degan savolga javob yo'q va xarita
   * ikki ajralgan hududni ko'rsatib, hech biriga sig'masdi — bunday
   * holatda viloyat ko'rinishi qoladi.
   *
   * ⚠️ So'rov `enabled` orqali boshqariladi (`useMahallaGeoJson`):
   * viloyat ko'rinishida u umuman yuborilmaydi.
   */
  /* ⚠️ `districtIds` — vergul bilan birlashtirilgan SATR (`useFilterParams`),
     massiv emas: filtr shu ko'rinishda to'g'ridan-to'g'ri so'rov
     parametriga ketadi. Bitta tuman tanlanganini ANIQLASH uchun u
     qaytadan bo'linadi. */
  const selected = params.districtIds ? params.districtIds.split(',').filter(Boolean) : [];
  const focusedDistrictId = selected.length === 1 ? selected[0] : undefined;
  const mahallas = useMahallaGeoJson(focusedDistrictId, {
    yearFrom: params.yearFrom,
    yearTo: params.yearTo,
  });
  const districtView = Boolean(focusedDistrictId) && Boolean(mahallas.data);

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
     *
     * ⚠️ `min-h-[880px]` — KONTENTNING eng kichik ehtiyoji. Past
     * (768px) ekranda oyna shuncha joy bermaydi; chegara bo‘lmasa
     * kartalar ichidagi oxirgi qatorlar QIRQILIB qolardi. Chegara
     * bilan esa sahifa skroll bo‘ladi — bu qirqilgan ma’lumotdan
     * ko‘ra yaxshiroq. 1080px li monitorda bu chegara umuman
     * sezilmaydi.
     *
     * ⚠️ Son 760 dan 880 ga KO‘TARILDI: uchinchi va to‘rtinchi
     * qatordagi jadvallarga obyekt joylashuvi va mas'uli qo‘shildi
     * (har qatorga bitta ixcham satr, ~12px). Ikkala jadval ham
     * beshta qatorli, ya’ni har biriga ~60px kerak. Chegara
     * ko‘tarilmasa, qo‘shilgan ma'lumot mavjudini QIRQIB qo‘yardi.*/
    <div className="rise-in flex flex-col gap-1 lg:h-[calc(100dvh-80px)] lg:min-h-[880px]">
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
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[45] xl:grid-cols-12">
        <Card className="flex min-h-0 flex-col p-3 xl:col-span-5">
          {/* ⚠️ Afsona SARLAVHA qatorida (`action`), xarita ustida emas:
              suzuvchi afsona o‘ng yuqoridagi tumanlarni yopib qo‘yardi. */}
          {/* ⚠️ Sarlavha TANLOVGA ergashadi: bitta tuman tanlanganda
              xarita o‘sha tumanniki bo‘ladi va «Andijon viloyati
              xaritasi» degan yozuv yolg‘on bo‘lib qolardi. */}
          <CardHeader
            title={
              districtView
                ? `${mahallas.data!.district.name} — mahallalar kesimida`
                : 'Andijon viloyati xaritasi'
            }
            subtitle={districtView ? coverageNote(mahallas.data!.coverage) : undefined}
            action={<DistrictMapLegend />}
          />
          <CardBody className="mt-1.5 flex min-h-0 flex-1">
            <DistrictMap
              geojson={districtView ? mahallas.data : geojson.data}
              level={districtView ? 'district' : 'region'}
              objects={districtView ? mahallas.data!.objects : undefined}
              outline={districtView ? mahallas.data!.district.geometry : undefined}
              /*
               * ⚠️ Viloyat ko‘rinishida tuman bosilsa — SARLAVHADAGI
               * FILTR o‘zgaradi va xarita o‘sha tumanning mahallalariga
               * o‘tadi. Ilgari bosish obyektlar ro‘yxatiga olib ketardi:
               * «tumanni alohida ko‘rish» uchun foydalanuvchi orqaga
               * qaytib, sarlavhadan qo‘lda tanlashi kerak edi.
               *
               * ⚠️ Tuman ko‘rinishida ham handler MAJBURIY. Mahalla
               * ko‘pburchagining `properties.districtId` maydonida
               * MAHALLA id si turadi (`geo.service.mahallaStats`:
               * `select('m.id', 'districtId')`), ya’ni sukut
               * xatti-harakati `/objects?districtIds=<mahalla-id>` ga
               * olib borib, BO‘SH ro‘yxat ochardi. Jadval tomonida bu
               * tuzoq allaqachon hisobga olingan edi, xarita tomonida
               * esa yo‘q.
               */
              onDistrictClick={
                districtView
                  ? () => navigate(`/objects?districtIds=${focusedDistrictId}`)
                  : (district) => selectDistrict(district.districtId)
              }
              className="flex-1"
              heightClass="h-full"
            />
          </CardBody>
        </Card>

        <TableCard
          className="xl:col-span-4"
          header={
            <CardHeader
              title={districtView ? 'Mahallalar kesimida obyektlar' : 'Tumanlar kesimida obyektlar'}
              moreTo="/districts"
            />
          }
        >
          <div className="flex h-full min-h-0 flex-col">
            {/*
              ⚠️ Mahalla qatorlari XARITA javobidan olinadi, alohida
              so‘rovdan emas: ikkalasi bitta manbadan kelgani uchun
              jadvaldagi son bilan xaritadagi rang HAR DOIM mos
              keladi. Ikki so‘rov bo‘lsa, biri eskirgan paytda ular
              bir-biriga zid raqam ko‘rsatishi mumkin edi.

              ⚠️ Qator bosilganda obyektlar ro‘yxatiga TUMAN bo‘yicha
              o‘tiladi: ro‘yxatda mahalla filtri yo‘q va mahalla id si
              bilan o‘tilsa, bo‘sh ekran ochilardi.
            */}
            {districtView ? (
              <DistrictTable
                districts={mahallas.data!.features.map((f) => f.properties)}
                level="district"
                onRowClick={() => navigate(`/objects?districtIds=${focusedDistrictId}`)}
              />
            ) : data ? (
              <DistrictTable districts={data.districts} />
            ) : (
              <div className="px-3">
                <BlockSkeleton rows={8} />
              </div>
            )}
          </div>
        </TableCard>

        {/* ⚠️ Ikki karta BIR USTUNDA va ikkalasi ham `min-h-0`: halqa
            diagrammasi o‘z balandligini `ResponsiveContainer` dan oladi
            va ota element cheksiz bo‘lsa u 0px bo‘lib qolardi. */}
        <div className="flex min-h-0 flex-col gap-1.5 xl:col-span-3">
          {/*
            ⚠️ `min-h-*` MAJBURIY. Faqat nisbat (`flex-[N]`) bilan
            bo‘lganda 1280px li ekranda bu karta 132px gacha
            kichrayib, halqa va ro‘yxat qirqilib qolardi. Eng kichik
            balandlik ichidagi kontentdan hisoblangan; ortiqcha joy
            esa baribir nisbatda bo‘linadi.
          */}
          <Card className="flex min-h-[130px] flex-[43] flex-col p-3">
            {/* ⚠️ Yorliqsiz havola (faqat strelka): bu ustun 240px va
                «Barchasi →» sarlavhani «Muddatlar bo‘…» ga qisqartirardi. */}
            <CardHeader title="Muddatlar bo‘yicha" moreTo="/reports" moreLabel="" />
            <CardBody className="mt-1.5 flex min-h-0 flex-1 flex-col">
              {data ? <DeadlineDonut buckets={data.byDeadline} /> : <BlockSkeleton rows={5} />}
            </CardBody>
          </Card>

          <Card className="flex min-h-[165px] flex-[57] flex-col p-3">
            <CardHeader title="Qurilish turlari bo‘yicha" />
            <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
              {data ? <TypeBreakdown items={data.byType} /> : <BlockSkeleton rows={6} />}
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ───── 3-qator: kechikishlar ───── */}
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[27.5] xl:grid-cols-12">
        <TableCard
          className="xl:col-span-7"
          header={
            <CardHeader
              title="Kechikayotgan obyektlar (TOP 5)"
              moreTo="/delays"
              moreLabel="Barchasini ko‘rish"
            />
          }
        >
          {data ? <TopDelayed items={data.topDelayed} /> : <div className="px-3"><BlockSkeleton rows={5} /></div>}
        </TableCard>

        <Card className="flex min-h-0 flex-col p-3 xl:col-span-5">
          <CardHeader title="Asosiy kechikish sabablari" moreTo="/delays" />
          <CardBody className="mt-1.5 min-h-0 flex-1 overflow-y-auto">
            {data ? <DelayReasons items={data.delayReasons} /> : <BlockSkeleton rows={6} />}
          </CardBody>
        </Card>
      </section>

      {/* ───── 4-qator: muddat va fotoarxiv ───── */}
      <section className="grid gap-1.5 lg:min-h-0 lg:flex-[27.5] xl:grid-cols-12">
        <TableCard
          className="xl:col-span-5"
          header={
            <CardHeader
              title="Yaqin muddatda topshiriladigan obyektlar"
              moreTo="/objects?dueWithinDays=90"
            />
          }
        >
          {data ? <UpcomingTable items={data.upcoming} /> : <div className="px-3"><BlockSkeleton rows={5} /></div>}
        </TableCard>

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

/**
 * JADVALLI KARTA — sarlavha to‘ldirish ichida, jadval esa KARTA
 * KENGLIGINING O‘ZIDA.
 *
 * ⚠️ Jadvalga 24px to‘ldirish berilsa, 1280px li ekranda ustunlar
 * sig‘may qoladi va «Bajarilish» / «Asosiy sabab» / «Status»
 * ustunlari qirqilib, gorizontal skroll paydo bo‘ladi. Shuning
 * uchun karta `flush`, to‘ldirish esa faqat sarlavhaga beriladi.
 *
 * ⚠️ Manfiy chet (`-mx-*`) bilan QILINMAYDI: u skroll qilinadigan
 * ota element ichida chapga chiqqan qismni yetib bo‘lmas joyga
 * tushirib, «#» ustunidagi raqamlarni yarmigacha kesib qo‘yardi.
 */
function TableCard({
  className,
  header,
  children,
}: {
  className?: string;
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card flush className={cn('flex min-h-0 flex-col overflow-hidden', className)}>
      <div className="shrink-0 px-3 pt-3">{header}</div>
      <div className="mt-1.5 min-h-0 flex-1 pb-2">{children}</div>
    </Card>
  );
}

/**
 * QOPLAMA IZOHI — sarlavha ostidagi bitta qator.
 *
 * ⚠️ Mahallasi aniqlanmagan obyekt YASHIRILMAYDI, ochiq aytiladi.
 * Mahalla chegaralari (manba — OpenStreetMap) hamma tumanda ham yo‘q;
 * jim turilsa, hokim xaritadagi nuqtalar bilan jadvaldagi sonlar
 * nega mos kelmayotganini tushunmasdi.
 */
function coverageNote(coverage: { mahallas: number; withoutMahalla: number }): string {
  if (coverage.mahallas === 0) {
    return 'Mahalla chegaralari hali yuklanmagan — obyektlar nuqta bilan ko‘rsatilgan';
  }
  const base = `${coverage.mahallas} ta mahalla`;
  return coverage.withoutMahalla > 0
    ? `${base} · ${coverage.withoutMahalla} ta obyekt chegaradan tashqarida`
    : base;
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
