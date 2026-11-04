import { cn } from '@/shared/utils/cn';

interface MiniDonutProps {
  /** 0–100 */
  value: number;
  /** HEX rang — holat rangidan keladi. */
  color: string;
  size?: number;
  thickness?: number;
  className?: string;
  label?: string;
}

/**
 * KPI kartasidagi kichik halqa.
 * ⚠️ Sof SVG: 6 ta kartada 6 ta Recharts konteyneri ResizeObserver bilan
 * birga kelardi va sahifa birinchi chizilishini sezilarli sekinlashtirardi.
 */
export function MiniDonut({ value, color, size = 38, thickness = 4, className, label }: MiniDonutProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 -rotate-90', className)}
      role="img"
      aria-label={label ?? `${Math.round(clamped)}%`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={thickness}
        className="stroke-neutral-200 dark:stroke-white/12"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        className="transition-[stroke-dasharray] duration-700 ease-out"
      />
    </svg>
  );
}
