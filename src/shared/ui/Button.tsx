import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm';

/**
 * Tugma shakli — YUMALOQ TO‘RTBURCHAK (`rounded-lg`), asosiysi KO‘K.
 *
 * ⚠️ Kapsula (`rounded-full`) EMAS: bu ekranda bitta qatorda to‘rt-besh
 * boshqaruv yonma-yon turadi (filtr, sana, qidiruv) va kapsula ularni
 * «tugmalar girlandasi» qilib ko‘rsatadi. To‘rtburchak boshqaruvlar
 * bitta chiziqda o‘qiladi. Nishon (`Badge`) esa aksincha kapsula —
 * u boshqaruv emas, YORLIQ.
 *
 * `accent` — ko‘kdan farq qilishi kerak bo‘lgan yagona urg‘u (sahifada
 * ko‘pi bilan bitta); shuning uchun u binafsha `done` oilasida.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white shadow-[0_1px_2px_rgb(10_60_140/0.25)] hover:bg-brand-600 active:bg-brand-700 ' +
    'disabled:bg-brand-200',
  accent:
    'bg-done-500 text-white shadow-[0_1px_2px_rgb(60_37_118/0.25)] hover:bg-done-600 active:bg-done-700 ' +
    'disabled:bg-done-200',
  secondary:
    'surface text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.12)] hover:bg-neutral-100 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14)] dark:hover:bg-white/8',
  outline:
    'bg-transparent text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.16)] hover:bg-neutral-100 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.16)] dark:hover:bg-white/8',
  ghost: 'bg-transparent text-muted hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8',
  danger:
    'bg-danger-500 text-white shadow-[0_1px_2px_rgb(160_20_30/0.25)] hover:bg-danger-600 active:bg-danger-700 ' +
    'disabled:bg-danger-200',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 gap-1.5 px-3.5 text-meta',
  md: 'h-9 gap-2 px-4 text-ui',
  lg: 'h-11 gap-2 px-6 text-body',
  icon: 'size-9 justify-center',
  'icon-sm': 'size-8 justify-center',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leftIcon, rightIcon, className, children, disabled, ...rest },
  ref,
) {
  const solid = variant === 'primary' || variant === 'accent' || variant === 'danger';

  return (
    <button
      ref={ref}
      // ⚠️ Yuklanayotgan tugma ham o‘chiriladi: ikki marta bosish ikkita
      // bir xil so‘rov yuborishning eng keng tarqalgan sababi.
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 items-center rounded-lg font-medium whitespace-nowrap',
        'transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
        // To‘ldirilgan tugma matni biroz qalinroq: rangli fonda 500
        // og‘irlik «yupqa» ko‘rinadi, oq matn fonni «yeb» qo‘yadi.
        solid && 'font-semibold',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});
