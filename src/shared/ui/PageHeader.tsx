import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  /** Sarlavha ostidagi ko‘rsatkichlar qatori. */
  stats?: ReactNode;
  className?: string;
}

/**
 * Sahifa sarlavhasi — maketdagi «katta sarlavha + ingichka izoh» naqshi.
 * Sarlavha YIRIK va qalin, izoh esa YENGIL (300) — ikkalasining qarama-qarshiligi
 * sahifaga tartib beradi; ikkalasi ham o‘rtacha qalinlikda bo‘lsa, ekran
 * «bir xil kulrang matn» bo‘lib ko‘rinadi.
 */
export function PageHeader({ title, description, actions, stats, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-5', className)}>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <h1 className="t-page">{title}</h1>
          {description ? <p className="t-lede mt-2 max-w-3xl">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {stats ? <div className="mt-4">{stats}</div> : null}
    </header>
  );
}

interface StatPillsProps {
  items: Array<{ label: string; value: ReactNode; tone?: string }>;
}

/** Sahifa ustidagi ixcham ko‘rsatkichlar — alohida karta ochmasdan. */
export function StatPills({ items }: StatPillsProps) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className="inline-flex items-baseline gap-2 rounded-lg surface px-3 py-1.5 shadow-[0_0_0_1px_rgb(16_42_76/0.08)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.1)]"
        >
          <span className="t-label">{item.label}</span>
          <span className={cn('num text-body', item.tone)}>{item.value}</span>
        </span>
      ))}
    </div>
  );
}
