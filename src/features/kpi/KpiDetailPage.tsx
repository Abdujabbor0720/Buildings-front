import { useMemo, useState } from 'react';
import { ArrowLeft, RefreshCw, X } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/client';
import { useKpiMetric } from '@/shared/api/queries';
import type { KpiMetricKey } from '@/shared/api/types';
import { Card, EmptyState, ErrorState, PageHeader, Skeleton } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';
import { useFilterParams } from '@/store/filters.store';
import { KpiBlockCard, type KpiFilterState } from './components/KpiBlocks';
import { KpiHero, KpiHeroSkeleton } from './components/KpiHero';
import { KpiObjectsTable } from './components/KpiObjectsTable';
import { isKpiMetric, KPI_META } from './kpi.meta';

/**
 * KO‘RSATKICHNING BATAFSIL SAHIFASI — oltita karta uchun BITTA sahifa.
 *
 * ⚠️ Oltita alohida sahifa YOZILMAGAN. Ular 90% bir xil bo‘lardi va
 * tajriba shuni ko‘rsatadi: bitta blokdagi tuzatish qolgan beshtasiga
 * ko‘chirilmay qoladi. Farq `kpi.meta.ts` da e’lon qilingan — sarlavha,
 * tus, qaysi bloklar va qaysi tartibda.
 *
 * ⚠️ SAHIFA SARLAVHADAGI GLOBAL FILTRGA BO‘YSUNADI (`useFilterParams`)
 * — bosh sahifa bilan AYNI parametrlar. Shuning uchun kartadagi 116
 * bilan bu yerdagi 116 har doim bir xil bo‘ladi. Filtrni bu yerda
 * qayta e’lon qilmang: ikkinchi nusxa paydo bo‘lishi bilan ikki ekran
 * ikki xil raqam ko‘rsata boshlaydi.
 *
 * ⚠️ Bosh sahifadan FARQLI o‘laroq bu sahifa qat’iy balandlikka
 * siqilmaydi: u «hozir ahvol qanday» degan savolga emas, «nega
 * shunday» degan savolga javob beradi va skroll bu yerda normal.
 */
export default function KpiDetailPage() {
  const { metric } = useParams<{ metric: string }>();

  /*
   * ⚠️ Tekshiruv ALOHIDA komponentda, ichkarida emas. Hooklarni
   * shartli chaqirib bo‘lmaydi: tekshiruv so‘rov hookidan KEYIN
   * tursa, `/kpi/foo` ga kirgan odam uchun ham bitta ortiqcha so‘rov
   * ketardi va u serverdan 400 bilan qaytardi.
   *
   * ⚠️ Noma’lum kalit — 404, server xatosi EMAS: «bunday sahifa
   * yo‘q» degan javob «xatolik yuz berdi» dan ko‘ra to‘g‘riroq.
   */
  if (!isKpiMetric(metric)) return <Navigate to="/404" replace />;

  /*
   * ⚠️ `key={metric}` MAJBURIY. Busiz React bitta komponent
   * nusxasini qayta ishlatardi va «Kechikayotgan» sahifasida
   * tanlangan tuman filtri, jadval sahifasi hamda saralash tartibi
   * «Xavfli holatda» sahifasiga ERGASHIB o‘tardi — foydalanuvchi esa
   * yangi sahifa ochdim deb o‘ylardi.
   */
  return <KpiMetricView key={metric} metric={metric} />;
}

function KpiMetricView({ metric }: { metric: KpiMetricKey }) {
  const globalParams = useFilterParams();

  /*
   * ⚠️ Tuman va tur filtri FAQAT jadvalga ta’sir qiladi, yuqoridagi
   * raqamga EMAS. Aks holda «Kechikayotgan 116» sarlavhasi qator
   * bosilganda 12 ga o‘zgarib, foydalanuvchi qayerda turganini
   * yo‘qotardi. Jadval ustidagi chip qaysi filtr yoqilganini aytadi.
   */
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);

  const detail = useKpiMetric(metric, globalParams as Record<string, unknown>);

  const scopeParams = useMemo(
    () => ({
      ...globalParams,
      ...(districtId ? { districtIds: districtId } : {}),
      ...(typeId ? { typeIds: typeId } : {}),
    }),
    [globalParams, districtId, typeId],
  );

  const meta = KPI_META[metric];
  const data = detail.data;

  const filters: KpiFilterState = {
    districtId,
    typeId,
    toggleDistrict: (id) => setDistrictId((current) => (current === id ? null : id)),
    toggleType: (id) => setTypeId((current) => (current === id ? null : id)),
  };

  const districtRow = data?.byDistrict.find((row) => row.districtId === districtId);
  const typeRow = data?.byType.find((row) => row.typeId === typeId);

  /*
   * ⚠️ Sarlavhadagi global filtr o‘zgarib, tanlangan tuman (yoki tur)
   * doiradan chiqib ketsa, filtr O‘ZI tozalanadi. Busiz jadval
   * «0 ta obyekt» ko‘rsatib turardi va buning sababi — endi mavjud
   * bo‘lmagan tumanning chipi — ekranda hech qayerda ko‘rinmasdi.
   */
  if (data) {
    if (districtId && !districtRow) setDistrictId(null);
    if (typeId && !typeRow) setTypeId(null);
  }

  const districtName = districtRow?.name ?? null;
  const typeName = typeRow?.name ?? null;

  const chips =
    districtId || typeId ? (
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="t-label">Jadval filtri:</span>
        {districtId ? (
          <FilterChip label={districtName ?? 'Tanlangan tuman'} onClear={() => setDistrictId(null)} />
        ) : null}
        {typeId ? (
          <FilterChip label={typeName ?? 'Tanlangan tur'} onClear={() => setTypeId(null)} />
        ) : null}
      </div>
    ) : null;

  return (
    <div className="rise-in">
      <div className="mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-meta text-muted transition-colors hover:text-strong"
        >
          <ArrowLeft className="size-3.5" />
          Bosh sahifa
        </Link>
      </div>

      <PageHeader
        title={meta.title}
        description={meta.description}
        actions={
          <button
            type="button"
            onClick={() => void detail.refetch()}
            title={`Oxirgi yangilanish: ${data ? formatDateTimeUz(data.generatedAt) : '—'}`}
            aria-label="Ma’lumotlarni yangilash"
            className="inline-flex items-center gap-1.5 rounded-lg surface px-3 py-1.5 text-meta text-muted shadow-[0_0_0_1px_rgb(16_42_76/0.1)] transition-colors hover:text-strong dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]"
          >
            <RefreshCw className={cn('size-3.5', detail.isFetching && 'animate-spin')} />
            Yangilash
          </button>
        }
      />

      {detail.isError ? (
        <Card>
          <ErrorState message={getErrorMessage(detail.error)} onRetry={() => void detail.refetch()} />
        </Card>
      ) : !data ? (
        <div className="space-y-3">
          <KpiHeroSkeleton />
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="xl:col-span-4">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="mt-3 h-36" />
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <KpiHero meta={meta} detail={data} />

          {/*
            ⚠️ Nol natijada BLOKLAR CHIZILMAYDI. O‘n ikkita bo‘sh karta
            «ma’lumot yuklanmadi» degan taassurot berardi; bitta aniq
            izoh esa aslida nima bo‘lganini aytadi — filtrga mos obyekt
            yo‘q.
          */}
          {data.count === 0 ? (
            <Card>
              <EmptyState
                title="Bu kesimda obyekt yo‘q"
                description="Sarlavhadagi viloyat, tuman yoki yil oralig‘ini kengaytirib ko‘ring."
              />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                {meta.blocks.map((block) => (
                  <KpiBlockCard key={block.key} block={block} detail={data} filters={filters} />
                ))}
              </div>

              <KpiObjectsTable
                metric={metric}
                meta={meta}
                scopeParams={scopeParams}
                chips={chips}
                filtered={Boolean(districtId || typeId)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Jadval filtri chipi — nimadan kelib chiqqani va uni o‘chirish tugmasi. */
function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-1 pl-2.5 text-micro font-medium text-brand-700 ring-1 ring-inset ring-brand-500/20 dark:bg-brand-500/12 dark:text-brand-300 dark:ring-brand-500/25">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`${label} filtrini olib tashlash`}
        className="grid size-4 place-items-center rounded-full transition-colors hover:bg-brand-500/20"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
