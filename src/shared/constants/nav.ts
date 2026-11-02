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

/**
 * Yon menyu — TEKIS RO‘YXAT.
 *
 * ⚠️ Guruh sarlavhalari (`Obyektlar`, `Nazorat`, …) ATAYLAB olib
 * tashlangan. To‘q panelda sarlavha ikki yomon variantdan birini
 * tanlashga majbur qiladi: yorqin bo‘lsa, menyu bandlaridan ko‘ra
 * ko‘proq ko‘zga tashlanadi; xira bo‘lsa, to‘q fonda o‘qilmaydi.
 * 14 ta band bitta ro‘yxatda bemalol sig‘adi va tartib ish oqimiga
 * mos: avval ko‘rish (obyekt, xarita, tuman, kalendar), keyin nazorat,
 * keyin tahlil, oxirida ishtirokchilar va sozlama.
 *
 * ⚠️ Ruxsati yo‘q bo‘lim ko‘rsatilmaydi: foydalanuvchiga bosib
 * bo‘lmaydigan tugmani ko‘rsatish «tizim buzuq» taassurotini beradi.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/objects', label: 'Obyektlar ro‘yxati', icon: Building2, permission: 'objects.view' },
  { to: '/map', label: 'Interaktiv xarita', icon: Map, permission: 'objects.view' },
  { to: '/districts', label: 'Tumanlar kesimida', icon: Table2, permission: 'objects.view' },
  { to: '/calendar', label: 'Kalendar (ish rejasi)', icon: CalendarDays, permission: 'objects.view' },
  { to: '/delays', label: 'Kechikishlar va risklar', icon: TriangleAlert, permission: 'delays.view' },
  { to: '/reports', label: 'Hisobotlar', icon: BarChart3, permission: 'reports.view' },
  { to: '/photos', label: 'Fotoarxiv', icon: Camera, permission: 'photos.view' },
  { to: '/documents', label: 'Hujjatlar', icon: FileText, permission: 'documents.view' },
  { to: '/responsibles', label: 'Mas’ullar', icon: UserCog, permission: 'objects.view' },
  { to: '/contractors', label: 'Pudratchilar', icon: Users, permission: 'contractors.view' },
  { to: '/funding', label: 'Moliyalashtirish', icon: Banknote, permission: 'funding.view' },
  { to: '/ai', label: 'AI tahlil', icon: Sparkles, permission: 'reports.view' },
  { to: '/settings', label: 'Sozlamalar', icon: Settings, permission: 'settings.view' },
];
