import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/shared/utils/cn';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Ichki to‘ldirishsiz — jadval butun kenglikni egallashi uchun. */
  flush?: boolean;
  /** Sichqoncha ostida ko‘tariladi — faqat bosiladigan kartada. */
  hover?: boolean;
  as?: 'section' | 'div' | 'article';
}

export function Card({ children, className, flush, hover, as: Tag = 'section' }: CardProps) {
  return (
    <Tag className={cn('card', hover && 'card-hover', !flush && 'p-4 sm:p-5', className)}>{children}</Tag>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  /** Sarlavha ustidagi kichik katta harfli yorliq. */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /** O‘ng tomondagi boshqaruv: tab, tugma, filtr. */
  action?: ReactNode;
  /** «Barchasi →» havolasi. */
  moreTo?: string;
  moreLabel?: string;
  className?: string;
}

export function CardHeader({
  title,
  eyebrow,
  subtitle,
  action,
  moreTo,
  moreLabel = 'Barchasi',
  className,
}: CardHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-x-4 gap-y-2.5', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="t-label mb-1">{eyebrow}</p> : null}
        <h2 className="t-section truncate">{title}</h2>
        {subtitle ? <p className="t-meta mt-1 truncate">{subtitle}</p> : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {action}
        {moreTo ? <MoreLink to={moreTo} label={moreLabel} /> : null}
      </div>
    </header>
  );
}

/**
 * «Barchasi →» — butun tizimda bitta ko‘rinish.
 * Tag‘in pastki chiziq bilan: havola ekanligi rang bilan emas, SHAKL
 * bilan ham bilinishi kerak (rang ko‘rmaydiganlar uchun).
 */
export function MoreLink({ to, label = 'Barchasi' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 text-meta font-medium text-brand-700 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-500 hover:decoration-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
    >
      {label}
      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

/** Kartaning asosiy qismi — sarlavhadan keyingi bo‘shliq bilan. */
export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mt-4', className)}>{children}</div>;
}
