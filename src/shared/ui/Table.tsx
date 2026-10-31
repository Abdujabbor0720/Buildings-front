import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('-mx-4 overflow-x-auto sm:-mx-5', className)}>
      <div className="inline-block min-w-full align-middle">{children}</div>
    </div>
  );
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <table className={cn('min-w-full border-separate border-spacing-0 text-ui', className)}>{children}</table>
  );
}

/**
 * Jadval sarlavhasi — fonsiz.
 * ⚠️ Kulrang «lenta» ATAYLAB yo‘q: ma’lumot zich bo‘lgan ekranda u yana
 * bitta qator bo‘lib ko‘rinadi. Sarlavhani mayda katta harf va ingichka
 * ajratuvchi chiziq farqlaydi.
 */
export function THead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>;
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Saralash boshqaruvi — `sortKey` berilsa ustun bosiladigan bo‘ladi. */
  sortKey?: string;
  activeSort?: { by: string; order: 'ASC' | 'DESC' };
  onSort?: (key: string) => void;
  align?: 'left' | 'center' | 'right';
}

export function Th({ children, sortKey, activeSort, onSort, align = 'left', className, ...rest }: ThProps) {
  const isActive = Boolean(sortKey) && activeSort?.by === sortKey;
  const sortable = Boolean(sortKey && onSort);

  return (
    <th
      scope="col"
      className={cn(
        't-label surface sticky top-0 z-10 border-b border-subtle px-3 pt-1 pb-2.5 whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        sortable && 'cursor-pointer transition-colors select-none hover:text-strong',
        isActive && 'text-strong',
        className,
      )}
      aria-sort={isActive ? (activeSort?.order === 'ASC' ? 'ascending' : 'descending') : undefined}
      onClick={sortable ? () => onSort?.(sortKey!) : undefined}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'flex-row-reverse')}>
        {children}
        {sortable ? (
          isActive ? (
            activeSort?.order === 'ASC' ? (
              <ChevronUp className="size-3 text-brand-500" />
            ) : (
              <ChevronDown className="size-3 text-brand-500" />
            )
          ) : (
            <ChevronsUpDown className="size-3 opacity-35" />
          )
        ) : null}
      </span>
    </th>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

interface TrProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function Tr({ children, onClick, className }: TrProps) {
  return (
    <tr
      className={cn(
        'group transition-colors',
        // Sichqoncha ostidagi fon — brend rangining eng yupqa qatlami.
        // To‘qroq bo‘lsa, qatorni «tanlangan» deb o‘qishadi.
        onClick && 'cursor-pointer hover:bg-brand-500/[0.045] dark:hover:bg-white/[0.04]',
        className,
      )}
      onClick={onClick}
      // Klaviatura bilan ham ochilishi kerak — qator havola vazifasini
      // bajarayotgan bo‘lsa, u fokuslanadigan bo‘lishi shart.
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'link' : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </tr>
  );
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  muted?: boolean;
}

export function Td({ children, align = 'left', muted, className, ...rest }: TdProps) {
  return (
    <td
      className={cn(
        'border-b border-subtle px-3 py-2.5 align-middle',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        muted && 'text-muted',
        className,
      )}
      {...rest}
    >
      {children}
    </td>
  );
}

/** Jadval ichidagi bo‘sh holat — ustunlar sonini qamrab oladi. */
export function TableEmpty({ colSpan, children }: { colSpan: number; children?: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-b border-subtle px-3 py-12 text-center text-ui text-muted">
        {children ?? 'Ma’lumot topilmadi'}
      </td>
    </tr>
  );
}
