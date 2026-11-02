import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/**
 * Maydon shakli — chegara emas, SOYA HALQASI.
 *
 * `border` 1px to‘q chiziq beradi va bir qator yonma-yon maydon qo‘yilganda
 * ekran «katakli daftar» bo‘lib ko‘rinadi. Soya halqasi esa yumshoq va
 * fokusda qalinlashadi — brend rangli ikkinchi halqa qo‘shiladi.
 */
const FIELD_BASE =
  'w-full rounded-lg surface px-3 text-ui text-strong transition-shadow ' +
  'shadow-[0_0_0_1px_rgb(16_42_76/0.1)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] ' +
  'placeholder:text-faint placeholder:font-light ' +
  'focus:shadow-[0_0_0_1px_var(--color-brand-500),0_0_0_3px_rgb(255_127_0/0.22)] focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const FIELD_ERROR = 'shadow-[0_0_0_1px_var(--color-danger-500)]';

interface FieldProps {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}

export function Field({ label, hint, error, required, children, className, htmlFor }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="t-label block">
          {label}
          {required ? <span className="ml-0.5 text-danger-500">*</span> : null}
        </label>
      ) : null}
      {children}
      {/* Xato xabari maslahatni ALMASHTIRADI — ikkalasi birga ko‘rinsa,
          foydalanuvchi qaysi biriga amal qilishni bilmaydi. */}
      {error ? (
        <p className="text-meta text-danger-600 dark:text-danger-400">{error}</p>
      ) : hint ? (
        <p className="t-meta">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const control = (
    <div className="relative">
      {leftIcon ? (
        <span className="text-faint pointer-events-none absolute inset-y-0 left-3 grid place-items-center">
          {leftIcon}
        </span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, 'h-9', leftIcon && 'pl-9', error && FIELD_ERROR, className)}
        {...rest}
      />
    </div>
  );

  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={inputId}>
      {control}
    </Field>
  );
});

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Qidiruv maydoni — tozalash tugmasi bilan. */
export function SearchInput({ value, onValueChange, className, placeholder, ...rest }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="text-faint pointer-events-none absolute inset-y-0 left-3 my-auto size-4" />
      <input
        type="search"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        placeholder={placeholder ?? 'Qidirish…'}
        className={cn(FIELD_BASE, 'h-9 pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
        {...rest}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Qidiruvni tozalash"
          className="text-faint absolute inset-y-0 right-2 my-auto grid size-6 place-items-center rounded-full transition-colors hover:bg-neutral-100 hover:text-strong dark:hover:bg-white/10"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, className, id, required, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;

  const control = (
    <select
      ref={ref}
      id={selectId}
      required={required}
      aria-invalid={error ? true : undefined}
      className={cn(FIELD_BASE, 'h-9 appearance-none bg-no-repeat pr-8', error && FIELD_ERROR, className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%238a8a93' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.65rem center',
      }}
      {...rest}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!label && !hint && !error) return control;
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={selectId}>
      {control}
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, required, rows = 3, ...rest },
  ref,
) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={fieldId}>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_BASE, 'resize-y py-2 leading-relaxed', error && FIELD_ERROR, className)}
        {...rest}
      />
    </Field>
  );
});
