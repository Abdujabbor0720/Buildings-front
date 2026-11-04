import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/**
 * Jadval o‘ralmasi.
 *
 * ⚠️ MANFIY CHET (`-mx-*`) YO‘Q va QAYTA KIRITILMAYDI.
 *
 * Ilgari jadval kartaning chekkasigacha cho‘zilsin deb manfiy chet
 * qo‘yilgan edi. U ikki xatoni birga keltirib chiqardi:
 *   1. chet karta to‘ldirishiga mos kelmasa (14px va 12px), jadval
 *      kartadan 2px tashqariga chiqardi;
 *   2. o‘ralma SKROLL QILINADIGAN element ichida bo‘lsa (bosh
 *      sahifadagi `CardBody`), chapga chiqqan qism skroll bilan
 *      YETIB BO‘LMAYDIGAN joyga tushib, qirqilardi — «#» ustunidagi
 *      1, 2, 3 raqamlari aynan shu sababdan yarmigacha kesilib
 *      turgan edi, o‘ngda esa keraksiz gorizontal skroll paydo
 *      bo‘lardi.
 *
 * Endi jadval karta to‘ldirishi ichida qoladi — bu maketdagi
 * ko‘rinish bilan ham mos.
 *
 * `fill` — jadval o‘ralma BALANDLIGINI to‘ldiradi: qatorlar qolgan
 * joyni o‘zaro bo‘lishadi va karta ostida bo‘sh joy qolmaydi.
 */
export function TableWrap({
  children,
  className,
  fill,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div className={cn('overflow-x-auto', fill && 'h-full', className)}>
      <div className={cn('inline-block min-w-full align-middle', fill && 'h-full')}>
        {children}
      </div>
    </div>
  );
}

/**
 * ⚠️ Jadval matni 12px (`text-meta`), sahifaning 13px idan KICHIKROQ.
 * Jadval — zich ma'lumot: bosh sahifada to'rtta jadval bor va ular
 * matn o'lchamida oqim matni bilan teng bo'lsa, ekran «devor» bo'lib
 * qoladi. Kichikroq o'lcham qatorlarni ham zichlashtiradi: 11 ta tuman
 * skrollsiz sig'adi.
 */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <table className={cn('min-w-full border-separate border-spacing-0 text-meta', className)}>{children}</table>
  );
}

/**
 * Jadval sarlavhasi — YENGIL LENTA bilan.
 *
 * ⚠️ Lenta rangi `--surface-muted`, kulrang EMAS: u sahifa foniga
 * yaqin va qatorlar ustiga «ikkinchi jadval» bo‘lib chiqmaydi.
 * Lenta sticky sarlavhaning ishlashi uchun ham kerak — fonsiz
 * sarlavha skroll paytida qatorlar ustiga shaffof bo‘lib tushardi.
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
        // ⚠️ `border-r` OXIRGI ustunda yo‘q (`last:border-r-0`): aks
        // holda jadvalning o‘ng chekkasida kartaning chegarasi ustiga
        // tushadigan ikkinchi chiziq paydo bo‘lardi.
        // ⚠️ `h-px` — jadval `h-full` bo‘lganda ortiqcha balandlikni
        // FAQAT tana qatorlari olishi uchun. Busiz sarlavha ham
        // cho‘zilib, ustun nomlari qator o‘rtasida osilib qolardi.
        't-label surface-muted sticky top-0 z-10 h-px border-b border-subtle px-3 py-1.5 whitespace-nowrap',
        'border-r border-cell last:border-r-0',
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
        // ⚠️ `py-1.5` — qator balandligi ~31px. Ilgari `py-2.5` edi va
        // qator 41px chiqardi: 11 ta tuman kartaga sig'may, ro'yxat
        // skroll ortida qolardi.
        'border-b border-subtle px-3 py-1.5 align-middle',
        // Ustunlar orasidagi chiziq — `--border-cell`, qator
        // ajratgichidan ANCHA och. Ikkalasi bir xil quyuqlikda bo‘lsa,
        // jadval «to‘r» bo‘lib ko‘rinib, raqamlar o‘qilmay qolardi.
        'border-r border-cell last:border-r-0',
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
