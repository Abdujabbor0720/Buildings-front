import L from 'leaflet';
import { Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GeoJSON as GeoJsonLayer, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type { DistrictGeoJson, DistrictStats, ObjectHealth } from '@/shared/api/types';
import { BASEMAP_ATTRIBUTION, BASEMAP_URL, HAS_BASEMAP } from '@/shared/constants/basemap';
import { HEALTH_LEGEND, HEALTH_META } from '@/shared/constants/health';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { cn } from '@/shared/utils/cn';
import { formatCompact } from '@/shared/utils/money.utils';

interface DistrictMapProps {
  geojson: DistrictGeoJson | undefined;
  /** Tuman bosilganda — filtrga qo‘shish yoki ro‘yxatga o‘tish. */
  onDistrictClick?: (district: DistrictStats) => void;
  /**
   * Fon xaritasi ko‘rsatilsinmi. Dashboard'da toza ko‘rinish afzal.
   * ⚠️ `true` bo‘lsa ham, fon FAQAT sozlangan bo‘lsa chiziladi
   * (`VITE_BASEMAP_URL`) — aks holda plitka serveri xato matnini
   * rasm sifatida qaytarib, xaritani suv belgilari bilan to‘ldiradi.
   */
  showTiles?: boolean;
  className?: string;
  heightClass?: string;
}

/** Qo‘shni viloyatlar — maketdagi kabi yo‘naltiruvchi yorliqlar. */
const NEIGHBOURS: Array<{ label: string; position: [number, number] }> = [
  { label: 'Namangan viloyati', position: [41.055, 72.62] },
  { label: 'Toshkent viloyati', position: [40.98, 71.52] },
  { label: 'Farg‘ona viloyati', position: [40.43, 72.0] },
];

export function DistrictMap({
  geojson,
  onDistrictClick,
  showTiles = false,
  className,
  heightClass = 'h-[360px]',
}: DistrictMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();
  const palette = useChartColors();

  const bounds = useMemo<L.LatLngBoundsExpression | undefined>(() => {
    if (!geojson?.bbox || geojson.bbox.length < 4) return undefined;
    const [minLng, minLat, maxLng, maxLat] = geojson.bbox;
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [geojson?.bbox]);

  // Escape bilan to‘liq ekrandan chiqish — brauzerning o‘z F11 rejimi emas,
  // shuning uchun klaviaturani o‘zimiz ulaymiz.
  useEffect(() => {
    if (!fullscreen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFullscreen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [fullscreen]);

  const handleClick = useCallback(
    (district: DistrictStats) => {
      if (onDistrictClick) onDistrictClick(district);
      else navigate(`/objects?districtIds=${district.districtId}`);
    },
    [navigate, onDistrictClick],
  );

  if (!geojson) {
    return <div className={cn('skeleton rounded-xl', heightClass, className)} />;
  }

  return (
    <div
      className={cn(
        'surface-muted relative overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(16_42_76/0.06)]',
        fullscreen ? 'fixed inset-3 z-50 h-auto shadow-[0_24px_64px_-18px_rgb(10_10_10/0.45)]' : heightClass,
        className,
      )}
    >
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [14, 14] }}
        zoomControl={false}
        attributionControl={showTiles && HAS_BASEMAP}
        scrollWheelZoom={false}
        // ⚠️ Sukut bo‘yicha Leaflet FAQAT butun zoom darajalarini ishlatadi
        // va `fitBounds` konteynerga sig‘adigan eng katta BUTUN darajani
        // tanlaydi — natijada xarita atrofida keng bo‘sh joy qoladi.
        // `zoomSnap={0}` kasrli zoomga ruxsat beradi va chegara aniq o‘tiradi.
        zoomSnap={0}
        zoomDelta={0.4}
        doubleClickZoom
        className="size-full"
        style={{ background: 'transparent' }}
      >
        {showTiles && HAS_BASEMAP ? (
          <TileLayer url={BASEMAP_URL!} attribution={BASEMAP_ATTRIBUTION} />
        ) : null}

        <DistrictLayer geojson={geojson} onSelect={handleClick} palette={palette} />

        {NEIGHBOURS.map((neighbour) => (
          <Marker
            key={neighbour.label}
            position={neighbour.position}
            interactive={false}
            icon={L.divIcon({
              className: '',
              html: `<span style="white-space:nowrap;font:500 11px/1.4 var(--font-sans);color:var(--ink-faint)">${neighbour.label}</span>`,
              iconSize: [0, 0],
            })}
          />
        ))}

        <BoundsKeeper bounds={bounds} fullscreen={fullscreen} />

        {/* ⚠️ Boshqaruvlar MapContainer ICHIDA: `useMap()` faqat shu
            kontekstda ishlaydi. Tashqarida bo‘lsa, kattalashtirish tugmasi
            «useMap must be used within MapContainer» xatosi bilan yiqilardi. */}
        <MapControls fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((value) => !value)} />
      </MapContainer>

    </div>
  );
}

/**
 * XARITA AFSONASI — kartaning SARLAVHA qatorida, xarita USTIDA emas.
 *
 * ⚠️ Ilgari u xaritaning o‘ng yuqori burchagida suzib turardi va aynan
 * o‘sha joydagi tumanlarni (Namangan tomondagilar) yopib qo‘yardi.
 * Sarlavha qatorida esa u hech narsani to‘smaydi va karta ochilishi
 * bilan ko‘zga tashlanadi — xarita qanday o‘qilishini AVVAL aytadi.
 */
export function DistrictMapLegend() {
  const palette = useChartColors();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {HEALTH_LEGEND.map((health) => (
        <span key={health} className="flex items-center gap-1.5 text-micro text-muted">
          {/* Holat belgisi — DOIRA (turkum belgisi kvadrat). */}
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: palette.statusHex(HEALTH_META[health]) }}
          />
          {LEGEND_LABELS[health]}
        </span>
      ))}
    </div>
  );
}

/** Afsonada qisqaroq yorliq — «Kechikayotgan» juda uzun. */
const LEGEND_LABELS: Record<ObjectHealth, string> = {
  on_schedule: 'Reja asosida',
  delayed: 'Kechikmoqda',
  at_risk: 'Xavfli',
  not_started: 'Boshlanmagan',
  completed: 'Topshirilgan',
};

/**
 * GeoJSON qatlami + har tuman markazidagi sanoq belgisi.
 *
 * ⚠️ `key` ichida ma’lumot hash'i bor: Leaflet GeoJSON qatlami
 * `data` o‘zgarganda O‘ZINI YANGILAMAYDI, shuning uchun React uni qayta
 * yaratishi kerak. Busiz filtr o‘zgarganda ranglar eski holida qolardi.
 */
function DistrictLayer({
  geojson,
  onSelect,
  palette,
}: {
  geojson: DistrictGeoJson;
  onSelect: (district: DistrictStats) => void;
  palette: ReturnType<typeof useChartColors>;
}) {
  const signature = useMemo(
    () =>
      geojson.features
        .map((f) => `${f.properties.code}:${f.properties.total}:${f.properties.dominantHealth}`)
        .join('|') + (palette.dark ? '|dark' : '|light'),
    [geojson, palette.dark],
  );

  return (
    <>
      <GeoJsonLayer
        key={signature}
        data={geojson as unknown as GeoJSON.FeatureCollection}
        style={(feature) => {
          const props = feature?.properties as DistrictStats | undefined;
          return {
            color: palette.dark ? '#0d1721' : '#ffffff',
            weight: 1.5,
            fillColor: palette.densityHex(props?.total ?? 0),
            fillOpacity: 1,
          };
        }}
        onEachFeature={(feature, layer) => {
          const props = feature.properties as DistrictStats;
          layer.on({
            click: () => onSelect(props),
            mouseover: (event) => {
              (event.target as L.Path).setStyle({ weight: 2.5, fillOpacity: 0.78 });
            },
            mouseout: (event) => {
              (event.target as L.Path).setStyle({ weight: 1.5, fillOpacity: 1 });
            },
          });
          layer.bindTooltip(tooltipHtml(props, palette), { sticky: true, direction: 'top', opacity: 1, className: '!border-0 !bg-transparent !p-0 !shadow-none' });
        }}
      />

      {geojson.features.map((feature) => {
        const props = feature.properties;
        const hex = palette.statusHex(HEALTH_META[props.dominantHealth]);
        const size = props.total >= 20 ? 30 : props.total >= 10 ? 27 : 24;

        return (
          <Marker
            key={props.districtId}
            position={[props.centerLat, props.centerLng]}
            eventHandlers={{ click: () => onSelect(props) }}
            // ⚠️ Kattaroq tuman USTDA chiziladi. Markaziy tumanlar
            // yonma-yon va ularning yorliqlari kesishadi; tartibsiz
            // bo‘lsa, kichik tumanning nomi kattasining ustini yopib,
            // ikkalasi ham o‘qilmay qolardi.
            zIndexOffset={props.total}
            icon={L.divIcon({
              className: '',
              // ⚠️ `iconSize` BELGI kengligi emas, butun blok kengligi:
              // nom doiradan kengroq bo‘ladi va markazlash shunga qarab
              // hisoblanadi. Tor qilib qo‘yilsa, uzun nomli tuman
              // («Qo‘rg‘ontepa») chapga siljib qolardi.
              iconSize: [110, size + 18],
              iconAnchor: [55, (size + 18) / 2],
              html: `<span style="
                display:flex;flex-direction:column;align-items:center;gap:3px;
                width:110px;cursor:pointer;
              ">
                <span style="
                  display:grid;place-items:center;
                  width:${size}px;height:${size}px;border-radius:999px;
                  background:${hex};color:#fff;
                  font:600 ${props.total >= 100 ? 10 : 11.5}px/1 var(--font-sans);
                  font-variant-numeric:tabular-nums;
                  box-shadow:0 1px 4px rgba(2,24,58,.3);
                  border:2px solid var(--surface);
                ">${props.total}</span>
                <span style="
                  display:inline-block;padding:1px 5px;border-radius:5px;
                  background:var(--surface);
                  box-shadow:0 0 0 1px rgb(16 42 76 / .1);
                  font:600 9.5px/1.35 var(--font-sans);
                  color:var(--ink-body);white-space:nowrap;
                ">${props.shortName}</span>
              </span>`,
            })}
          />
        );
      })}
    </>
  );
}

/**
 * Ko‘rsatma (tooltip) — Leaflet HTML qatori talab qiladi, shuning uchun
 * uslub satr ichida. ⚠️ Ranglar PALITRADAN olinadi, qotirib yozilmaydi:
 * qorong‘i rejimda to‘q yashil qora fonda ko‘rinmay qolardi.
 */
function tooltipHtml(props: DistrictStats, palette: ReturnType<typeof useChartColors>): string {
  // ⚠️ Ko‘rsatma HAR DOIM to‘q fonli — yorug‘ rejimda ham. U xarita
  // USTIDA suzadi va oq fonli bo‘lsa, ochiq ko‘k tumanlar ustida
  // chegarasi yo‘qolib ketardi.
  // Ranglar sovuq neytral oiladan (`neutral-900/800`), iliq kulrangdan
  // emas: ko‘kish xarita ustida sarg‘ish kulrang «kir» bo‘lib ko‘rinadi.
  const ink = palette.dark ? '#eef3f8' : '#ffffff';
  const bg = palette.dark ? '#243344' : '#16222f';
  const faint = palette.dark ? '#94a6bd' : 'rgba(255,255,255,.64)';

  const row = (label: string, value: string | number, color?: string) =>
    `<div style="display:flex;justify-content:space-between;gap:14px">
       <span style="color:${faint}">${label}</span>
       <strong style="font-weight:600;font-variant-numeric:tabular-nums;${color ? `color:${color}` : ''}">${value}</strong>
     </div>`;

  return `<div style="
      min-width:188px;padding:9px 11px;border-radius:10px;
      background:${bg};color:${ink};font:400 11.5px/1.65 var(--font-sans);
      box-shadow:0 10px 26px rgba(10,10,10,.34)
    ">
    <div style="font-weight:600;font-size:12.5px;margin-bottom:6px">${props.name}</div>
    ${row('Jami obyektlar', props.total)}
    ${row('Reja asosida', props.onSchedule, palette.statusHex(HEALTH_META.on_schedule))}
    ${row('Kechikayotgan', props.delayed, palette.statusHex(HEALTH_META.delayed))}
    ${row('Xavfli', props.atRisk, palette.statusHex(HEALTH_META.at_risk))}
    ${row('O‘rtacha bajarilish', `${props.avgProgress}%`)}
    ${row('Umumiy qiymat', `${formatCompact(props.totalCost)} so‘m`)}
  </div>`;
}

/** Xarita o‘lchami o‘zgarganda (to‘liq ekran) qayta moslashtiriladi. */
function BoundsKeeper({ bounds, fullscreen }: { bounds?: L.LatLngBoundsExpression; fullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    // ⚠️ `invalidateSize` MAJBURIY: konteyner o‘lchami CSS orqali
    // o‘zgarganini Leaflet o‘zi sezmaydi va xarita yarim bo‘sh qoladi.
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bounds) map.fitBounds(bounds, { padding: [14, 14] });
    }, 220);
    return () => clearTimeout(timer);
  }, [map, bounds, fullscreen]);
  return null;
}

function MapControls({ fullscreen, onToggleFullscreen }: { fullscreen: boolean; onToggleFullscreen: () => void }) {
  return (
    <div
      className="absolute top-3 left-3 z-[400] flex flex-col gap-1.5"
      // Tugma bosilganda xarita ham siljib/kattalashib ketmasligi kerak.
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <div className="overflow-hidden rounded-lg surface shadow-[0_0_0_1px_rgb(16_42_76/0.08),0_1px_2px_rgb(16_42_76/0.06)]">
        <ZoomButton direction="in" />
        <span className="block h-px bg-line" />
        <ZoomButton direction="out" />
      </div>
      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label={fullscreen ? 'Oddiy ko‘rinish' : 'To‘liq ekran'}
        className="grid size-7 place-items-center rounded-lg surface text-muted shadow-[0_0_0_1px_rgb(16_42_76/0.08),0_1px_2px_rgb(16_42_76/0.06)] transition-colors hover:text-strong"
      >
        {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </button>
    </div>
  );
}

function ZoomButton({ direction }: { direction: 'in' | 'out' }) {
  const map = useMap();

  return (
    <button
      type="button"
      aria-label={direction === 'in' ? 'Kattalashtirish' : 'Kichiklashtirish'}
      onClick={() => (direction === 'in' ? map.zoomIn() : map.zoomOut())}
      className="grid size-7 place-items-center text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
    >
      {direction === 'in' ? <Plus className="size-3.5" /> : <Minus className="size-3.5" />}
    </button>
  );
}
