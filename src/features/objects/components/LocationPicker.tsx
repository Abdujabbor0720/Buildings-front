import L from 'leaflet';
import { Crosshair, Loader2, MapPin, Minus, Plus, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  GeoJSON as GeoJsonLayer,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import toast from 'react-hot-toast';
import { reverseGeocode, searchPlaces, type GeoPlace } from '@/shared/api/geocode';
import { useDistrictGeoJson } from '@/shared/api/queries';
import {
  BASEMAP_ATTRIBUTION,
  BASEMAP_MAX_ZOOM,
  BASEMAP_URL,
  HAS_BASEMAP,
} from '@/shared/constants/basemap';
import { useDebounce } from '@/shared/hooks/useDebounce';
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
   * FAQAT KO‘RSATISH. Tahrirlash boshqaruvlari (qidiruv, tozalash,
   * joylashuvim) chiqmaydi, lekin xarita suriladi va masshtablanadi.
   */
  readOnly?: boolean;
  heightClass?: string;
}

/**
 * XARITADAN JOYLASHUV TANLASH — messenjerlardagi kabi.
 *
 * Uch yo‘l bilan nuqta qo‘yiladi:
 *   1. manzil bo‘yicha qidirish («Baliqchi tumani Navoiy ko‘chasi»);
 *   2. xaritani bosish yoki nishonni surish;
 *   3. qurilmaning o‘z joylashuvi («Hozirgi joylashuvim»).
 *
 * ⚠️ FON XARITASI (ko‘chalar) ENDI MAJBURIY qism, bezak emas: bo‘m-bo‘sh
 * ko‘pburchak ustiga maktab nuqtasini aniq qo‘yib bo‘lmaydi. Agar
 * plitka serveri yopiq bo‘lsa, ostidagi tuman chegaralari qatlami
 * baribir chiziladi va tanlash ishlayveradi.
 *
 * ⚠️ Koordinata 6 xonagacha YAXLITLANADI (≈ 11 sm). Leaflet 15 xonali
 * son qaytaradi; u maydonga tushganda `40.80119999999998` ko‘rinib,
 * foydalanuvchida «tizim buzuq» taassurotini qoldirardi.
 */
const PRECISION = 6;

/** Andijon viloyati — chegara ma’lumoti kelmaguncha boshlang‘ich ko‘rinish. */
const FALLBACK_CENTER: [number, number] = [40.7821, 72.3442];
const FALLBACK_ZOOM = 9;

/** Qidiruvdan tanlangan manzilga shu darajada yaqinlashiladi. */
const PICK_ZOOM = 16;

const round = (value: number) => Number(value.toFixed(PRECISION));

export function LocationPicker({
  lat,
  lng,
  onChange,
  districtId,
  disabled,
  readOnly,
  heightClass = 'h-[300px]',
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

  /** Qidiruvni viloyatga yaqinlashtirish uchun to‘rtburchak. */
  const viewbox = useMemo<[number, number, number, number] | undefined>(() => {
    if (!geojson?.bbox || geojson.bbox.length < 4) return undefined;
    const [minLng, minLat, maxLng, maxLat] = geojson.bbox;
    return [minLng, maxLat, maxLng, minLat];
  }, [geojson]);

  const set = useCallback(
    (next: L.LatLng) => {
      if (disabled || readOnly) return;
      onChange(String(round(next.lat)), String(round(next.lng)));
    },
    [disabled, onChange, readOnly],
  );

  /* ───── Nuqtaning manzili ───── */
  /*
   * ⚠️ Natija NUQTAGA BOG‘LAB saqlanadi (`key`), alohida `null` ga
   * tozalanmaydi. Effekt ichida sinxron `setState` chaqirilsa,
   * React ortiqcha render boshlaydi va bir lahzaga ESKI nuqtaning
   * manzili yangi koordinata yonida turib qolardi.
   */
  const positionKey = position ? position.join(',') : '';
  const [resolved, setResolved] = useState<{ key: string; text: string | null }>({
    key: '',
    text: null,
  });
  const address = resolved.key === positionKey ? resolved.text : null;

  useEffect(() => {
    if (!position) return;
    const controller = new AbortController();
    // ⚠️ Kechiktirish MAJBURIY: nishonni surganda `position` har
    // kadrada o‘zgaradi va xizmatga o‘nlab so‘rov ketardi.
    const timer = setTimeout(() => {
      void reverseGeocode(position[0], position[1], controller.signal).then((text) => {
        if (!controller.signal.aborted) setResolved({ key: positionKey, text });
      });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [position, positionKey]);

  return (
    <div className="space-y-2">
      {!readOnly ? (
        <AddressSearch viewbox={viewbox} disabled={disabled} onPick={(place) => onChange(String(round(place.lat)), String(round(place.lng)))} />
      ) : null}

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
          maxZoom={BASEMAP_MAX_ZOOM}
          zoomControl={false}
          attributionControl={HAS_BASEMAP}
          zoomSnap={0}
          zoomDelta={0.4}
          className="size-full"
          style={{ background: 'transparent' }}
        >
          {HAS_BASEMAP ? (
            <TileLayer
              url={BASEMAP_URL!}
              attribution={BASEMAP_ATTRIBUTION}
              maxZoom={BASEMAP_MAX_ZOOM}
            />
          ) : null}

          <DistrictBackdrop geojson={geojson} districtId={districtId} dimmed={HAS_BASEMAP} />

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
          {!readOnly ? <ZoomButtons /> : null}
        </MapContainer>

        {/* ⚠️ Ko‘rsatma xarita USTIDA turadi va nuqta qo‘yilgach
            yo‘qoladi: bo‘sh xaritada «nima qilish kerak» degan savol
            javobsiz qolmasligi, to‘ldirilgandan keyin esa ko‘rinishni
            to‘smasligi kerak. */}
        {!position && !readOnly ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[400] bg-gradient-to-t from-neutral-950/60 to-transparent px-3 pt-6 pb-2.5">
            <p className="flex items-center gap-1.5 text-meta font-medium text-white">
              <Crosshair className="size-3.5" />
              Obyekt joylashgan nuqtani xaritadan bosing yoki manzilni qidiring
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
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
          {/* ⚠️ Topilgan manzil FAQAT tekshirish uchun ko‘rsatiladi va
              «Manzil» maydoniga O‘Z-O‘ZIDAN yozilmaydi: u rasmiy
              hujjatdagi manzil bo‘lishi kerak, xarita xizmatining
              taxmini emas. */}
          {position && address ? (
            <p className="mt-0.5 line-clamp-2 text-nano text-muted" title={address}>
              {address}
            </p>
          ) : null}
        </div>

        <div className={cn('flex shrink-0 items-center gap-1.5', readOnly && 'hidden')}>
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

/* ───────────────────────── Manzil qidiruvi ───────────────────────── */

function AddressSearch({
  viewbox,
  disabled,
  onPick,
}: {
  viewbox?: [number, number, number, number];
  disabled?: boolean;
  onPick: (place: GeoPlace) => void;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const debounced = useDebounce(query, 450);
  const term = debounced.trim();

  /*
   * ⚠️ Natija SO‘ROV MATNIGA bog‘lab saqlanadi. Alohida `results` va
   * `busy` holatlari bo‘lganda, ular effekt ichida sinxron
   * tozalanar va yozilgan matn bilan ekrandagi ro‘yxat bir lahzaga
   * MOS KELMAY qolardi («Baliqchi» yozilgan, «Bal» natijalari
   * turibdi). Endi ikkalasi bitta qiymatdan kelib chiqadi.
   */
  const [fetched, setFetched] = useState<{ term: string; items: GeoPlace[] } | null>(null);
  const ready = fetched?.term === term;
  const results = ready ? fetched.items : [];
  const busy = term.length >= 3 && !ready;

  useEffect(() => {
    if (term.length < 3) return;
    const controller = new AbortController();
    void searchPlaces(term, { signal: controller.signal, viewbox }).then((items) => {
      if (!controller.signal.aborted) setFetched({ term, items });
    });
    return () => controller.abort();
  }, [term, viewbox]);

  const empty = open && ready && term.length >= 3 && results.length === 0;

  return (
    <div className="relative">
      <span className="text-faint pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
      </span>
      <input
        type="text"
        value={query}
        disabled={disabled}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Manzil yoki joy nomi bo‘yicha qidirish…"
        className={cn(
          'h-9 w-full rounded-lg surface pr-9 pl-9 text-ui text-strong transition-shadow',
          'shadow-[0_0_0_1px_rgb(16_42_76/0.1)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]',
          'placeholder:text-faint placeholder:font-light',
          'focus:shadow-[0_0_0_1px_var(--color-brand-500),0_0_0_3px_rgb(255_127_0/0.22)] focus:outline-none',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            setFetched(null);
            setOpen(false);
          }}
          aria-label="Qidiruvni tozalash"
          className="text-faint absolute inset-y-0 right-2 my-auto grid size-6 place-items-center rounded-full transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      ) : null}

      {/* ⚠️ `z-[500]`: Leaflet o‘z qatlamlariga 400 gacha z-index beradi
          va ro‘yxat xarita ostida qolib ketardi. */}
      {open && (results.length > 0 || empty) ? (
        <ul className="surface absolute top-full z-[500] mt-1 w-full overflow-hidden rounded-xl shadow-[0_0_0_1px_rgb(16_42_76/0.08),0_12px_28px_-12px_rgb(16_42_76/0.35)]">
          {empty ? (
            <li className="px-3 py-2.5 text-meta text-muted">
              Hech narsa topilmadi — nuqtani xaritadan qo‘lda belgilang
            </li>
          ) : (
            results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(place);
                    setQuery('');
                    setFetched(null);
                    setOpen(false);
                  }}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-white/6"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
                  <span className="min-w-0 flex-1 text-meta leading-snug text-strong">
                    {place.label}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}

/* ───────────────────────── Xarita qismlari ───────────────────────── */

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

/** Kattalashtirish tugmalari — aniq nuqta tanlash uchun shart. */
function ZoomButtons() {
  const map = useMap();
  return (
    <div
      className="absolute top-2.5 left-2.5 z-[400] overflow-hidden rounded-lg surface shadow-[0_0_0_1px_rgb(16_42_76/0.1),0_1px_2px_rgb(16_42_76/0.08)]"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => map.zoomIn()}
        aria-label="Kattalashtirish"
        className="grid size-7 place-items-center text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
      >
        <Plus className="size-3.5" />
      </button>
      <span className="block h-px bg-line" />
      <button
        type="button"
        onClick={() => map.zoomOut()}
        aria-label="Kichiklashtirish"
        className="grid size-7 place-items-center text-muted transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8"
      >
        <Minus className="size-3.5" />
      </button>
    </div>
  );
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
    // Birinchi nuqta qo‘yilganda yaqinlashtiriladi; keyingi
    // tuzatishlarda joriy masshtab saqlanadi — odam qayerga
    // qaraganini yo‘qotmasin.
    const zoom = applied.current === null ? Math.max(map.getZoom(), PICK_ZOOM) : map.getZoom();
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

/** Tuman chegaralari — yo‘naltiruvchi qatlam. */
function DistrictBackdrop({
  geojson,
  districtId,
  dimmed,
}: {
  geojson: ReturnType<typeof useDistrictGeoJson>['data'];
  districtId?: string;
  dimmed: boolean;
}) {
  if (!geojson) return null;
  return (
    <GeoJsonLayer
      // ⚠️ `key` da tanlangan tuman bor: Leaflet GeoJSON qatlami `style`
      // o‘zgarganda o‘zini qayta chizmaydi va tuman almashganda ajratish
      // eski tumanda qolib ketardi.
      key={`${geojson.features.length}:${districtId ?? ''}:${dimmed}`}
      data={geojson as unknown as GeoJSON.GeoJsonObject}
      interactive={false}
      style={(feature) => {
        const selected = feature?.properties?.districtId === districtId;
        // ⚠️ Fon xaritasi ustida chegara YENGIL chiziladi: to‘q
        // to‘ldirish ko‘chalarni ko‘mib, nuqta tanlashni qiyinlashtirardi.
        return {
          color: selected ? 'var(--color-brand-500)' : 'rgb(80 110 150 / .55)',
          weight: selected ? 2 : 1,
          fillColor: selected ? 'var(--color-brand-500)' : 'rgb(148 166 189 / 1)',
          fillOpacity: dimmed ? (selected ? 0.1 : 0) : selected ? 0.12 : 0.05,
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
      {busy ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3" />}
      Hozirgi joylashuvim
    </button>
  );
}
