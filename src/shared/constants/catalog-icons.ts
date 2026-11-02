import {
  Banknote,
  Building2,
  CircleEllipsis,
  CloudRain,
  Factory,
  FileText,
  GraduationCap,
  HardHat,
  Package,
  Route,
  Stethoscope,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * KATALOG IKONKALARI — nomdan komponentga.
 *
 * Server katalog qatorida ikonka NOMINI yuboradi (`banknote`, `hard-hat`),
 * komponentni emas: ikonka kutubxonasi mijozda, bazada esa faqat matn
 * bo‘lishi kerak — aks holda kutubxona almashganda MIGRATSIYA yozishga
 * to‘g‘ri kelardi.
 *
 * ⚠️ Ro‘yxatda yo‘q nom uchun `null` qaytadi va chaqiruvchi ZAXIRA
 * ko‘rinishni (rangli nuqta) chizadi. Ilgari ikonka nomi umuman
 * o‘qilmasdi: bazada `icon` ustuni to‘ldirilgan, ekranda esa hamma
 * sabab bir xil nuqta bilan turardi.
 */
const ICONS: Record<string, LucideIcon> = {
  // Kechikish sabablari
  banknote: Banknote,
  package: Package,
  'hard-hat': HardHat,
  'cloud-rain': CloudRain,
  'file-text': FileText,
  'circle-ellipsis': CircleEllipsis,
  // Qurilish turlari
  'graduation-cap': GraduationCap,
  stethoscope: Stethoscope,
  route: Route,
  users: Users,
  factory: Factory,
  'building-2': Building2,
};

export function catalogIcon(name: string | null | undefined): LucideIcon | null {
  return name ? (ICONS[name] ?? null) : null;
}
