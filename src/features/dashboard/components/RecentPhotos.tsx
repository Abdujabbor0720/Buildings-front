import { ImageOff, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { resolveFileUrl } from '@/shared/api/client';
import type { RecentPhotoItem } from '@/shared/api/types';
import { AI_VERDICT_META } from '@/shared/constants/health';
import { cn } from '@/shared/utils/cn';
import { formatDateTimeUz } from '@/shared/utils/date.utils';

/** «So‘nggi foto-hisobotlar» — kartochkalar, AI xulosasi bilan. */
export function RecentPhotos({ items }: { items: RecentPhotoItem[] }) {
  if (items.length === 0) {
    return <p className="py-10 text-center text-meta text-muted">Hozircha foto-hisobot yuborilmagan</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
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
      className="group overflow-hidden rounded-xl border border-subtle surface transition-shadow hover:shadow-[var(--shadow-raise)]"
    >
      {/* ⚠️ Balandlik QAT'IY (nisbat emas): bosh sahifada bu qatorga
          ~180px ajratilgan va nisbat bilan rasm karta kengligiga
          bog‘lanib, pastki matnni qirqib yuborardi. */}
      <div className="relative h-[62px] overflow-hidden surface-muted">
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

        <span className="num absolute right-2 bottom-2 rounded-md bg-neutral-900/80 px-1.5 py-0.5 text-micro font-bold text-white backdrop-blur-sm">
          {Math.round(item.progressPercent)}%
        </span>
      </div>

      <div className="p-2">
        <p className="truncate text-micro font-medium text-strong">{item.objectName}</p>
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
