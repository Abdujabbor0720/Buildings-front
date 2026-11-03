import L from 'leaflet';
import { Crosshair, LocateFixed, MapPin, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON as GeoJsonLayer, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import toast from 'react-hot-toast';
import { useDistrictGeoJson } from '@/shared/api/queries';
import { BASEMAP_ATTRIBUTION, BASEMAP_URL, HAS_BASEMAP } from '@/shared/constants/basemap';
import { cn } from '@/shared/utils/cn';

interface Props {
  /** Joriy qiymat — MATN, chunki forma holati matnda saqlanadi. */
  lat: string;
  lng: string;
  /** Bo‘sh satr — koordinata tozalandi. */
  onChange: (lat: string, lng: string) => void;
  /** Tanlangan tuman — xaritada ajratib ko‘rsatiladi va shunga markazlashadi. */
  districtId?: string;
  disabled?: boolean;
  /**
   * FAQAT KO‘RSATISH. Tahrirlash boshqaruvlari (tozalash, joylashuvim,
   * «nuqtani bosing» ko‘rsatmasi) chiqmaydi, lekin xarita surilади va
   * masshtablanadi — obyekt qayerdaligini ko‘rish uchun shu kerak.
   */
  readOnly?: boolean;
  heightClass?: string;
}

/**
 * XARITADAN JOYLASHUV TANLASH.
 *
 * ⚠️ FON XARITASI (ko‘cha plitkalari) SHART EMAS. `VITE_BASEMAP_URL`
 * sozlanmagan bo‘lsa, orqa fonda TUMAN CHEGARALARI chiziladi va tanlangan
 * tuman ajratib ko‘rsatiladi. Busiz xarita bo‘m-bo‘sh oq maydon bo‘lib
 * qolardi va unga nuqta qo‘yishning ma’nosi bo‘lmasdi.
 *
 * ⚠️ Koordinata 6 xonagacha YAXLITLANADI (≈ 11 sm). Leaflet 15 xonali
 * son qaytaradi; u maydonga tushganda `40.80119999999998` ko‘rinib,
 * foydalanuvchida «tizim buzuq» taassurotini qoldirardi.
 */
const PRECISION = 6;

/** Andijon viloyati — chegara ma’lumoti kelmaguncha boshlang‘ich ko‘rinish. */
const FALLBACK_CENTER: [number, number] = [40.7821, 72.3442];
const FALLBACK_ZOOM = 9;

const round = (value: number) => Number(value.toFixed(PRECISION));

export function LocationPicker({
  lat,
  lng,
  onChange,
  districtId,
  disabled,
  readOnly,
  heightClass = 'h-[280px]',
}: Props) {
  const { data: geojson } = useDistrictGeoJson({});

  const position = useMemo<[number, number] | null>(() => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (!lat.trim() || !lng.trim()) return null;
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return null;
    if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return null;
    return [parsedLat, parsedLng];
  }, [lat, lng]);

  const bounds = useMemo<L.LatLngBoundsExpression | undefined>(() => {
    if (!geojson?.bbox || geojson.bbox.length < 4) return undefined;
    const [minLng, minLat, maxLng, maxLat] = geojson.bbox;
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [geojson]);

  const set = useCallback(
    (next: L.LatLng) => {
      if (disabled || readOnly) return;
      onChange(String(round(next.lat)), String(round(next.lng)));
    },
    [disabled, onChange, readOnly],
  );

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'surface-muted relative overflow-hidden rounded-xl shadow-[inset_0_0_0_1px_rgb(16_42_76/0.06)]',
          heightClass,
          disabled && 'pointer-events-none opacity-60',
        )}
      >
        <MapContainer
          center={FALLBACK_CENTER}
          zoom={FALLBACK_ZOOM}
          bounds={bounds}
          boundsOptions={{ padding: [16, 16] }}
          zoomControl={false}
          attributionControl={HAS_BASEMAP}
          zoomSnap={0}
          zoomDelta={0.4}
          className="size-full"
          style={{ background: 'transparent' }}
        >
          {HAS_BASEMAP ? <TileLayer url={BASEMAP_URL!} attribution={BASEMAP_ATTRIBUTION} /> : null}

          <DistrictBackdrop geojson={geojson} districtId={districtId} />

          <ClickCatcher onPick={set} />

          {position ? (
            <Marker
              position={position}
              draggable={!disabled && !readOnly}
              eventHandlers={{
                dragend: (event) => set((event.target as L.Marker).getLatLng()),
              }}
              icon={PIN_ICON}
            />
          ) : null}

          <Recenter position={position} bounds={bounds} />
          <SizeKeeper />
        </MapContainer>

        {/* ⚠️ Ko‘rsatma xarita USTIDA turadi va nuqta qo‘yilgach yo‘qoladi:
            bo‘sh xaritada «nima qilish kerak» degan savol javobsiz
            qolmasligi, to‘ldirilgandan keyin esa ko‘rinishni to‘smasligi
            kerak. */}
        {!position && !readOnly ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/55 to-transparent px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-meta font-medium text-white">
              <Crosshair className="size-3.5" />
              Obyekt joylashgan nuqtani xaritadan bosing
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-micro text-muted">
          {position ? (
            <>
              {readOnly ? 'Koordinata: ' : 'Tanlangan nuqta: '}
              <span className="num font-medium text-strong">
                {position[0].toFixed(PRECISION)}, {position[1].toFixed(PRECISION)}
              </span>
            </>
          ) : (
            'Nuqta belgilanmagan — obyekt xaritada ko‘rinmaydi'
          )}
        </p>

        <div className={cn('flex items-center gap-1.5', readOnly && 'hidden')}>
          <GeolocateButton disabled={disabled} onLocate={(lt, lg) => onChange(String(round(lt)), String(round(lg)))} />
          {position ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('', '')}
              className="inline-flex items-center gap-1 rounded-lg surface-muted px-2 py-1 text-micro font-medium text-muted transition-colors hover:text-danger-600 disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Tozalash
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const PIN_ICON = L.divIcon({
  className: '',
  html:
    '<span style="display:block;width:26px;height:26px;margin:-26px 0 0 -13px;' +
    'border-radius:50% 50% 50% 0;transform:rotate(-45deg);' +
    'background:var(--color-brand-500);box-shadow:0 2px 6px rgb(16 42 76 / .45)">' +
    '<span style="display:block;width:9px;height:9px;margin:8.5px;border-radius:50%;background:#fff"></span>' +
    '</span>',
  iconSize: [0, 0],
});

/** Xaritaning istalgan nuqtasiga bosish — nuqta qo‘yadi yoki ko‘chiradi. */
function ClickCatcher({ onPick }: { onPick: (latlng: L.LatLng) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng) });
  return null;
}

/**
 * ⚠️ Xarita FAQAT birinchi marta va nuqta TASHQARIDAN o‘zgarganda
 * markazlashadi. Har renderda `setView` chaqirilsa, foydalanuvchi
 * xaritani surgan zahoti u joyiga qaytib, surish umuman ishlamasdi.
 */
function Recenter({
  position,
  bounds,
}: {
  position: [number, number] | null;
  bounds: L.LatLngBoundsExpression | undefined;
}) {
  const map = useMap();
  const applied = useRef<string | null>(null);

  useEffect(() => {
    if (!position) {
      if (applied.current === null && bounds) map.fitBounds(bounds, { padding: [16, 16] });
      return;
    }
    const key = position.join(',');
    if (applied.current === key) return;
    // Birinchi nuqta qo‘yilganda yaqinlashtiriladi; keyingi tuzatishlarda
    // joriy masshtab saqlanadi — odam qayerga qaraganini yo‘qotmasin.
    const zoom = applied.current === null ? Math.max(map.getZoom(), 13) : map.getZoom();
    map.setView(position, zoom, { animate: applied.current !== null });
    applied.current = key;
  }, [bounds, map, position]);

  return null;
}

/**
 * XARITA O‘LCHAMINI QAYTA O‘LCHASH.
 *
 * ⚠️ MAJBURIY: picker MODAL ichida ochiladi va Headless UI oynani
 * `scale(0.98) → scale(1)` bilan chiqaradi. Leaflet o‘z o‘lchamini
 * YARATILGAN PAYTDA bir marta o‘lchaydi va keshlaydi — ya’ni u
 * animatsiya o‘rtasidagi KICHRAYTIRILGAN o‘lchamni eslab qoladi.
 * Natijada xarita konteynerga to‘liq sig‘maydi va bosilgan nuqta
 * koordinatasi bir necha piksel surilgan bo‘lib chiqadi.
 *
 * `ResizeObserver` bu holatni animatsiya tugaganda ham, oyna
 * kattalashganda ham bir xil hal qiladi — qo‘lda qo‘yilgan
 * `setTimeout` esa sekin qurilmada kechikib qolardi.
 */
function SizeKeeper() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/** Tuman chegaralari — fon xaritasi o‘rnida yo‘naltiruvchi qatlam. */
function DistrictBackdrop({
  geojson,
  districtId,
}: {
  geojson: ReturnType<typeof useDistrictGeoJson>['data'];
  districtId?: string;
}) {
  if (!geojson) return null;
  return (
    <GeoJsonLayer
      // ⚠️ `key` da tanlangan tuman bor: Leaflet GeoJSON qatlami `style`
      // o‘zgarganda o‘zini qayta chizmaydi va tuman almashganda ajratish
      // eski tumanda qolib ketardi.
      key={`${geojson.features.length}:${districtId ?? ''}`}
      data={geojson as unknown as GeoJSON.GeoJsonObject}
      interactive={false}
      style={(feature) => {
        const selected = feature?.properties?.districtId === districtId;
        return {
          color: selected ? 'var(--color-brand-500)' : 'rgb(148 166 189 / .75)',
          weight: selected ? 2 : 1,
          fillColor: selected ? 'var(--color-brand-500)' : 'rgb(148 166 189 / 1)',
          fillOpacity: selected ? 0.12 : 0.05,
        };
      }}
    />
  );
}

/**
 * «Men shu yerdaman» — maydondagi xodim uchun.
 *
 * ⚠️ Brauzer joylashuvi FAQAT HTTPS da ishlaydi va foydalanuvchi ruxsat
 * berishi kerak. Rad etilgan holat JIM qolmaydi — aks holda tugma
 * «buzuq» bo‘lib ko‘rinardi.
 */
function GeolocateButton({
  onLocate,
  disabled,
}: {
  onLocate: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  if (typeof navigator === 'undefined' || !navigator.geolocation) return null;

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => {
        setBusy(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setBusy(false);
            onLocate(pos.coords.latitude, pos.coords.longitude);
          },
          (error) => {
            setBusy(false);
            toast.error(
              error.code === error.PERMISSION_DENIED
                ? 'Joylashuvga ruxsat berilmadi — nuqtani xaritadan qo‘lda belgilang'
                : 'Joylashuvni aniqlab bo‘lmadi — nuqtani xaritadan qo‘lda belgilang',
            );
          },
          { enableHighAccuracy: true, timeout: 10_000 },
        );
      }}
      className="inline-flex items-center gap-1 rounded-lg surface-muted px-2 py-1 text-micro font-medium text-muted transition-colors hover:text-brand-600 disabled:opacity-50"
    >
      {busy ? <LocateFixed className="size-3 animate-pulse" /> : <MapPin className="size-3" />}
      Hozirgi joylashuvim
    </button>
  );
}
