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
/*
 * ⚠️ TO'LDIRILGAN tugmalar (primary / accent / danger) — VERTIKAL
 * GRADIENT va o'z rangidagi soya. Yassi bir rang bu o'lchamda
 * «chizilgan to'rtburchak» bo'lib ko'rinadi; yuqoridan yorug',
 * pastdan to'q o'tish esa tugmani bosiladigan predmetga aylantiradi.
 * Faol tab va sarlavhadagi asosiy tugma ham AYNI shaklda — ular
 * bitta ekranda turadi.
 *
 * ⚠️ `disabled:bg-none` MAJBURIY. `disabled:bg-*` faqat `background-color`
 * ni almashtiradi, gradient esa `background-image` da qoladi: usiz
 * o'chirilgan tugma baribir yorqin ko'k bo'lib turardi.
 */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-linear-to-b from-brand-400 to-brand-600 text-white shadow-[var(--shadow-brand)] hover:brightness-110 active:brightness-95 ' +
    'disabled:bg-none disabled:bg-brand-200 disabled:shadow-none',
  accent:
    'bg-linear-to-b from-done-400 to-done-600 text-white shadow-[0_1px_2px_rgb(60_37_118/0.3),0_4px_10px_-4px_rgb(123_71_191/0.4)] hover:brightness-110 active:brightness-95 ' +
    'disabled:bg-none disabled:bg-done-200 disabled:shadow-none',
  secondary:
    'surface text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.12)] hover:bg-neutral-100 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14)] dark:hover:bg-white/8',
  outline:
    'bg-transparent text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.16)] hover:bg-neutral-100 ' +
    'dark:shadow-[0_0_0_1px_rgb(255_255_255/0.16)] dark:hover:bg-white/8',
  ghost: 'bg-transparent text-muted hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/8',
  danger:
    'bg-linear-to-b from-danger-400 to-danger-600 text-white shadow-[0_1px_2px_rgb(120_10_25/0.3),0_4px_10px_-4px_rgb(172_23_48/0.4)] hover:brightness-110 active:brightness-95 ' +
    'disabled:bg-none disabled:bg-danger-200 disabled:shadow-none',
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
