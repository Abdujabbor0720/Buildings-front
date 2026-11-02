import L from 'leaflet';
import { Layers, MapPin } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { GeoJSON as GeoJsonLayer, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { useCatalogs, useDistrictGeoJson, useObjectsMap } from '@/shared/api/queries';
import type { DistrictGeoJson, ObjectHealth } from '@/shared/api/types';
import { HEALTH_LEGEND, HEALTH_META } from '@/shared/constants/health';
import { Badge, Card, LoadingBlock, PageHeader, Select, StatPills } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatCount } from '@/shared/utils/money.utils';
import { useFiltersStore } from '@/store/filters.store';
import { DistrictMap } from '@/features/dashboard/components/DistrictMap';
import { BASEMAP_ATTRIBUTION, BASEMAP_URL, HAS_BASEMAP } from '@/shared/constants/basemap';
import { useChartColors } from '@/shared/hooks/useChartColors';

type View = 'districts' | 'objects';

/** Afsona tartibi — «yaxshi → yomon», oxirida tugagan va boshlanmaganlar. */
const LEGEND_ORDER: ObjectHealth[] = ['on_schedule', 'delayed', 'at_risk', 'completed', 'not_started'];

/**
 * INTERAKTIV XARITA.
 *
 * Ikki ko‘rinish:
 *   • «Tumanlar» — choropleth, har tumanda obyektlar soni;
 *   • «Obyektlar» — har bir obyekt alohida nuqta (klaster emas: 200 ta
 *     nuqta uchun klasterlash ortiqcha murakkablik va u obyektlarni
 *     yashirib qo‘yadi).
 */
export default function MapPage() {
  const { regionId, yearFrom, yearTo } = useFiltersStore();
  const [view, setView] = useState<View>('districts');
  const [health, setHealth] = useState<string>('');
  const [typeId, setTypeId] = useState('');

  const { data: catalogs } = useCatalogs();

  const geoParams = useMemo(
    () => ({ ...(regionId ? { regionId } : {}), yearFrom, yearTo, ...(typeId ? { typeIds: typeId } : {}) }),
    [regionId, yearFrom, yearTo, typeId],
  );
  const objectParams = useMemo(
    () => ({
      ...(regionId ? { regionId } : {}),
      yearFrom,
      yearTo,
      ...(health ? { health } : {}),
      ...(typeId ? { typeIds: typeId } : {}),
    }),
    [regionId, yearFrom, yearTo, health, typeId],
  );

  const geojson = useDistrictGeoJson(geoParams);
  const points = useObjectsMap(objectParams, view === 'objects');

  const totals = geojson.data?.features.reduce(
    (acc, feature) => {
      acc.total += feature.properties.total;
      acc.delayed += feature.properties.delayed;
      acc.atRisk += feature.properties.atRisk;
      return acc;
    },
    { total: 0, delayed: 0, atRisk: 0 },
  );

  return (
    <>
      <PageHeader
        title="Interaktiv xarita"
        description="Obyektlarni tuman kesimida yoki alohida nuqta sifatida ko‘ring"
        stats={
          totals ? (
            <StatPills
              items={[
                { label: 'Jami', value: formatCount(totals.total) },
                { label: 'Kechikayotgan', value: formatCount(totals.delayed), tone: 'text-warn-600 dark:text-warn-500' },
                { label: 'Xavfli', value: formatCount(totals.atRisk), tone: 'text-danger-600 dark:text-danger-500' },
              ]}
            />
          ) : null
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg surface-muted p-0.5 ring-1 ring-inset ring-[var(--border-subtle)]">
              {(['districts', 'objects'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setView(item)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-meta font-medium transition-all',
                    view === item
                      ? 'surface text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.07),0_1px_2px_rgb(16_42_76/0.06)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]'
                      : 'text-muted hover:text-strong',
                  )}
                >
                  {item === 'districts' ? <Layers className="size-3.5" /> : <MapPin className="size-3.5" />}
                  {item === 'districts' ? 'Tumanlar' : 'Obyektlar'}
                </button>
              ))}
            </div>

            <Select
              value={typeId}
              onChange={(event) => setTypeId(event.target.value)}
              placeholder="Barcha turlar"
              options={(catalogs?.constructionTypes ?? []).map((type) => ({ value: type.id, label: type.name }))}
              className="w-auto min-w-[160px]"
            />

            {view === 'objects' ? (
              <Select
                value={health}
                onChange={(event) => setHealth(event.target.value)}
                placeholder="Barcha holatlar"
                options={HEALTH_LEGEND.map((item) => ({ value: item, label: HEALTH_META[item].label }))}
                className="w-auto min-w-[150px]"
              />
            ) : null}
          </div>
        }
      />

      <Card flush className="overflow-hidden">
        {view === 'districts' ? (
          geojson.isLoading ? (
            <LoadingBlock className="h-[calc(100dvh-16rem)]" />
          ) : (
            <DistrictMap geojson={geojson.data} showTiles heightClass="h-[calc(100dvh-16rem)]" className="rounded-none border-0" />
          )
        ) : points.isLoading ? (
          <LoadingBlock className="h-[calc(100dvh-16rem)]" />
        ) : (
          <ObjectsMap points={points.data ?? []} geojson={geojson.data ?? null} />
        )}
      </Card>
    </>
  );
}

/**
 * Obyektlar nuqta ko‘rinishi.
 *
 * ⚠️ Tuman chegaralari fon sifatida HAR DOIM chiziladi (rangsiz, nozik
 * kontur). Fon xaritasi sozlanmagan bo‘lsa, busiz belgilar bo‘sh oq
 * maydonda «osilib» qolardi va qaysi tumanda ekani bilinmasdi.
 */
function ObjectsMap({
  points,
  geojson,
}: {
  points: Array<{
    id: string; code: string; name: string; lat: number; lng: number;
    healthStatus: ObjectHealth; progressPercent: number; districtName: string;
    typeName: string; typeColor: string;
  }>;
  geojson: DistrictGeoJson | null;
}) {
  const { statusHex } = useChartColors();
  const bbox = geojson?.bbox ?? null;

  /** Afsona — xaritada HAQIQATAN uchraydigan holatlar, qat’iy tartibda. */
  const legend = useMemo(() => {
    const present = new Set(points.map((point) => point.healthStatus));
    return LEGEND_ORDER.filter((health) => present.has(health));
  }, [points]);
  const bounds = useMemo<L.LatLngBoundsExpression | undefined>(() => {
    if (!bbox || bbox.length < 4) return undefined;
    return [
      [bbox[1], bbox[0]],
      [bbox[3], bbox[2]],
    ];
  }, [bbox]);

  return (
    <div className="relative h-[calc(100dvh-16rem)]">
      {/* ⚠️ `zoomSnap={0}` — Leaflet sukut bo‘yicha faqat BUTUN zoom
          darajalarini ishlatadi va `fitBounds` konteynerga sig‘adigan eng
          katta butun darajani tanlaydi; natijada xarita atrofida keng
          bo‘sh joy qoladi (tuman ko‘rinishida ham xuddi shunday edi). */}
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [24, 24] }}
        zoomControl
        zoomSnap={0}
        zoomDelta={0.4}
        className="size-full"
        style={{ background: 'transparent' }}
      >
        {geojson ? (
          <GeoJsonLayer
            data={geojson as unknown as GeoJSON.FeatureCollection}
            interactive={false}
            style={{ color: 'var(--border-strong)', weight: 1, fillColor: 'var(--surface-inset)', fillOpacity: 1 }}
          />
        ) : null}
        {/* ⚠️ Fon xaritasi faqat sozlangan bo‘lsa (`VITE_BASEMAP_URL`).
            Kalitsiz CARTO plitkalari «API KEY REQUIRED» yozuvini RASM
            sifatida qaytaradi va butun xarita shu yozuv bilan qoplanadi. */}
        {HAS_BASEMAP ? <TileLayer url={BASEMAP_URL!} attribution={BASEMAP_ATTRIBUTION} /> : null}
        <FitBounds bounds={bounds} />

        {points.map((point) => {
          const meta = HEALTH_META[point.healthStatus];
          return (
            <Marker
              key={point.id}
              position={[point.lat, point.lng]}
              icon={L.divIcon({
                className: '',
                iconSize: [16, 16],
                iconAnchor: [8, 8],
                html: `<span style="
                  display:block;width:14px;height:14px;border-radius:999px;
                  background:${statusHex(meta)};border:2.5px solid var(--surface);
                  box-shadow:0 1px 4px rgba(10,10,10,.3)
                "></span>`,
              })}
            >
              <Popup>
                <div className="min-w-[230px] p-3">
                  <p className="mono text-faint text-micro">{point.code}</p>
                  <p className="mt-0.5 text-ui leading-snug font-semibold text-strong">{point.name}</p>
                  <p className="t-meta mt-1 text-micro">
                    {point.districtName} · {point.typeName}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Badge className={meta.chip} dot={meta.dot}>{meta.label}</Badge>
                    <span className="num text-meta text-strong">
                      {Math.round(point.progressPercent)}%
                    </span>
                  </div>
                  <Link
                    to={`/objects/${point.id}`}
                    className="mt-2.5 block rounded-lg bg-brand-500 py-1.5 text-center text-meta font-semibold text-white transition-colors hover:bg-brand-600"
                  >
                    Batafsil ko‘rish
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Afsona — belgilar rangi nimani bildirishini aytadi.
          ⚠️ Qat’iy ro‘yxat (`HEALTH_LEGEND`) EMAS, EKRANDAGI holatlardan
          quriladi: nuqtalar orasida «Topshirilgan» ham bor va qat’iy
          ro‘yxatda u yo‘q edi — xaritada binafsha belgi turib, afsonada
          u umuman tushuntirilmagan edi. */}
      {legend.length > 0 ? (
        <div className="surface-blur pointer-events-none absolute top-3 right-3 z-[400] flex flex-wrap justify-end gap-x-3 gap-y-1 rounded-lg px-2.5 py-1.5 shadow-[0_0_0_1px_rgb(16_42_76/0.06)]">
          {legend.map((health) => (
            <span key={health} className="flex items-center gap-1.5 text-micro text-muted">
              <span className="size-2 rounded-full" style={{ backgroundColor: statusHex(HEALTH_META[health]) }} />
              {HEALTH_META[health].label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FitBounds({ bounds }: { bounds?: L.LatLngBoundsExpression }) {
  const map = useMap();
  // ⚠️ `useEffect`, `useMemo` EMAS: bu hisoblash emas, yon ta’sir.
  // Kechikish — konteyner o‘lchami CSS bilan o‘rnashib bo‘lishini kutish.
  useEffect(() => {
    if (!bounds) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(bounds, { padding: [24, 24] });
    }, 150);
    return () => clearTimeout(timer);
  }, [map, bounds]);
  return null;
}
