import { cn } from '@/shared/utils/cn';

/**
 * BREND BELGISI — yagona manba.
 *
 * ⚠️ Ilgari u Sidebar va LoginPage ichida IKKI MARTA yozilgan edi va
 * ajralib ketgandi: panelda to‘q sariq kvadrat, login sahifasida esa
 * ko‘k. Bitta tizimning kirish ekrani va ichki ekrani boshqa-boshqa
 * logotip ko‘rsatardi.
 *
 * ⚠️ Rang TO‘Q SARIQ, brend ko‘ki EMAS. Belgi to‘q ko‘k panel ustida
 * turadi: ko‘k kvadrat fonga singib ketardi. To‘q sariq butun tizimda
 * FAQAT shu yerda ishlatiladi — shuning uchun u logotipni darhol
 * taniydigan qiladi.
 */
export function BrandMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center bg-warn-500 shadow-[0_2px_6px_rgb(226_112_28/0.4)]',
        className,
      )}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.25) }}
    >
      <svg
        viewBox="0 0 24 24"
        width={Math.round(size * 0.56)}
        height={Math.round(size * 0.56)}
        fill="none"
        aria-hidden
      >
        <path d="M3.5 21V8.6l6.2-3.6 6.2 3.6V21H3.5Z" fill="#fff" fillOpacity="0.95" />
        <path d="M16.2 21v-8.1l4.3-2.5v10.6h-4.3Z" fill="#fff" fillOpacity="0.6" />
        <g fill="#C25A13">
          <rect x="5.9" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="10.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="5.9" y="14.6" width="2.1" height="2.1" rx="0.4" />
          <rect x="11.1" y="14.6" width="2.1" height="2.1" rx="0.4" />
        </g>
      </svg>
    </span>
  );
}
