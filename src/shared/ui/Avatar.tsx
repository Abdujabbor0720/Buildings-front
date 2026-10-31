import { cn } from '@/shared/utils/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  xs: 'size-6 text-nano',
  sm: 'size-8 text-micro',
  md: 'size-9 text-meta',
  lg: 'size-12 text-body',
} as const;

/**
 * Ism bo‘yicha barqaror rang — bir odam har doim bir xil rangda ko‘rinadi.
 * ⚠️ To‘yingan rang EMAS, yumshoq fon + to‘q matn: ekranda o‘nlab avatar
 * bo‘ladi, ular rangli dog‘ bo‘lib ma’lumotni bosib ketmasligi kerak.
 */
const PALETTE = [
  'bg-brand-100 text-brand-800 dark:bg-brand-500/15 dark:text-brand-300',
  'bg-ok-100 text-ok-800 dark:bg-ok-500/15 dark:text-ok-300',
  'bg-done-100 text-done-800 dark:bg-done-500/15 dark:text-done-300',
  'bg-warn-100 text-warn-800 dark:bg-warn-500/15 dark:text-warn-300',
  'bg-neutral-200 text-neutral-700 dark:bg-white/10 dark:text-neutral-300',
  'bg-danger-100 text-danger-800 dark:bg-danger-500/15 dark:text-danger-300',
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function paletteFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'shrink-0 rounded-full object-cover shadow-[0_0_0_1px_rgb(16_20_15/0.08)]',
          SIZES[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      title={name}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-semibold select-none',
        paletteFor(name),
        SIZES[size],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
