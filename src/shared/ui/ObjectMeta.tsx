import { MapPin, UserRound } from 'lucide-react';
import type { ObjectBrief } from '@/shared/api/types';
import { cn } from '@/shared/utils/cn';

/**
 * OBYEKT JOYLASHUVI VA MAS'ULI — YAGONA KO‘RINISH.
 *
 * Obyekt tizimda o‘n to‘rt xil ekranda chiqadi. Agar har ekran
 * manzilni va mas'ulni o‘zicha chizsa, bittasida «J. Karimov»,
 * boshqasida «Karimov Jahongir», uchinchisida bo‘sh katak bo‘lib
 * qolardi — sana formatida aynan shunday bo‘lgan va shuning uchun
 * `date.utils.ts` yozilgan. Bu fayl o‘sha qoidaning joylashuv va
 * mas'ul uchun takrori.
 *
 * ⚠️ BO‘SH QIYMAT YASHIRILMAYDI. Manzili kiritilmagan yoki mas'uli
 * biriktirilmagan obyekt — ma'lumot to‘liq emasligining eng qimmat
 * ko‘rinishi va u ekranda OCHIQ aytiladi. Bo‘sh katak esa «yuklanmadi»
 * bo‘lib o‘qilardi.
 */

/* ───────────────────────── Joylashuv ───────────────────────── */

interface LocationProps {
  address: string | null;
  lat?: number | null;
  lng?: number | null;
  /**
   * `line` — jadval katagi ostidagi ikkinchi qator (eng ko‘p ishlatiladi);
   * `cell` — alohida ustun;
   * `block` — karta ichidagi mustaqil qator (yirikroq matn).
   */
  variant?: 'line' | 'cell' | 'block';
  className?: string;
}

/**
 * Obyekt manzili.
 *
 * ⚠️ Koordinata MATN sifatida chiqarilmaydi («40.8676, 71.9187» degan
 * yozuv odamga hech narsa demaydi) — u faqat belgini «aniq nuqta bor»
 * holatiga o‘tkazadi va ko‘rsatmada ko‘rinadi. Xaritada ochish
 * havolasi ham shu yerda: obyekt kartasini ochmasdan.
 */
export function ObjectLocation({ address, lat, lng, variant = 'line', className }: LocationProps) {
  const hasPoint = lat !== null && lat !== undefined && lng !== null && lng !== undefined;
  const text = address ?? (hasPoint ? 'Manzil kiritilmagan — xaritada nuqta bor' : 'Manzil kiritilmagan');
  const known = Boolean(address);

  const title = [
    address ?? 'Manzil kiritilmagan',
    hasPoint ? `Koordinata: ${lat}, ${lng}` : 'Xaritada nuqtasi yo‘q',
  ].join(' · ');

  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1',
        variant === 'block' ? 'text-meta' : 'text-nano',
        known ? 'text-muted' : 'text-faint',
        className,
      )}
      title={title}
    >
      <MapPin
        className={cn(
          'shrink-0',
          variant === 'block' ? 'size-3.5' : 'size-3',
          // ⚠️ Koordinatasi bor obyekt belgisi TO‘Qroq: xaritada
          // topiladigan obyekt bilan faqat qog‘ozda bor obyekt bir xil
          // ko‘rinsa, xarita qoplamasi qanchaligi hech qayerda
          // bilinmasdi.
          hasPoint ? 'text-brand-500/70 dark:text-brand-400/70' : 'text-faint',
        )}
        aria-hidden
      />
      <span className="truncate">{text}</span>
    </span>
  );
}

/* ───────────────────────── Mas'ul ───────────────────────── */

interface ResponsibleProps {
  name: string | null;
  fullName?: string | null;
  position?: string | null;
  phone?: string | null;
  /** `line` — ikkinchi qator; `cell` — alohida ustun. */
  variant?: 'line' | 'cell' | 'block';
  /** Ikonka ko‘rsatilsinmi (alohida ustunda ortiqcha bo‘lishi mumkin). */
  withIcon?: boolean;
  className?: string;
}

/**
 * Obyekt mas'uli (kurator).
 *
 * ⚠️ Biriktirilmagan holat QAHRABO rangda, kulrang «—» emas. Hokim
 * uchun «javobgari yo‘q obyekt» — holat emas, VAZIFA; xira chiziqcha
 * esa e'tibordan chetda qolardi.
 *
 * ⚠️ Telefon ko‘rsatmada, matnda emas: jadval katagida raqam joy yeb,
 * ismni qirqardi. «Kim javobgar» savolidan keyingi savol — «unga
 * qanday bog‘lanaman» — ko‘rsatma ochilishi bilan javob topadi.
 */
export function ResponsiblePerson({
  name,
  fullName,
  position,
  phone,
  variant = 'line',
  withIcon = true,
  className,
}: ResponsibleProps) {
  const size = variant === 'block' ? 'text-meta' : variant === 'cell' ? 'text-meta' : 'text-nano';

  if (!name) {
    return (
      <span
        className={cn('inline-flex items-center gap-1 text-warn-600 dark:text-warn-400', size, className)}
        title="Obyektga mas'ul biriktirilmagan"
      >
        {withIcon ? <UserRound className="size-3 shrink-0" aria-hidden /> : null}
        <span className="truncate">Mas'ul biriktirilmagan</span>
      </span>
    );
  }

  const title = [fullName ?? name, position, phone].filter(Boolean).join(' · ');

  return (
    <span
      className={cn('inline-flex min-w-0 max-w-full items-center gap-1 text-muted', size, className)}
      title={title}
    >
      {withIcon ? (
        <UserRound className={cn('shrink-0 text-faint', variant === 'block' ? 'size-3.5' : 'size-3')} aria-hidden />
      ) : null}
      <span className="truncate text-strong">{name}</span>
      {variant === 'block' && position ? (
        <span className="truncate text-muted">· {position}</span>
      ) : null}
    </span>
  );
}

/**
 * `ObjectBrief` ni to‘g‘ridan-to‘g‘ri qabul qiladigan o‘rovchi.
 *
 * ⚠️ Chaqiruv joyida to‘rtta propni qo‘lda yoyish (`name={...}
 * fullName={...} position={...} phone={...}`) TAQIQLANADI: u o‘n
 * to‘rt joyda takrorlanardi va birida, albatta, bitta maydon
 * tushib qolib, ko‘rsatmada telefon yoki lavozim jim yo‘qolardi.
 */
export function ObjectResponsible({
  brief,
  variant,
  withIcon,
  className,
}: {
  brief: ObjectBrief;
  variant?: ResponsibleProps['variant'];
  withIcon?: boolean;
  className?: string;
}) {
  return (
    <ResponsiblePerson
      name={brief.responsibleName}
      fullName={brief.responsibleFullName}
      position={brief.responsiblePosition}
      phone={brief.responsiblePhone}
      variant={variant}
      withIcon={withIcon}
      className={className}
    />
  );
}

/** `ObjectBrief` ni qabul qiladigan joylashuv o‘rovchisi. */
export function ObjectAddress({
  brief,
  variant,
  className,
}: {
  brief: ObjectBrief;
  variant?: LocationProps['variant'];
  className?: string;
}) {
  return (
    <ObjectLocation
      address={brief.address}
      lat={brief.lat}
      lng={brief.lng}
      variant={variant}
      className={className}
    />
  );
}

/* ───────────────────────── Ikkalasi birga ───────────────────────── */

/**
 * IKKALASI BITTA QATORDA — bosh sahifa uchun.
 *
 * ⚠️ Bosh sahifa BITTA EKRANGA sig‘ishi shart (`DashboardPage`
 * izohiga qarang) va u yerdagi jadvallarda har qator 24px. Ikki
 * qatorli izoh (`ObjectMetaLines`) qatorni 48px ga ko‘tarib, beshta
 * qator kartadan chiqib ketardi — ya’ni ma’lumot qo‘shish o‘rniga
 * mavjudini QIRQARDI. Bitta qatorda esa joylashuv ham, mas'ul ham
 * ko‘rinadi va qator atigi ~12px ga o‘sadi.
 *
 * ⚠️ Ajratgich — nuqta, vergul emas: manzilning o‘zida vergul
 * bo‘ladi («Navoiy ko‘chasi 14, 2-uy») va ikkalasi qo‘shilganda
 * qayerda manzil tugab, kim boshlanishi bilinmay qolardi.
 */
export function ObjectMetaInline({
  brief,
  className,
}: {
  brief: ObjectBrief;
  className?: string;
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-1.5', className)}>
      <ObjectAddress brief={brief} className="min-w-0 flex-1" />
      <span className="text-faint shrink-0 text-nano" aria-hidden>
        ·
      </span>
      <ObjectResponsible brief={brief} className="shrink-0 max-w-[45%]" />
    </span>
  );
}

/**
 * Jadval katagidagi obyekt nomi ostiga qo‘yiladigan ikki qatorli izoh.
 *
 * ⚠️ Eng ko‘p ishlatiladigan shakl — ro‘yxatlarda obyekt nomi
 * yonidagi joyga sig‘adi va qo‘shimcha ustun talab qilmaydi.
 */
export function ObjectMetaLines({
  brief,
  className,
  showResponsible = true,
}: {
  brief: ObjectBrief;
  className?: string;
  showResponsible?: boolean;
}) {
  return (
    <span className={cn('mt-0.5 flex min-w-0 flex-col gap-px', className)}>
      <ObjectAddress brief={brief} />
      {showResponsible ? <ObjectResponsible brief={brief} /> : null}
    </span>
  );
}
