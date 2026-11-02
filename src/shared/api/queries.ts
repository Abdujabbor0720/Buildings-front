import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';
import {
  apiDelete,
  apiDownload,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
  apiPut,
  apiUpload,
} from './client';
import type {
  AiAnalysis,
  AiOverview,
  AppNotification,
  CalendarItem,
  Catalogs,
  ConstructionObject,
  Contractor,
  Customer,
  DashboardPayload,
  District,
  DistrictGeoJson,
  DistrictStats,
  FundingAllocation,
  FundingSummary,
  FundingTransaction,
  Milestone,
  ObjectDelay,
  ObjectDocument,
  ObjectMapPoint,
  Paginated,
  PhotoReport,
  ProgressTimelinePoint,
  ProgressUpdate,
  Region,
  StoredFileRef,
  UserSummary,
} from './types';

/**
 * SO‘ROV KALITLARI — yagona manba.
 *
 * ⚠️ Kalit qo‘lda yozilmaydi (`['objects', filters]` kabi): bitta harf
 * farq qilsa, mutatsiyadan keyin kesh yangilanmay qoladi va foydalanuvchi
 * eski ro‘yxatni ko‘rib turaveradi.
 */
export const qk = {
  auth: ['auth', 'me'] as const,

  catalogs: ['catalogs'] as const,
  regions: ['geo', 'regions'] as const,
  districts: (regionId?: string) => ['geo', 'districts', regionId ?? 'all'] as const,
  districtStats: (params: unknown) => ['geo', 'district-stats', params] as const,
  districtGeoJson: (params: unknown) => ['geo', 'geojson', params] as const,

  dashboard: (params: unknown) => ['dashboard', params] as const,

  objects: (params: unknown) => ['objects', 'list', params] as const,
  object: (id: string) => ['objects', 'detail', id] as const,
  objectProgress: (id: string) => ['objects', 'progress', id] as const,
  objectMilestones: (id: string) => ['objects', 'milestones', id] as const,
  objectFunding: (id: string) => ['objects', 'funding', id] as const,
  objectAi: (id: string) => ['objects', 'ai', id] as const,
  objectsMap: (params: unknown) => ['objects', 'map', params] as const,

  calendar: (params: unknown) => ['calendar', params] as const,
  delays: (params: unknown) => ['delays', 'list', params] as const,
  delayReasons: (params: unknown) => ['delays', 'breakdown', params] as const,

  photos: (params: unknown) => ['photos', 'list', params] as const,
  photoStats: (regionId?: string) => ['photos', 'stats', regionId ?? 'all'] as const,

  documents: (params: unknown) => ['documents', 'list', params] as const,
  contractors: (params: unknown) => ['contractors', 'list', params] as const,
  contractor: (id: string) => ['contractors', 'detail', id] as const,
  customers: (params: unknown) => ['customers', params] as const,

  users: (params: unknown) => ['users', 'list', params] as const,
  responsibles: (regionId?: string) => ['users', 'responsibles', regionId ?? 'all'] as const,

  funding: {
    summary: (params: unknown) => ['funding', 'summary', params] as const,
    allocations: (params: unknown) => ['funding', 'allocations', params] as const,
    transactions: (params: unknown) => ['funding', 'transactions', params] as const,
  },

  reports: {
    summary: (regionId?: string) => ['reports', 'summary', regionId ?? 'all'] as const,
    timeline: (params: unknown) => ['reports', 'timeline', params] as const,
  },

  ai: (regionId?: string) => ['ai', 'overview', regionId ?? 'all'] as const,

  notifications: (params: unknown) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,

  settings: ['settings'] as const,
} as const;

type QueryParams = Record<string, unknown>;

/* ───────────────────────── Ma’lumotnomalar ───────────────────────── */

export function useCatalogs() {
  return useQuery({
    queryKey: qk.catalogs,
    queryFn: () => apiGet<Catalogs>('/catalogs'),
    // ⚠️ Kataloglar deyarli o‘zgarmaydi — har sahifa almashganda qayta
    // so‘rash tarmoqni bekorga band qiladi.
    staleTime: 30 * 60_000,
  });
}

export function useRegions() {
  return useQuery({
    queryKey: qk.regions,
    queryFn: () => apiGet<Region[]>('/geo/regions'),
    staleTime: 60 * 60_000,
  });
}

export function useDistricts(regionId?: string) {
  return useQuery({
    queryKey: qk.districts(regionId),
    queryFn: () => apiGet<District[]>('/geo/districts', { params: regionId ? { regionId } : {} }),
    staleTime: 60 * 60_000,
  });
}

export function useDistrictStats(params: QueryParams) {
  return useQuery({
    queryKey: qk.districtStats(params),
    queryFn: () => apiGet<DistrictStats[]>('/geo/districts/stats', { params }),
    placeholderData: keepPreviousData,
  });
}

export function useDistrictGeoJson(params: QueryParams) {
  return useQuery({
    queryKey: qk.districtGeoJson(params),
    queryFn: () => apiGet<DistrictGeoJson>('/geo/districts/geojson', { params }),
    // Chegaralar og‘ir, lekin o‘zgarmaydi — statistika esa filtr bilan
    // o‘zgaradi, shuning uchun o‘rtacha muddat.
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
}

/* ───────────────────────── Dashboard ───────────────────────── */

export function useDashboard(params: QueryParams) {
  return useQuery({
    queryKey: qk.dashboard(params),
    queryFn: () => apiGet<DashboardPayload>('/dashboard', { params }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/* ───────────────────────── Obyektlar ───────────────────────── */

export function useObjects(params: QueryParams) {
  return useQuery({
    queryKey: qk.objects(params),
    queryFn: async (): Promise<Paginated<ConstructionObject>> => {
      const { items, meta } = await apiGetPaginated<ConstructionObject>('/objects', { params });
      return { items, meta: meta! };
    },
    // Sahifa almashganda jadval «sakrab» bo‘shamaydi — eski ma’lumot
    // yangisi kelguncha ko‘rinib turadi.
    placeholderData: keepPreviousData,
  });
}

export function useObject(id: string | undefined) {
  return useQuery({
    queryKey: qk.object(id ?? ''),
    queryFn: () => apiGet<ConstructionObject>(`/objects/${id}`),
    enabled: Boolean(id),
  });
}

export function useObjectProgress(id: string | undefined) {
  return useQuery({
    queryKey: qk.objectProgress(id ?? ''),
    queryFn: () => apiGet<ProgressUpdate[]>(`/objects/${id}/progress`),
    enabled: Boolean(id),
  });
}

export function useObjectMilestones(id: string | undefined) {
  return useQuery({
    queryKey: qk.objectMilestones(id ?? ''),
    queryFn: () => apiGet<Milestone[]>(`/objects/${id}/milestones`),
    enabled: Boolean(id),
  });
}

export function useObjectFunding(id: string | undefined) {
  return useQuery({
    queryKey: qk.objectFunding(id ?? ''),
    queryFn: () =>
      apiGet<{ allocations: FundingAllocation[]; transactions: FundingTransaction[] }>(
        `/funding/objects/${id}`,
      ),
    enabled: Boolean(id),
  });
}

export function useObjectAi(id: string | undefined) {
  return useQuery({
    queryKey: qk.objectAi(id ?? ''),
    queryFn: () => apiGet<AiAnalysis[]>(`/ai/objects/${id}`),
    enabled: Boolean(id),
  });
}

export function useObjectsMap(params: QueryParams, enabled = true) {
  return useQuery({
    queryKey: qk.objectsMap(params),
    queryFn: () => apiGet<ObjectMapPoint[]>('/objects/map', { params }),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useAddProgress(objectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { progressPercent: number; reportDate?: string; note?: string }) =>
      apiPost<ConstructionObject>(`/objects/${objectId}/progress`, body),
    onSuccess: () => {
      // ⚠️ Bajarilish o‘zgarsa DASHBOARD ham eskiradi — obyekt holati
      // qayta hisoblanadi va kartalardagi raqamlar siljiydi.
      void queryClient.invalidateQueries({ queryKey: qk.object(objectId) });
      void queryClient.invalidateQueries({ queryKey: qk.objectProgress(objectId) });
      void queryClient.invalidateQueries({ queryKey: ['objects', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ───────────────── Obyekt yaratish va Excel import ───────────────── */

export interface CreateObjectBody {
  name: string;
  districtId: string;
  typeId: string;
  totalCost: string;
  plannedStartDate: string;
  plannedEndDate: string;
  description?: string;
  address?: string;
  lat?: number;
  lng?: number;
  customerId?: string;
  contractorId?: string;
  responsibleId?: string;
  fundingSourceId?: string;
  capacity?: number;
  capacityUnit?: string;
  floors?: number;
}

export function useCreateObject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateObjectBody) => apiPost<ConstructionObject>('/objects', body),
    onSuccess: () => {
      // ⚠️ Yangi obyekt ro‘yxatni ham, DASHBOARDNI ham eskirtiradi:
      // kartalardagi sonlar va tumanlar kesimi darhol o‘zgaradi.
      void queryClient.invalidateQueries({ queryKey: ['objects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * ⚠️ Bajarilish foizi BU YERDAN o‘zgarmaydi — server uni rad etadi.
 * U tarix yozadigan alohida amal (`useAddProgress`), aks holda
 * grafikda sababsiz sakrash paydo bo‘lardi.
 */
export function useUpdateObject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<CreateObjectBody>) =>
      apiPatch<ConstructionObject>(`/objects/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.object(id) });
      void queryClient.invalidateQueries({ queryKey: ['objects'] });
      // Mas'ul yoki pudratchi almashsa, ular bo‘yicha kesimlar ham eskiradi.
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['responsibles'] });
    },
  });
}

export interface ImportRowIssue {
  rowNumber: number;
  column: string | null;
  message: string;
}

export interface ImportRowPreview {
  rowNumber: number;
  name: string;
  districtName: string;
  typeName: string;
  ok: boolean;
}

export interface ImportReport {
  totalRows: number;
  validRows: number;
  dryRun: boolean;
  created: number;
  errors: ImportRowIssue[];
  warnings: ImportRowIssue[];
  rows: ImportRowPreview[];
}

/**
 * ⚠️ `dryRun` MAJBURIY parametr, sukut qiymati yo‘q. Chaqiruvchi har
 * safar «tekshiryapmanmi yoki yozyapmanmi» degan savolga ongli javob
 * berishi kerak — sukut bo‘lsa, kimdir uni tushirib qoldirib, 500 ta
 * obyektni bexosdan yozib yuborardi.
 */
export function useImportObjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, dryRun }: { file: File; dryRun: boolean }) =>
      apiUpload<ImportReport>('/objects/import', [file], {
        field: 'file',
        fields: { dryRun: dryRun ? 'true' : 'false' },
      }),
    onSuccess: (report) => {
      if (report.created > 0) {
        void queryClient.invalidateQueries({ queryKey: ['objects'] });
        void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      }
    },
  });
}

/**
 * Shablonni yuklab olish.
 *
 * ⚠️ Oddiy `<a href>` ISHLAMAYDI: yo‘l `Authorization` sarlavhasini
 * talab qiladi, brauzer esa havolaga uni qo‘shmaydi — javob 401 bo‘lib,
 * foydalanuvchi buzuq fayl olardi.
 */
export function downloadImportTemplate(): Promise<void> {
  return apiDownload('/objects/import/template', 'obyektlar-shablon.xlsx');
}

/* ───────────────────────── Kalendar ───────────────────────── */

export function useCalendar(params: QueryParams) {
  return useQuery({
    queryKey: qk.calendar(params),
    queryFn: () => apiGet<CalendarItem[]>('/calendar', { params }),
    placeholderData: keepPreviousData,
  });
}

/* ───────────────────────── Kechikishlar ───────────────────────── */

export function useDelays(params: QueryParams) {
  return useQuery({
    queryKey: qk.delays(params),
    queryFn: async (): Promise<Paginated<ObjectDelay>> => {
      const { items, meta } = await apiGetPaginated<ObjectDelay>('/delays', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

export function useDelayBreakdown(params: QueryParams) {
  return useQuery({
    queryKey: qk.delayReasons(params),
    queryFn: () => apiGet<import('./types').DelayReasonBreakdown[]>('/delays/reasons-breakdown', { params }),
  });
}

export function useResolveDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      apiPost<ObjectDelay>(`/delays/${id}/resolve`, { resolution }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['delays'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      void queryClient.invalidateQueries({ queryKey: ['objects'] });
    },
  });
}

/* ───────────────────────── Foto, hujjat ───────────────────────── */

export function usePhotoReports(params: QueryParams) {
  return useQuery({
    queryKey: qk.photos(params),
    queryFn: async (): Promise<Paginated<PhotoReport>> => {
      const { items, meta } = await apiGetPaginated<PhotoReport>('/photo-reports', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

export function usePhotoStats(regionId?: string) {
  return useQuery({
    queryKey: qk.photoStats(regionId),
    queryFn: () =>
      apiGet<{ total: number; pending: number; approved: number; rejected: number; aiConfirmed: number; aiSuspicious: number }>(
        '/photo-reports/stats',
        { params: regionId ? { regionId } : {} },
      ),
  });
}

export function useReviewPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'approved' | 'rejected'; reason?: string }) =>
      apiPost<PhotoReport>(`/photo-reports/${id}/review`, { status, reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photos'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Suratlarni yuklash → fayl yozuvlari.
 * ⚠️ Hisobot ALOHIDA bosqichda yaratiladi: yuklov uzilib qolsa, yarim
 * hisobot emas, faqat biriktirilmagan fayl qoladi (u zararsiz).
 */
export function useUploadFiles() {
  return useMutation({
    mutationFn: ({
      files,
      subdir,
      onProgress,
    }: {
      files: File[];
      subdir?: string;
      onProgress?: (percent: number) => void;
    }) => apiUpload<StoredFileRef[]>('/files/upload-many', files, { field: 'files', subdir, onProgress }),
  });
}

export function useCreatePhotoReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      objectId: string;
      fileIds: string[];
      progressPercent: number;
      note?: string;
      capturedAt?: string;
    }) => apiPost<PhotoReport>('/photo-reports', body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photos'] });
      void queryClient.invalidateQueries({ queryKey: ['objects'] });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/**
 * Suratni AI bilan QAYTA tahlil qilish.
 *
 * ⚠️ `recheck` dan farqli: u faqat metama’lumot qoidalarini (vaqt,
 * joylashuv, sakrash) qayta hisoblaydi, bu esa suratlarni MODELGA
 * qaytadan yuboradi. Ikkalasi boshqa narsani tekshiradi.
 */
export function useReanalyzePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost<PhotoReport>(`/photo-reports/${id}/reanalyze`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['photos'] });
    },
  });
}

export function useDocuments(params: QueryParams) {
  return useQuery({
    queryKey: qk.documents(params),
    queryFn: async (): Promise<Paginated<ObjectDocument>> => {
      const { items, meta } = await apiGetPaginated<ObjectDocument>('/documents', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

/* ───────────────────────── Tomonlar ───────────────────────── */

export function useContractors(params: QueryParams) {
  return useQuery({
    queryKey: qk.contractors(params),
    queryFn: async (): Promise<Paginated<Contractor>> => {
      const { items, meta } = await apiGetPaginated<Contractor>('/contractors', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

export function useContractor(id: string | undefined) {
  return useQuery({
    queryKey: qk.contractor(id ?? ''),
    queryFn: () => apiGet<Contractor>(`/contractors/${id}`),
    enabled: Boolean(id),
  });
}

export function useCustomers(params: QueryParams) {
  return useQuery({
    queryKey: qk.customers(params),
    queryFn: async (): Promise<Paginated<Customer>> => {
      const { items, meta } = await apiGetPaginated<Customer>('/customers', { params });
      return { items, meta: meta! };
    },
  });
}

export function useResponsibles(regionId?: string) {
  return useQuery({
    queryKey: qk.responsibles(regionId),
    queryFn: () =>
      apiGet<Array<{ user: UserSummary; objectCount: number; delayedCount: number; atRiskCount: number; avgProgress: number }>>(
        '/users/responsibles',
        { params: regionId ? { regionId } : {} },
      ),
  });
}

export function useUsers(params: QueryParams, options?: Partial<UseQueryOptions<Paginated<UserSummary>>>) {
  return useQuery({
    queryKey: qk.users(params),
    queryFn: async (): Promise<Paginated<UserSummary>> => {
      const { items, meta } = await apiGetPaginated<UserSummary>('/users', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
    ...options,
  });
}

/* ───────────────────────── Moliya ───────────────────────── */

export function useFundingSummary(params: QueryParams) {
  return useQuery({
    queryKey: qk.funding.summary(params),
    queryFn: () => apiGet<FundingSummary>('/funding/summary', { params }),
    placeholderData: keepPreviousData,
  });
}

export function useFundingAllocations(params: QueryParams) {
  return useQuery({
    queryKey: qk.funding.allocations(params),
    queryFn: async (): Promise<Paginated<FundingAllocation>> => {
      const { items, meta } = await apiGetPaginated<FundingAllocation>('/funding/allocations', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

export function useFundingTransactions(params: QueryParams) {
  return useQuery({
    queryKey: qk.funding.transactions(params),
    queryFn: async (): Promise<Paginated<FundingTransaction>> => {
      const { items, meta } = await apiGetPaginated<FundingTransaction>('/funding/transactions', { params });
      return { items, meta: meta! };
    },
    placeholderData: keepPreviousData,
  });
}

/* ───────────────────────── Hisobot va AI ───────────────────────── */

export function useReportSummary(regionId?: string) {
  return useQuery({
    queryKey: qk.reports.summary(regionId),
    queryFn: () =>
      apiGet<{
        byStatus: Array<{ status: string; label: string; count: number; totalCost: string }>;
        byDistrict: DistrictStats[];
        timeline: ProgressTimelinePoint[];
        delaysByStatus: Array<{ status: string; count: number }>;
      }>('/reports/summary', { params: regionId ? { regionId } : {} }),
  });
}

export function useProgressTimeline(params: QueryParams) {
  return useQuery({
    queryKey: qk.reports.timeline(params),
    queryFn: () => apiGet<ProgressTimelinePoint[]>('/reports/progress-timeline', { params }),
  });
}

export function useAiOverview(regionId?: string) {
  return useQuery({
    queryKey: qk.ai(regionId),
    queryFn: () => apiGet<AiOverview>('/ai/overview', { params: regionId ? { regionId } : {} }),
  });
}

/* ───────────────────────── Bildirishnomalar ───────────────────────── */

export function useNotifications(params: QueryParams) {
  return useQuery({
    queryKey: qk.notifications(params),
    queryFn: async (): Promise<Paginated<AppNotification>> => {
      const { items, meta } = await apiGetPaginated<AppNotification>('/notifications', { params });
      return { items, meta: meta! };
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: qk.unreadCount,
    queryFn: () => apiGet<{ count: number }>('/notifications/unread-count'),
    // Qo‘ng‘iroq ustidagi raqam fonda yangilanadi — foydalanuvchi
    // sahifani yangilashi shart emas.
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiPost(`/notifications/${id}/read`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ updated: number }>('/notifications/read-all'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

/* ───────────────────────── Sozlamalar ───────────────────────── */

export interface SettingDefinition {
  key: string;
  value: unknown;
  description: string;
  category: string;
}

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: () => apiGet<Record<string, SettingDefinition[]>>('/settings'),
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) =>
      apiPut<SettingDefinition>(`/settings/${key}`, { value }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.settings });
    },
  });
}

export function useResetSetting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => apiDelete<SettingDefinition>(`/settings/${key}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.settings });
    },
  });
}

/** Katalog yozuvini tahrirlash — sozlamalar sahifasidan. */
export function useUpdateCatalogItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ catalog, id, body }: { catalog: string; id: string; body: Record<string, unknown> }) =>
      apiPatch(`/catalogs/${catalog}/${id}`, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.catalogs });
    },
  });
}
