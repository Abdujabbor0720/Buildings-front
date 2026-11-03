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
    /*
     * ⚠️ To‘ldirish 14px (`p-3.5`), 20px emas. Bosh sahifada o‘nta
     * karta bir ekranga sig‘ishi kerak: har kartadan 2×6px yutilsa,
     * faqat shu hisobdan ~60px bo‘shaydi — bu bitta jadval qatoriga
     * teng. Kengroq to‘ldirish kerak bo‘lsa, `className` bilan
     * joyida oshiriladi.
     */
    <Tag className={cn('card', hover && 'card-hover', !flush && 'p-3.5', className)}>{children}</Tag>
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
    /*
     * ⚠️ `flex-wrap` YO‘Q. U bo‘lganda uzunroq sarlavha («Tumanlar
     * kesimida obyektlar») o‘ng tomondagi «Barchasi →» havolasini
     * PASTKI QATORGA tushirib yuborardi va karta sarlavhasi ikki
     * qator bo‘lib, maketdagidan balandroq chiqardi. Endi sarlavha
     * qisqaradi (`truncate`), havola esa o‘z joyida qoladi.
     */
    <header className={cn('flex items-start justify-between gap-x-3', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="t-label mb-1">{eyebrow}</p> : null}
        <h2 className="t-section truncate">{title}</h2>
        {subtitle ? <p className="t-meta mt-0.5 truncate">{subtitle}</p> : null}
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
  /*
   * ⚠️ Yorliq BO‘SH bo‘lsa faqat strelka chiziladi. Tor kartada
   * («Muddatlar bo‘yicha» — 240px) «Barchasi →» sarlavhani
   * qisqartirib yuborardi; strelka esa o‘sha ma’noni 14px da beradi.
   * Bu holatda `aria-label` MAJBURIY — ekran o‘qiyotgan dastur uchun
   * yolg‘iz strelka hech narsa demaydi.
   */
  if (!label) {
    return (
      <Link
        to={to}
        aria-label="Barchasini ko‘rish"
        className="group grid size-6 place-items-center rounded-lg text-brand-700 transition-colors hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-500/10"
      >
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    );
  }

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
  return <div className={cn('mt-3', className)}>{children}</div>;
}
