import L from 'leaflet';
import { Maximize2, Minimize2, Minus, Plus } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON as GeoJsonLayer, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import type {
  DistrictGeoJson,
  DistrictStats,
  MahallaGeoJson,
  MapObjectPoint,
  ObjectHealth,
} from '@/shared/api/types';
import { BASEMAP_ATTRIBUTION, BASEMAP_URL, HAS_BASEMAP } from '@/shared/constants/basemap';
import { HEALTH_LEGEND, HEALTH_META } from '@/shared/constants/health';
import { useChartColors } from '@/shared/hooks/useChartColors';
import { cn } from '@/shared/utils/cn';
import { formatCompact } from '@/shared/utils/money.utils';

interface DistrictMapProps {
  geojson: DistrictGeoJson | MahallaGeoJson | undefined;
  /** Tuman bosilganda — filtrga qo‘shish yoki ro‘yxatga o‘tish. */
  onDistrictClick?: (district: DistrictStats) => void;
  /**
   * XARITA DARAJASI.
   *
   * `region` — viloyat: chegaralar TUMANLAR, yon tomonda qo‘shni
   * viloyatlar yorlig‘i.
   * `district` — tuman: chegaralar MAHALLALAR, qo‘shni viloyat
   * yorliqlari yo‘q (ular bu masshtabda ma’nosiz) va tumanning o‘z
   * konturi qalinroq chiziq bilan chiziladi.
   *
   * ⚠️ Ikkala daraja BITTA komponentda: chegara ma’lumotining shakli
   * (`DistrictStats`) ikkalasida bir xil va ikkinchi xarita yozilsa,
   * rang shkalasi, ko‘rsatma va to‘liq ekran rejimi ikki joyda
   * alohida tuzatilishi kerak bo‘lardi.
   */
  level?: 'region' | 'district';
  /**
   * Obyekt nuqtalari — faqat tuman darajasida.
   *
   * ⚠️ Mahalla chegarasi RANG beradi («bu yerda 3 ta obyekt»), nuqta
   * esa AYNIQSA JOYNI. Chegarasi yo‘q mahalladagi obyekt ham shu
   * nuqtalar orqali ko‘rinadi va hisobdan tushib qolmaydi.
   */
  objects?: MapObjectPoint[];
  /** Tumanning o‘z konturi — mahalla chegaralari ustidan chiziladi. */
  outline?: GeoJSON.Geometry | null;
  /**
   * TUMANNING O‘Z YIG‘INDISI — mahalla chegarasi YO‘Q tuman uchun.
   *
   * ⚠️ Bunday tumanda ko‘rsatkich ko‘pburchagi tumanning O‘ZI bo‘ladi,
   * ya‘ni unga ham viloyat kesimidagi tumanlar kabi sanoq belgisi,
   * nom yorlig‘i va ko‘rsatma kerak. Busiz tuman kesimi «rangli dog‘»
   * bo‘lib qolardi: ekranda bir nechta nuqta bor-u, nechta obyekt
   * borligi va tuman qanday ahvolda ekani hech qayerda yozilmagan.
   */
  outlineStats?: DistrictStats | null;
  /**
   * CHEGARA NOMLARI HAR DOIM YOZILSINMI.
   *
   * ⚠️ Mahalla kesimida nom faqat obyekti ko‘p chegarada yoziladi:
   * bitta tumanda to‘qsondan ortiq mahalla bo‘ladi va ularning
   * yorliqlari bir-birining ustiga tushardi. AHOLI PUNKTI kesimida
   * esa aksincha — chegaralar yigirmatacha va nom YAGONA tanish
   * belgidir: «Oqtom», «Zulfiqor» degan yozuvsiz hokim ko‘k dog‘ning
   * qayer ekanini bilmaydi. Serverda esa aynan shu nomlar mo‘ljal
   * yozuvlaridan OLIB TASHLANGAN (takror bo‘lmasin deb), ya‘ni nom
   * bu yerda yozilmasa, u umuman yo‘qoladi.
   */
  labelAreas?: boolean;
  /**
   * MO‘LJAL YOZUVLARI — shahar, shaharcha, qishloq nomlari.
   *
   * ⚠️ Chegarasi yo‘q tumanda BU YAGONA mo‘ljal: usiz xarita
   * bo‘m-bo‘sh ko‘pburchakka aylanadi va obyekt nuqtalari qayerda
   * ekani bilinmaydi.
   */
  settlements?: Array<{ name: string; kind: string; rank: number; lat: number; lng: number }>;
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
  level = 'region',
  objects,
  outline,
  outlineStats,
  labelAreas = false,
  settlements,
  showTiles = false,
  className,
  heightClass = 'h-[300px]',
}: DistrictMapProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const navigate = useNavigate();
  const palette = useChartColors();

  /*
   * ⚠️ BOG'LIQLIK — QIYMAT, MASSIV IDENTIFIKATORI EMAS.
   *
   * `geojson.bbox` — serverdan kelgan massiv va react-query har
   * yangilanishda YANGI massiv qaytaradi (qiymati o'sha bo'lsa ham).
   * Ilgari `useMemo` aynan shu identifikatorga bog'langan edi:
   * fonda bitta qayta so'rov ketishi bilan `bounds` «o'zgargan»
   * hisoblanib, xarita avtomatik `fitBounds` qilardi va
   * FOYDALANUVCHI KATTALASHTIRGAN ko'rinish o'z-o'zidan orqaga
   * qaytardi — zoom tugmasi «ishlamayotgandek» tuyulardi.
   */
  const bboxKey = geojson?.bbox?.join(',') ?? '';
  const bounds = useMemo<L.LatLngBoundsExpression | undefined>(() => {
    const bbox = bboxKey ? bboxKey.split(',').map(Number) : [];
    if (bbox.length < 4 || bbox.some((n) => !Number.isFinite(n))) return undefined;
    const [minLng, minLat, maxLng, maxLat] = bbox;
    return [
      [minLat, minLng],
      [maxLat, maxLng],
    ];
  }, [bboxKey]);

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

  /*
   * MAHALLA CHEGARALARI UMUMAN BORMI.
   *
   * ⚠️ OpenStreetMap'da mahalla (MFY) chegaralari HAMMA tumanda ham
   * yo'q. Bunday tumanda xarita faqat obyekt nuqtalaridan iborat
   * bo'lib qolardi: oq fon ustida o'nta rangli nuqta — hokim ular
   * qayerda ekanini umuman tushunmasdi.
   *
   * ⚠️ Bu holatda SOXTA chegara chizilmaydi (`andijon-mahallas.geojson`
   * izohidagi qaror). Buning o'rniga ikkita haqiqiy narsa ko'rsatiladi:
   * tumanning O'Z konturi to'ldirib beriladi va ostiga FON XARITASI
   * (ko'chalar, qishloqlar) qo'yiladi — nuqta endi bo'shliqda emas,
   * ko'cha ustida turadi.
   */
  const hasAreas = geojson.features.some((feature) => Boolean(feature.geometry));
  const bareDistrict = level === 'district' && !hasAreas;

  return (
    <div
      className={cn(
        // ⚠️ Fon YASSI kulrang emas: yuqoridan pastga juda yupqa ko'k
        // o'tish. Xarita poligonlari ham ko'kish bo'lgani uchun yassi
        // kulrang maydon ular ostida «qog'oz varaq» bo'lib turardi;
        // o'tish bilan esa idish xaritaning o'z muhitiga aylanadi.
        'surface-muted relative overflow-hidden rounded-xl',
        'bg-[linear-gradient(180deg,rgb(10_108_240/0.05)_0%,rgb(10_108_240/0.012)_55%,rgb(10_108_240/0)_100%)]',
        'shadow-[inset_0_0_0_1px_rgb(16_42_76/0.07),inset_0_1px_3px_rgb(16_42_76/0.05)]',
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
        {/* ⚠️ FON PLITKASI TUMAN KO'RINISHIDA HAM CHIZILMAYDI.
            Ilgari chegarasi yo'q tumanda u yoqilardi va ekran birdan
            boshqa xaritaga — kulrang OSM rastriga — aylanib qolardi;
            viloyat ko'rinishidagi ko'k dizayn bilan hech qanday
            aloqasi yo'q edi. Endi tuman ham AYNI dizaynda chiziladi:
            ko'k ko'pburchak, nom yorlig'i, son belgisi va mo'ljal
            yozuvlari. */}
        {showTiles && HAS_BASEMAP ? (
          <TileLayer url={BASEMAP_URL!} attribution={BASEMAP_ATTRIBUTION} />
        ) : null}

        <DistrictLayer
          geojson={geojson}
          onSelect={handleClick}
          palette={palette}
          level={level}
          labelAreas={labelAreas}
        />

        {/* ⚠️ Tuman konturi chegaralar USTIDAN chiziladi va bosilmaydi
            (`interactive={false}`): mahallalar tumanni to‘liq
            qoplamaydi va kontursiz tumanning chekkasi qayerda
            tugashi umuman bilinmasdi. */}
        {outline ? (
          <GeoJsonLayer
            /* ⚠️ `key` ichida rang manbai ham bor: Leaflet GeoJSON
               qatlami `style` o‘zgarganda o‘zini qayta chizmaydi va
               filtr almashganda tuman eski rangida qolib ketardi. */
            key={`district-outline:${bareDistrict ? (outlineStats?.total ?? 0) : 'plain'}:${palette.dark ? 'd' : 'l'}`}
            data={outline as GeoJSON.Geometry}
            /* ⚠️ Mahalla chegarasi YO‘Q tumanda kontur BOSILADI va
               ko‘rsatma beradi — u endi shunchaki ramka emas, xaritaning
               YAGONA ko‘rsatkich ko‘pburchagi. Mahallalari bor tumanda
               esa avvalgidek o‘tkazib yuboriladi: ostidagi mahallani
               bosish kerak. */
            interactive={bareDistrict}
            eventHandlers={
              bareDistrict && outlineStats
                ? { click: () => navigate(`/objects?districtIds=${outlineStats.districtId}`) }
                : undefined
            }
            onEachFeature={
              bareDistrict && outlineStats
                ? (_feature, layer) => {
                    layer.bindTooltip(tooltipHtml(outlineStats, palette), {
                      sticky: true,
                      direction: 'top',
                      opacity: 1,
                      className: '!border-0 !bg-transparent !p-0 !shadow-none',
                    });
                  }
                : undefined
            }
            style={{
              /* ⚠️ MAHALLA CHEGARASI BO'LMASA — tuman O'ZI ko'rsatkich
                 ko'pburchagi bo'ladi: viloyat xaritasidagi tumanlar
                 bilan AYNI shkaladan rang oladi (`densityHex`), yaxlit
                 oq chiziq bilan ajraladi va to'liq to'ldiriladi.
                 Shunda tuman kesimi viloyat kesimi bilan bir xil
                 dizaynda ko'rinadi — faqat masshtab boshqacha. */
              color: bareDistrict
                ? palette.dark
                  ? '#0d1721'
                  : '#ffffff'
                : palette.dark
                  ? '#7f9ec9'
                  : '#35465a',
              weight: bareDistrict ? 1.5 : 2,
              fill: bareDistrict,
              /* ⚠️ Zichlik rangi TUMAN YIG‘INDISIDAN olinadi, xaritadagi
                 nuqtalar sonidan emas: koordinatasi yo‘q obyekt nuqta
                 bo‘lib chizilmaydi, lekin u ham shu tumanniki — aks
                 holda xarita rangi yonidagi jadvaldagi sondan past
                 zinapoyani ko‘rsatardi. */
              fillColor: palette.densityHex(outlineStats?.total ?? objects?.length ?? 0),
              fillOpacity: bareDistrict ? 1 : 0,
              dashArray: bareDistrict ? undefined : '4 3',
            }}
          />
        ) : null}

        {/*
          TUMANNING O‘Z BELGISI — faqat mahalla chegarasi yo‘q tumanda.

          ⚠️ Viloyat kesimidagi tuman belgisi bilan AYNI funksiyadan
          chiziladi (`statMarkerIcon`): hokim viloyatdan tumanga
          o‘tganda belgining shakli, o‘lchami va rangi o‘zgarmaydi —
          faqat masshtab kattalashadi.
        */}
        {bareDistrict && outlineStats ? (
          <Marker
            position={[outlineStats.centerLat, outlineStats.centerLng]}
            eventHandlers={{ click: () => handleClick(outlineStats) }}
            zIndexOffset={400}
            icon={statMarkerIcon(outlineStats, palette, {
              size: 30,
              showName: true,
              nameText: outlineStats.name,
            })}
          />
        ) : null}

        {/*
          MO‘LJAL YOZUVLARI — chegarasi yo‘q tumanda YAGONA orientir.
          ⚠️ Faqat tuman ko‘rinishida: viloyat xaritasida 425 ta qishloq
          nomi bir-birining ustiga tushib, tumanlarni butunlay yopib
          qo‘yardi.
        */}
        {level === 'district'
          ? (settlements ?? [])
              /* ⚠️ Eng mayda punktlar (`hamlet`) faqat TO‘LIQ EKRANDA:
                 oddiy kartada ular yozuvlar to‘riga aylanib, obyekt
                 belgilarini yopib qo‘yardi. */
              .filter((place) => (fullscreen ? place.rank <= 4 : place.rank <= 3))
              .map((place) => (
                <Marker
                  key={`${place.name}-${place.lat}-${place.lng}`}
                  position={[place.lat, place.lng]}
                  /* ⚠️ Bosilmaydi: yozuv ostidagi mahalla yoki obyekt
                     bosilishi kerak, yorliq esa faqat o‘qish uchun. */
                  interactive={false}
                  zIndexOffset={-200}
                  icon={settlementIcon(place, palette)}
                />
              ))
          : null}

        {objects?.map((object) => (
          <Marker
            key={object.id}
            position={[object.lat, object.lng]}
            eventHandlers={{ click: () => navigate(`/objects/${object.id}`) }}
            icon={objectIcon(object, palette)}
          />
        ))}

        {level === 'region'
          ? NEIGHBOURS.map((neighbour) => (
              <Marker
                key={neighbour.label}
                position={neighbour.position}
                interactive={false}
                icon={L.divIcon({
                  className: '',
                  html: `<span style="white-space:nowrap;font:500 11px/1.4 var(--font-sans);color:var(--ink-faint)">${esc(neighbour.label)}</span>`,
                  iconSize: [0, 0],
                })}
              />
            ))
          : null}

        {/* ⚠️ `viewKey` — ko'rinish identifikatori. O'zgarganda
            (viloyat ↔ tuman, to'liq ekran) avtomatik moslash
            tiklanadi; o'zgarmasa, foydalanuvchi zoomi saqlanadi. */}
        <BoundsKeeper bounds={bounds} viewKey={`${level}:${bboxKey}:${fullscreen}`} />

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
    /* ⚠️ Afsona ixcham (10px, 1.5px oraliq): u karta sarlavhasi
       qatorida turadi va kengroq bo‘lsa sarlavhani «Andij…» ga
       qisqartirib yuborardi. */
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {HEALTH_LEGEND.map((health) => (
        <span key={health} className="flex items-center gap-1 text-nano text-muted">
          {/* Holat belgisi — DOIRA (turkum belgisi kvadrat). */}
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: palette.statusHex(HEALTH_META[health]) }}
          />
          {LEGEND_LABELS[health]}
        </span>
      ))}
    </div>
  );
}

/**
 * HTML ga qo‘yiladigan matnni QOCHIRADI.
 *
 * ⚠️ Leaflet `divIcon` va `bindTooltip` HTML SATRINI talab qiladi —
 * React bu yerda ishlamaydi va avtomatik qochirish YO‘Q. Tuman nomlari
 * hozir faqat seed’dan keladi, lekin ular bir kun tahrirlanadigan
 * bo‘lsa, `<img src=x onerror=…>` nomli tuman xaritada ishga tushardi.
 * Qochirish arzon va butun xavf sinfini yopadi.
 */
function esc(value: string | number): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
/**
 * NOMI KO‘RSATILMAYDIGAN TUMANLAR.
 *
 * ⚠️ Andijon shahri, Asaka, Xonobod kabi KICHIK tumanlar viloyat
 * markazida zich joylashgan va ularning nom yorliqlari bir-birining
 * ustiga tushib, «Itinko‘l idj» kabi o‘qib bo‘lmas aralashma hosil
 * qilardi. Eng kichik choraki uchun faqat SANOQ doirasi qoldiriladi —
 * nom ko‘rsatma (tooltip) da va yonidagi jadvalda baribir bor.
 *
 * ⚠️ Chegara MAYDON bo‘yicha, obyektlar soni bo‘yicha EMAS: masala
 * joyning yetishmasligida, muhimlikda emas.
 */
function crowdedDistricts(
  features: DistrictGeoJson['features'] | MahallaGeoJson['features'],
): Set<string> {
  const spans = features
    .map((feature) => ({
      id: feature.properties.districtId,
      span: bboxSpan(feature.geometry),
    }))
    .sort((a, b) => a.span - b.span);

  const hidden = Math.floor(spans.length / 4);
  return new Set(spans.slice(0, hidden).map((item) => item.id));
}

/**
 * OBYEKT NUQTASI — tuman xaritasidagi kichik doira.
 *
 * ⚠️ Mahalla pufakchasidan ANCHA kichik (10px va 24–30px) va oq
 * halqali: ikkalasi bir xil o‘lchamda bo‘lsa, «bu mahallada 3 ta
 * obyekt» degan son bilan «mana shu bitta obyekt» degan nuqta
 * aralashib ketardi.
 *
 * ⚠️ Rang — HOLAT rangi, mahalla chegarasining zichlik rangi EMAS:
 * nuqta «qayerda» degan savolga emas, «ahvoli qanday» degan savolga
 * javob beradi.
 */
function objectIcon(
  object: MapObjectPoint,
  palette: ReturnType<typeof useChartColors>,
): L.DivIcon {
  const hex = palette.statusHex(HEALTH_META[object.healthStatus]);

  /*
   * ⚠️ KO‘RSATMA KO‘P QATORLI: nom va foizdan tashqari manzil ham,
   * mas'ul ham bor. Bu nuqta atigi 12px — unga Leaflet `Popup`
   * sig‘maydi va bosilganda obyekt kartasiga o‘tadi; shuning uchun
   * «qayerda va kim javobgar» savoliga javob BROUZER ko‘rsatmasida
   * beriladi.
   *
   * ⚠️ `\n` haqiqiy qator uzilishi sifatida ishlaydi (`title`
   * atributi shuni qo‘llab-quvvatlaydi), `<br>` esa matn bo‘lib
   * ko‘rinib qolardi.
   */
  const tooltip = [
    `${object.name} — ${Math.round(object.progressPercent)}%`,
    object.address ?? 'Manzil kiritilmagan',
    object.responsibleName
      ? `Mas'ul: ${object.responsibleFullName ?? object.responsibleName}${
          object.responsiblePosition ? ` (${object.responsiblePosition})` : ''
        }`
      : "Mas'ul biriktirilmagan",
  ].join('\n');

  return L.divIcon({
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    html: `<span title="${esc(tooltip)}" style="
      display:block;width:12px;height:12px;border-radius:999px;cursor:pointer;
      background:${hex};
      border:2px solid var(--surface);
      box-shadow:0 1px 3px rgba(2,24,58,.4);
    "></span>`,
  });
}

/**
 * MO‘LJAL YOZUVI — belgisiz, faqat matn.
 *
 * ⚠️ Nuqta (marker) QO‘YILMAYDI: xaritada allaqachon obyekt belgilari
 * bor va ikkinchi xil nuqta ular bilan chalkashardi — hokim qishloq
 * belgisini obyekt deb o‘qib qolardi. Yozuvning o‘zi yetarli.
 *
 * ⚠️ Matn atrofida OQ HOSHIYA (`paint-order` + `stroke` o‘rniga
 * `text-shadow`): yozuv har xil to‘qlikdagi ko‘k ko‘pburchak ustida
 * turadi va hoshiyasiz och fonda ham, to‘q fonda ham o‘qilmay
 * qolardi.
 */
function settlementIcon(
  place: { name: string; rank: number },
  palette: ReturnType<typeof useChartColors>,
): L.DivIcon {
  // Shahar — yirikroq va qalinroq; qishloq — mayda.
  const size = place.rank <= 1 ? 12 : place.rank === 2 ? 11 : 10;
  const weight = place.rank <= 2 ? 600 : 500;
  const color = palette.dark ? '#e8eef6' : '#1f3147';
  const halo = palette.dark ? 'rgba(10,16,24,.85)' : 'rgba(255,255,255,.92)';

  return L.divIcon({
    className: '',
    iconSize: [120, 16],
    iconAnchor: [60, 8],
    html: `<span style="
      display:block;width:120px;text-align:center;
      font-size:${size}px;font-weight:${weight};line-height:16px;
      color:${color};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
      text-shadow:0 0 3px ${halo},0 0 3px ${halo},0 0 3px ${halo};
      pointer-events:none;
    ">${esc(place.name)}</span>`,
  });
}

/** Geometriya chegaralovchi to‘rtburchagining yuzasi (daraja²). */
function bboxSpan(geometry: GeoJSON.Geometry | null): number {
  if (!geometry) return 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const visit = (coords: unknown): void => {
    if (Array.isArray(coords) && typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [x, y] = coords as [number, number];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      return;
    }
    if (Array.isArray(coords)) coords.forEach(visit);
  };

  visit((geometry as { coordinates?: unknown }).coordinates);
  if (minX === Infinity) return 0;
  return (maxX - minX) * (maxY - minY);
}

function DistrictLayer({
  geojson,
  onSelect,
  palette,
  level,
  labelAreas,
}: {
  geojson: DistrictGeoJson | MahallaGeoJson;
  onSelect: (district: DistrictStats) => void;
  palette: ReturnType<typeof useChartColors>;
  level: 'region' | 'district';
  labelAreas: boolean;
}) {
  const signature = useMemo(
    () =>
      geojson.features
        .map((f) => `${f.properties.code}:${f.properties.total}:${f.properties.dominantHealth}`)
        .join('|') + (palette.dark ? '|dark' : '|light'),
    [geojson, palette.dark],
  );

  const crowded = useMemo(() => crowdedDistricts(geojson.features), [geojson]);

  /* Qatlamdagi eng katta son — mahalla shkalasi shunga moslanadi
     (`densityHexOf` dagi izohga qarang). */
  const maxTotal = useMemo(
    () => Math.max(1, ...geojson.features.map((f) => f.properties.total)),
    [geojson],
  );

  return (
    <>
      <GeoJsonLayer
        key={signature}
        data={geojson as unknown as GeoJSON.FeatureCollection}
        style={(feature) => {
          const props = feature?.properties as DistrictStats | undefined;
          const total = props?.total ?? 0;
          return {
            /*
             * ⚠️ Mahalla chizig'i OQ emas, ko'kish-kulrang. Obyekti
             * yo'q mahalla deyarli oq bo'ladi va oq chiziq bilan u
             * fonga butunlay singib ketardi — chegarasi bormi yoki
             * yo'qmi, bilib bo'lmasdi.
             */
            color:
              level === 'district'
                ? palette.dark
                  ? '#3a5170'
                  : '#9fb6d4'
                : palette.dark
                  ? '#0d1721'
                  : '#ffffff',
            // Ingichkaroq: mahallalar kichik va yonma-yon turadi,
            // 1.5px li chiziq och to'ldirishni yeb qo'yardi.
            weight: level === 'district' ? 0.7 : 1.5,
            fillColor:
              level === 'district'
                ? palette.densityHexOf(total, maxTotal)
                : palette.densityHex(total),
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
            /* ⚠️ Sichqoncha ketganda chiziq O‘Z qalinligiga qaytadi.
               Ilgari bu yerda `1.5` qotirib yozilgan edi va mahalla
               darajasida (0.7) ustidan o‘tilgan har bir chegara
               ikki baravar qalin bo‘lib QOLARDI — xarita asta-sekin
               «to‘r» ga aylanardi. */
            mouseout: (event) => {
              (event.target as L.Path).setStyle({
                weight: level === 'district' ? 0.7 : 1.5,
                fillOpacity: 1,
              });
            },
          });
          layer.bindTooltip(tooltipHtml(props, palette), { sticky: true, direction: 'top', opacity: 1, className: '!border-0 !bg-transparent !p-0 !shadow-none' });
        }}
      />

      {geojson.features.map((feature) => {
        const props = feature.properties;
        /*
         * ⚠️ MAHALLA darajasida OBYEKTI YO'Q chegara belgilanmaydi.
         * Bitta tumanda 57 tagacha mahalla bor va ularning ko'pida
         * obyekt yo'q: hammasiga «0» yozilgan pufakcha qo'yilsa,
         * xarita nollar to'riga aylanib, haqiqiy raqamlar
         * ko'rinmay qolardi. Bo'sh mahalla RANGI bilan (eng och
         * zinapoya) baribir o'qiladi.
         *
         * ⚠️ Viloyat darajasida esa nol ham ko'rsatiladi: 16 ta
         * tuman kam va «bu tumanda obyekt yo'q» degani — xabar.
         */
        if (level === 'district' && props.total === 0 && !labelAreas) return null;
        /*
         * ⚠️ MAHALLA pufakchasi KICHIKROQ (18–22px, tumanda 24–30px).
         * Bitta tumanda yigirmagacha belgi bo'ladi va ular tuman
         * belgilaridan ancha yaqin turadi: katta pufakcha qo'shnisini
         * yopib qo'yardi. Sonlar ham kichik (1–3), shuning uchun joy
         * yetadi.
         */
        const size =
          level === 'district'
            ? props.total >= 5
              ? 22
              : 18
            : props.total >= 20
              ? 30
              : props.total >= 10
                ? 27
                : 24;
        /*
         * ⚠️ MAHALLA NOMI faqat KENG ekranda (to'liq ekran rejimi) yoki
         * obyekti ko'p mahallada yoziladi. «Mirpo'stin mahallasi» kabi
         * uzun nomlar yigirmata belgi yonma-yon turganda bir-birining
         * ustiga tushib, xaritani butunlay yopib qo'yardi; nomni
         * ko'rsatma (hover) va yonidagi jadval baribir aytadi.
         */
        const showName =
          level === 'district'
            ? labelAreas || props.total >= 3
            : !crowded.has(props.districtId);

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
            /* ⚠️ Obyekti YO‘Q chegarada sanoq doirasi chizilmaydi,
               faqat nom qoladi: «0» yozilgan o‘nlab pufakcha xaritani
               nollar to‘riga aylantirardi, nom esa kerak. */
            icon={statMarkerIcon(props, palette, {
              size,
              showName,
              showCount: props.total > 0,
            })}
          />
        );
      })}
    </>
  );
}

/**
 * SANOQ BELGISI — doira + nom yorlig‘i.
 *
 * ⚠️ BITTA funksiya UCH joyga xizmat qiladi: viloyat kesimidagi tuman,
 * tuman kesimidagi mahalla va mahalla chegarasi yo‘q tumandagi
 * TUMANNING O‘ZI. Ilgari bu markup faqat qatlam ichida, satr ichida
 * yozilgan edi va tumanning o‘z belgisi uchun uni nusxalash kerak
 * bo‘lardi — nusxa esa birinchi tuzatishdayoq asl nusxadan ajralib
 * ketardi (o‘lcham bir joyda o‘zgarib, ikkinchisida qolib).
 */
function statMarkerIcon(
  props: DistrictStats,
  palette: ReturnType<typeof useChartColors>,
  {
    size,
    showName,
    nameText,
    showCount = true,
  }: { size: number; showName: boolean; nameText?: string; showCount?: boolean },
): L.DivIcon {
  const hex = palette.statusHex(HEALTH_META[props.dominantHealth]);
  const label = nameText ?? props.shortName;
  /* ⚠️ Sanoq doirasi YO‘Q bo‘lsa, blok balandligi ham qisqaradi —
     aks holda yorliq ko‘pburchak markazidan pastga siljib qolardi. */
  const height = showCount ? size + 18 : 16;

  return L.divIcon({
    className: '',
    // ⚠️ `iconSize` BELGI kengligi emas, butun blok kengligi: nom
    // doiradan kengroq bo‘ladi va markazlash shunga qarab hisoblanadi.
    // Tor qilib qo‘yilsa, uzun nomli tuman («Qo‘rg‘ontepa») chapga
    // siljib qolardi.
    iconSize: [110, height],
    iconAnchor: [55, height / 2],
    html: `<span style="
        display:flex;flex-direction:column;align-items:center;gap:3px;
        width:110px;cursor:pointer;
      ">
        ${
          showCount
            ? `<span style="
          display:grid;place-items:center;
          width:${size}px;height:${size}px;border-radius:999px;
          /* ⚠️ Yassi doira EMAS: yuqori chapda yupqa yorug'lik
             (radial gradient) — belgi xarita ustida sharsimon bo'lib
             ko'rinadi. Yassi rangli doira poligon bilan bitta
             tekislikda turib, «bo'yoq dog'i» bo'lib ko'rinardi.
             Rang O'ZGARMAYDI — faqat oq alfa. */
          background:
            radial-gradient(120% 120% at 32% 24%, rgba(255,255,255,.34), rgba(255,255,255,0) 58%),
            ${hex};
          color:#fff;
          font:600 ${props.total >= 100 ? 10 : 11.5}px/1 var(--font-sans);
          font-variant-numeric:tabular-nums;
          box-shadow:0 1px 3px rgba(2,24,58,.34),0 4px 10px -4px rgba(2,24,58,.45);
          border:2px solid var(--surface);
        ">${esc(props.total)}</span>`
            : ''
        }
        ${
          showName
            ? `<span style="
          display:inline-block;padding:1px 5px;border-radius:5px;
          background:var(--surface);
          /* Halqa + yumshoq soya: yorliq xarita poligoni ustida turadi
             va faqat 1px halqa bilan u fonga singib ketardi. */
          box-shadow:0 0 0 1px rgb(16 42 76 / .1),0 2px 5px -2px rgba(2,24,58,.3);
          font:600 9.5px/1.35 var(--font-sans);
          color:var(--ink-body);white-space:nowrap;
        ">${esc(label)}</span>`
            : ''
        }
      </span>`,
  });
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

  // ⚠️ `label` va `value` ham qochiriladi: ular hozir doimiy matn va
  // son, lekin funksiya umumiy — kelajakda unga nima berilishini
  // chaqiruv joyi hal qiladi, bu yer esa HTML yig‘adi.
  const row = (label: string, value: string | number, color?: string) =>
    `<div style="display:flex;justify-content:space-between;gap:14px">
       <span style="color:${faint}">${esc(label)}</span>
       <strong style="font-weight:600;font-variant-numeric:tabular-nums;${color ? `color:${color}` : ''}">${esc(value)}</strong>
     </div>`;

  return `<div style="
      min-width:188px;padding:9px 11px;border-radius:10px;
      background:${bg};color:${ink};font:400 11.5px/1.65 var(--font-sans);
      box-shadow:0 10px 26px rgba(10,10,10,.34)
    ">
    <div style="font-weight:600;font-size:12.5px;margin-bottom:6px">${esc(props.name)}</div>
    ${row('Jami obyektlar', props.total)}
    ${row('Reja asosida', props.onSchedule, palette.statusHex(HEALTH_META.on_schedule))}
    ${row('Kechikayotgan', props.delayed, palette.statusHex(HEALTH_META.delayed))}
    ${row('Xavfli', props.atRisk, palette.statusHex(HEALTH_META.at_risk))}
    ${row('O‘rtacha bajarilish', `${props.avgProgress}%`)}
    ${row('Umumiy qiymat', `${formatCompact(props.totalCost)} so‘m`)}
  </div>`;
}

/**
 * KO'RINISHNI MOSLASH — faqat KERAK BO'LGANDA.
 *
 * ⚠️ FOYDALANUVCHI ZOOMI USTUN. Ilgari bu komponent har o'lcham
 * o'zgarishida va har `bounds` yangilanishida `fitBounds` chaqirardi.
 * `ResizeObserver` esa kuzatuv BOSHLANISHIDA ham bir marta ishga
 * tushadi — ya'ni har qayta chizishda xarita o'z-o'zidan boshlang'ich
 * ko'rinishga qaytardi va kattalashtirish «ishlamayotgandek»
 * tuyulardi. Endi odam bir marta zoom qilsa yoki xaritani sursa,
 * avtomatik moslash TO'XTAYDI va faqat ko'rinish almashganda
 * (viloyat ↔ tuman) qayta yoqiladi.
 *
 * ⚠️ `invalidateSize` esa HAR DOIM chaqiriladi: konteyner o'lchami
 * CSS orqali o'zgarganini Leaflet o'zi sezmaydi va xarita yarim
 * bo'sh qolardi. U zoomga tegmaydi.
 */
function BoundsKeeper({
  bounds,
  viewKey,
}: {
  bounds?: L.LatLngBoundsExpression;
  /** Ko'rinish identifikatori: o'zgarsa — avtomatik moslash tiklanadi. */
  viewKey: string;
}) {
  const map = useMap();
  /* ⚠️ `useRef`, `useState` EMAS: qiymat o'zgarishi qayta chizishni
     keltirib chiqarmasligi kerak — aks holda Leaflet hodisasi
     React yangilanishi bilan aralashib, xarita «sakrab» ketardi. */
  const userMoved = useRef(false);

  /*
   * ⚠️ Faqat ODAM qilgan harakat hisobga olinadi. `fitBounds` ning
   * o'zi ham `zoomend`/`moveend` hodisasini yuboradi; agar ular ham
   * sanalsa, birinchi moslashdan keyin avtomatik rejim darhol
   * o'chib qolardi. Shuning uchun Leaflet ning o'z bayrog'iga
   * tayanmay, FOYDALANUVCHI hodisalari kuzatiladi.
   */
  useEffect(() => {
    const onUserMove = () => {
      userMoved.current = true;
    };
    map.on('zoomstart', onUserMove);
    map.on('dragstart', onUserMove);
    return () => {
      map.off('zoomstart', onUserMove);
      map.off('dragstart', onUserMove);
    };
  }, [map]);

  /*
   * Ko'rinish yoki chegara o'zgarganda — bir marta moslash.
   *
   * ⚠️ Bayroq AYNAN shu yerda tozalanadi, render paytida emas: ref ga
   * render davomida tegish React ning qoidasini buzadi (komponent
   * yangilanmay qolishi mumkin) va bu effekt baribir `viewKey`
   * o'zgarishida ishga tushadi.
   */
  useEffect(() => {
    userMoved.current = false;
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (bounds && !userMoved.current) map.fitBounds(bounds, { padding: [10, 10] });
    }, 220);
    return () => clearTimeout(timer);
  }, [map, bounds, viewKey]);

  /*
   * ⚠️ `ResizeObserver` — TAYMERDAN TASHQARI va undan muhimroq.
   * Xarita kartasining balandligi gridning o'sha qatoridagi eng
   * baland ustundan kelib chiqadi; u esa ma'lumot yuklangach
   * o'zgaradi. Qat'iy taymer bu lahzani o'tkazib yuborishi mumkin va
   * Leaflet eski o'lchamni keshlab qoladi: chegaralar konteynerning
   * o'rtasida kichkina bo'lib chizilardi.
   */
  useEffect(() => {
    const container = map.getContainer();
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        map.invalidateSize({ animate: false });
        /* ⚠️ Odam zoom qilgan bo'lsa — chegaraga QAYTARILMAYDI.
           Faqat o'lcham to'g'rilanadi, ko'rinish tegilmaydi. */
        if (bounds && !userMoved.current) {
          map.fitBounds(bounds, { padding: [10, 10], animate: false });
        }
      });
    });
    observer.observe(container);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [map, bounds]);

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
