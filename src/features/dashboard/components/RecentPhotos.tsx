import { ImageOff, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveFileUrl } from '@/shared/api/client';
import type { RecentPhotoItem } from '@/shared/api/types';
import { AI_VERDICT_META } from '@/shared/constants/health';
import { ObjectMetaInline } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';

/** «So‘nggi foto-hisobotlar» — kartochkalar, AI xulosasi bilan. */
export function RecentPhotos({ items }: { items: RecentPhotoItem[] }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-meta text-muted">Hozircha foto-hisobot yuborilmagan</p>;
  }

  return (
    <div className="grid h-full grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {items.slice(0, 3).map((item) => (
        <PhotoCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function PhotoCard({ item }: { item: RecentPhotoItem }) {
  const src = resolveFileUrl(item.imageUrl);
  const verdict = AI_VERDICT_META[item.aiVerdict];

  return (
    <Link
      to={`/objects/${item.objectId}`}
      className="group flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-subtle surface transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-[var(--shadow-raise)]"
    >
      {/* ⚠️ Rasm QOLGAN joyni egallaydi (`flex-1`), nisbat bilan
          emas: nisbat karta KENGLIGIGA bog‘lanib, keng monitorda
          pastki matnni qirqib yuborardi. Eng kichik balandlik esa
          rasmni «chiziq» bo‘lib qolishidan saqlaydi. */}
      <div className="relative min-h-[56px] flex-1 overflow-hidden surface-muted">
        {src ? (
          <img
            src={src}
            alt={item.objectName}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid size-full place-items-center text-neutral-400">
            <ImageOff className="size-6" />
          </span>
        )}

        {/* ⚠️ PARDA (gradient) — belgi uchun emas, RASM uchun.
            Yorug‘ osmonli fotoda oq raqam yo‘qolib ketardi, to‘q
            to‘rtburchak esa rasmni «yamoq» qilib qo‘yardi. Pastdan
            yuqoriga so‘nadigan parda ikkalasini ham hal qiladi va
            rasmning o‘zi ochiq qoladi. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-neutral-950/55 via-neutral-950/15 to-transparent"
        />
        <span className="num absolute right-2 bottom-2 rounded-md bg-neutral-950/55 px-1.5 py-0.5 text-micro font-bold text-white ring-1 ring-white/20 ring-inset backdrop-blur-md">
          {Math.round(item.progressPercent)}%
        </span>
      </div>

      <div className="shrink-0 p-2">
        <p className="truncate text-micro font-medium text-strong">{item.objectName}</p>
        {/* ⚠️ Surat qaysi obyektniki ekani yetarli emas: «qayerda va
            kim javobgar» savoli fotoarxivda ham darhol tug'iladi.
            Rasm `flex-1` bo'lgani uchun bu qator uning balandligidan
            oladi — kartochka o'zi balandlashmaydi. */}
        <ObjectMetaInline brief={item} className="mt-0.5" />
        {/* Sana va AI xulosasi BITTA qatorda — alohida qatorda
            turganda kartochka 20px baland bo‘lib, uchtasi qatorga
            sig‘masdi. */}
        <div className="mt-1 flex items-center justify-between gap-1.5">
          <span className="num truncate text-nano text-muted">{formatDateTimeUz(item.capturedAt)}</span>
          <span
            className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-nano font-medium', verdict.chip)}
            title={`Ishonch darajasi: ${item.aiConfidence === null ? '—' : `${Math.round(item.aiConfidence * 100)}%`}`}
          >
            <Sparkles className="size-2.5" />
            {verdict.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
