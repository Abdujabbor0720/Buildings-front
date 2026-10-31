import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Banknote,
  Building2,
  CalendarDays,
  Camera,
  FileText,
  LayoutDashboard,
  Map,
  Settings,
  Sparkles,
  Table2,
  TriangleAlert,
  UserCog,
  Users,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Shu ruxsatsiz menyu bandi KO‘RINMAYDI (bosib bo‘lmaydigan emas — yo‘q). */
  permission?: string;
  end?: boolean;
}

export interface NavGroup {
  /** `null` — birinchi guruh, sarlavhasiz (Bosh sahifa). */
  title: string | null;
  items: NavItem[];
}

/**
 * Yon menyu — GURUHLARGA bo‘lingan.
 *
 * ⚠️ 14 ta band tekis ro‘yxatda bo‘lsa, foydalanuvchi har safar yuqoridan
 * pastgacha o‘qib chiqadi. Guruh sarlavhasi qidiruvni «qaysi bo‘limda
 * bo‘lishi mumkin» degan savolga qisqartiradi.
 *
 * ⚠️ Ruxsati yo‘q bo‘lim ko‘rsatilmaydi: foydalanuvchiga bosib bo‘lmaydigan
 * tugmani ko‘rsatish «tizim buzuq» taassurotini beradi. Guruhning HAMMA
 * bandi yashirilsa, guruh sarlavhasi ham chiqmaydi.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: null,
    items: [{ to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true }],
  },
  {
    title: 'Obyektlar',
    items: [
      { to: '/objects', label: 'Obyektlar ro‘yxati', icon: Building2, permission: 'objects.view' },
      { to: '/map', label: 'Interaktiv xarita', icon: Map, permission: 'objects.view' },
      { to: '/districts', label: 'Tumanlar kesimida', icon: Table2, permission: 'objects.view' },
      { to: '/calendar', label: 'Kalendar (ish rejasi)', icon: CalendarDays, permission: 'objects.view' },
    ],
  },
  {
    title: 'Nazorat',
    items: [
      { to: '/delays', label: 'Kechikishlar va risklar', icon: TriangleAlert, permission: 'delays.view' },
      { to: '/photos', label: 'Fotoarxiv', icon: Camera, permission: 'photos.view' },
      { to: '/documents', label: 'Hujjatlar', icon: FileText, permission: 'documents.view' },
    ],
  },
  {
    title: 'Tahlil va moliya',
    items: [
      { to: '/reports', label: 'Hisobotlar', icon: BarChart3, permission: 'reports.view' },
      { to: '/funding', label: 'Moliyalashtirish', icon: Banknote, permission: 'funding.view' },
      { to: '/ai', label: 'AI tahlil', icon: Sparkles, permission: 'reports.view' },
    ],
  },
  {
    title: 'Ishtirokchilar',
    items: [
      { to: '/responsibles', label: 'Mas’ullar', icon: UserCog, permission: 'objects.view' },
      { to: '/contractors', label: 'Pudratchilar', icon: Users, permission: 'contractors.view' },
    ],
  },
  {
    title: 'Tizim',
    items: [{ to: '/settings', label: 'Sozlamalar', icon: Settings, permission: 'settings.view' }],
  },
];

/** Tekis ro‘yxat — qidiruv va sarlavha aniqlash uchun. */
export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);
