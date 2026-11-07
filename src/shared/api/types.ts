/**
 * Server shartnomasi (API contract).
 * ⚠️ Backend'dagi `src/common/constants/enums.ts` bilan MOS bo‘lishi shart.
 */

export type ObjectStatus = 'not_started' | 'in_progress' | 'completed' | 'suspended' | 'cancelled';
export type ObjectHealth = 'not_started' | 'on_schedule' | 'delayed' | 'at_risk' | 'completed';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type UserRole =
  | 'super_admin' | 'governor' | 'region_admin'
  | 'district_admin' | 'supervisor' | 'contractor' | 'viewer';
export type MilestoneStatus = 'planned' | 'in_progress' | 'done' | 'delayed' | 'cancelled';
export type DelayStatus = 'open' | 'mitigating' | 'resolved';
export type PhotoReportStatus = 'pending' | 'approved' | 'rejected';
export type AiVerdict = 'confirmed' | 'suspicious' | 'rejected' | 'pending';
export type AiAnalysisType =
  | 'delay_forecast'
  | 'risk_score'
  | 'photo_check'
  | 'budget_deviation'
  | 'milestone_progress';
export type DocumentType = 'project' | 'contract' | 'expertise' | 'permit' | 'act' | 'estimate' | 'other';
export type ContractorStatus = 'active' | 'suspended' | 'blacklisted';
export type FundingTxType = 'allocation' | 'payment' | 'adjustment';

/* ───────────────────────── Konvert ───────────────────────── */

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  error: { code: string; message: string; details?: unknown };
  path: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

/* ───────────────────────── Autentifikatsiya ───────────────────────── */

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  shortName: string;
  position: string | null;
  avatarUrl: string | null;
  role: UserRole;
  permissions: string[];
  regionId: string | null;
  districtId: string | null;
  contractorId: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

/* ───────────────────────── Ma’lumotnomalar ───────────────────────── */

export interface Region {
  id: string;
  code: string;
  name: string;
  soato: string | null;
  centerLat: number;
  centerLng: number;
  defaultZoom: number;
  bbox: number[] | null;
}

export interface District {
  id: string;
  code: string;
  name: string;
  shortName: string;
  soato: string | null;
  kind: 'district' | 'city';
  centerLat: number;
  centerLng: number;
  population: number | null;
  areaKm2: number | null;
  regionId: string;
}

export interface CatalogItem {
  id: string;
  code: string;
  name: string;
  color: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface Catalogs {
  constructionTypes: CatalogItem[];
  fundingSources: CatalogItem[];
  delayReasons: CatalogItem[];
}

/* ───────────────────────── Obyekt ───────────────────────── */

export interface Contractor {
  id: string;
  name: string;
  inn: string;
  director: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  licenseNumber: string | null;
  licenseExpiry: string | null;
  rating: number;
  status: ContractorStatus;
  foundedYear: number | null;
  employeesCount: number | null;
  logoUrl: string | null;
  note: string | null;
  objectCount?: number;
  stats?: ContractorStats;
}

export interface ContractorStats {
  totalObjects: number;
  activeObjects: number;
  completedObjects: number;
  delayedObjects: number;
  atRiskObjects: number;
  onTimeCompleted: number;
  avgProgress: number;
  avgDelayDays: number;
  totalContractValue: string;
}

export interface Customer {
  id: string;
  name: string;
  type: string | null;
  inn: string | null;
  head: string | null;
  phone: string | null;
  address: string | null;
  objectCount?: number;
}

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  email: string;
  phone: string | null;
  position: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  regionId: string | null;
  districtId: string | null;
  contractorId: string | null;
  district?: District | null;
  contractor?: Contractor | null;
}

export interface ConstructionObject {
  id: string;
  code: string;
  name: string;
  description: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  districtId: string;
  regionId: string;
  typeId: string;
  customerId: string | null;
  contractorId: string | null;
  responsibleId: string | null;
  fundingSourceId: string | null;
  totalCost: string;
  fundedAmount: string;
  paidAmount: string;
  capacity: number | null;
  capacityUnit: string | null;
  areaM2: number | null;
  floors: number | null;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  status: ObjectStatus;
  progressPercent: number;
  healthStatus: ObjectHealth;
  delayDays: number;
  expectedProgress: number;
  progressGap: number;
  riskLevel: RiskLevel;
  riskScore: number;
  openDelayCount: number;
  lastReportAt: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;

  district?: District;
  region?: Region;
  type?: CatalogItem;
  contractor?: Contractor | null;
  customer?: Customer | null;
  responsible?: UserSummary | null;
  fundingSource?: CatalogItem | null;
  primaryDelayReason?: CatalogItem | null;
}

export interface ObjectMapPoint {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  healthStatus: ObjectHealth;
  progressPercent: number;
  districtName: string;
  typeName: string;
  typeColor: string;
}

export interface ProgressUpdate {
  id: string;
  objectId: string;
  reportDate: string;
  progressPercent: number;
  previousPercent: number;
  note: string | null;
  source: 'manual' | 'photo_report' | 'import';
  createdAt: string;
  author?: UserSummary | null;
}

export interface Milestone {
  id: string;
  objectId: string;
  name: string;
  description: string | null;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  progressPercent: number;
  /** Umumiy bajarilishdagi ulushi, %. Barcha bosqichlarniki = 100. */
  weight: number;
  status: MilestoneStatus;
  sortOrder: number;
  /** Shu bosqichga biriktirilgan ishchilar soni. */
  workerCount: number | null;
  /* ── Topshirish izlari ── */
  submittedAt: string | null;
  submissionNote: string | null;
  /** Shu bosqich bo‘yicha yuborilgan foto-hisobotlar soni. */
  reportCount: number;
  submittedBy?: UserSummary | null;
}

/** `POST /milestones/:id/submit` javobi. */
export interface MilestoneSubmission {
  milestone: Milestone;
  report: PhotoReport;
  /** Obyekt bajarilishi o‘zgargan bo‘lsa — oldingi va yangi qiymat. */
  objectProgress: { previous: number; current: number } | null;
  analysis: AiAnalysis | null;
}

export interface CalendarItem {
  id: string;
  objectId: string;
  objectName: string;
  objectCode: string;
  districtName: string;
  typeColor: string;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  actualEnd: string | null;
  progressPercent: number;
  status: MilestoneStatus;
  isOverdue: boolean;
  overdueDays: number;
}

export interface ObjectDelay {
  id: string;
  objectId: string;
  reasonId: string;
  delayDays: number;
  severity: RiskLevel;
  status: DelayStatus;
  description: string | null;
  mitigationPlan: string | null;
  detectedAt: string;
  resolvedAt: string | null;
  createdAt: string;
  reason?: CatalogItem;
  object?: ConstructionObject;
  responsible?: UserSummary | null;
}

/** Yuklangan fayl yozuvi — hisobotga biriktirish uchun kerak. */
export interface StoredFileRef {
  id: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: string;
  path: string;
  url: string;
}

/** Model suratdan bajarilishni qanday baholaganini ko‘rsatadi. */
export type AiVisionStatus = 'pending' | 'done' | 'unavailable' | 'failed';

/**
 * SURATDAN BAHOLASH NATIJASI.
 * ⚠️ Maydonlar IXTIYORIY: eski hisobotlarda tahlil umuman bo‘lmagan va
 * `jsonb` da saqlangan eski shakllar ham uchraydi.
 */
export interface PhotoVisionAnalysis {
  stage: string;
  estimatedProgressPercent: number;
  rangeMin: number;
  rangeMax: number;
  confidence: number;
  completedWorks: string[];
  remainingWorks: string[];
  matchesReported: boolean;
  discrepancyNote: string;
  imageQuality: 'good' | 'partial' | 'poor';
  summary: string;
  imagesAnalyzed?: number;
  tokensUsed?: number;
  durationMs?: number;
  unavailableReason?: string;
}

export interface PhotoReport {
  id: string;
  objectId: string;
  /** Bosqich topshirilgan bo‘lsa — qaysi bosqich. */
  milestoneId: string | null;
  /** Bosqichning O‘Z foizi (`progressPercent` — OBYEKTNIKI). */
  milestonePercent: number | null;
  capturedAt: string;
  lat: number | null;
  lng: number | null;
  progressPercent: number;
  note: string | null;
  status: PhotoReportStatus;
  aiVerdict: AiVerdict;
  aiConfidence: number | null;
  aiComment: string | null;
  aiCheckedAt: string | null;
  /* ── Suratdan baholash (model) ── */
  aiEstimatedProgress: number | null;
  aiAnalysis: PhotoVisionAnalysis | null;
  aiModel: string | null;
  aiVisionStatus: AiVisionStatus;
  aiVisionAt: string | null;
  aiAttempts: number;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
  images?: Array<{ id: string; url: string; caption: string | null; sortOrder: number }>;
  object?: ConstructionObject;
  author?: UserSummary | null;
  reviewedBy?: UserSummary | null;
}

export interface ObjectDocument {
  id: string;
  objectId: string | null;
  type: DocumentType;
  title: string;
  number: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  url: string | null;
  note: string | null;
  createdAt: string;
  daysUntilExpiry?: number | null;
  object?: ConstructionObject | null;
  uploadedBy?: UserSummary | null;
}

export interface FundingAllocation {
  id: string;
  objectId: string;
  sourceId: string;
  year: number;
  plannedAmount: string;
  allocatedAmount: string;
  paidAmount: string;
  note: string | null;
  source?: CatalogItem;
  object?: ConstructionObject;
}

export interface FundingTransaction {
  id: string;
  objectId: string;
  allocationId: string | null;
  type: FundingTxType;
  amount: string;
  occurredAt: string;
  documentNumber: string | null;
  note: string | null;
  createdAt: string;
  object?: ConstructionObject;
  allocation?: FundingAllocation | null;
  createdBy?: UserSummary | null;
}

export interface FundingSummary {
  totalCost: string;
  totalPlanned: string;
  totalAllocated: string;
  totalPaid: string;
  remainingToAllocate: string;
  remainingToPay: string;
  allocationPercent: number;
  paymentPercent: number;
  byYear: Array<{ year: number; planned: string; allocated: string; paid: string }>;
  bySource: Array<{
    sourceId: string; name: string; color: string;
    planned: string; allocated: string; paid: string; percent: number;
  }>;
}

export interface AiAnalysis {
  id: string;
  objectId: string;
  /** Bosqich tahlili bo‘lsa — qaysi bosqich. Obyekt tahlilida `null`. */
  milestoneId: string | null;
  type: AiAnalysisType;
  score: number;
  riskLevel: RiskLevel;
  summary: string;
  recommendations: string[] | null;
  details: Record<string, unknown> | null;
  model: string;
  createdAt: string;
}

export interface AiOverview {
  topRisks: Array<{
    objectId: string; objectName: string; districtName: string;
    score: number; riskLevel: RiskLevel; summary: string;
  }>;
  distribution: Array<{ level: RiskLevel; count: number; percent: number }>;
  commonRecommendations: Array<{ text: string; count: number }>;
  analyzedObjects: number;
  lastRunAt: string | null;
}

export interface AppNotification {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  body: string;
  objectId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  object?: { id: string; name: string; code: string } | null;
}

/* ───────────────────────── Dashboard ───────────────────────── */

export interface CountPercent {
  count: number;
  percent: number;
}

export interface DashboardSummary {
  total: number;
  buckets: {
    onSchedule: number;
    notStarted: number;
    delayed: number;
    atRisk: number;
    completed: number;
  };
  cards: { onPlan: CountPercent; delayed: CountPercent; atRisk: CountPercent };
  completingThisYear: { year: number; count: number; byMonth: number[] };
  finance: {
    totalCost: string;
    fundedAmount: string;
    paidAmount: string;
    byYear: Array<{ year: number; amount: string; count: number }>;
  };
  avgProgress: number;
  openDelays: number;
}

export interface DistrictStats {
  districtId: string;
  code: string;
  name: string;
  shortName: string;
  centerLat: number;
  centerLng: number;
  total: number;
  onSchedule: number;
  delayed: number;
  atRisk: number;
  notStarted: number;
  completed: number;
  avgProgress: number;
  totalCost: string;
  dominantHealth: ObjectHealth;
}

export interface DeadlineBucket {
  label: string;
  /**
   * ⚠️ `null` IKKI XIL guruhda uchraydi: «Muddati o‘tgan» va «2028+»
   * (ochiq guruh). Shuning uchun u HOLAT BELGISI sifatida
   * ishlatilmaydi — buning uchun `overdue` bor.
   */
  year: number | null;
  /** Muddati ALLAQACHON o‘tgan guruh — tartibli rampadan tashqarida. */
  overdue: boolean;
  count: number;
  percent: number;
  color: string;
}

export interface TypeBreakdownItem {
  typeId: string;
  code: string;
  name: string;
  color: string;
  icon: string | null;
  count: number;
  percent: number;
  totalCost: string;
  avgProgress: number;
}

export interface TopDelayedItem {
  id: string;
  code: string;
  name: string;
  districtName: string;
  plannedEndDate: string;
  delayDays: number;
  progressPercent: number;
  healthStatus: ObjectHealth;
  primaryReason: string | null;
  primaryReasonColor: string | null;
  /** Obyekt mas'uli (kurator). `null` — biriktirilmagan. */
  responsibleName: string | null;
  responsibleFullName: string | null;
  responsiblePosition: string | null;
}

export interface UpcomingItem {
  id: string;
  code: string;
  name: string;
  districtName: string;
  plannedEndDate: string;
  daysLeft: number;
  progressPercent: number;
  healthStatus: ObjectHealth;
  status: ObjectStatus;
}

export interface RecentPhotoItem {
  id: string;
  objectId: string;
  objectName: string;
  districtName: string;
  capturedAt: string;
  progressPercent: number;
  aiVerdict: AiVerdict;
  aiConfidence: number | null;
  imageUrl: string | null;
}

export interface DelayReasonBreakdown {
  reasonId: string;
  code: string;
  name: string;
  color: string;
  icon: string | null;
  count: number;
  percent: number;
  totalDelayDays: number;
  affectedObjects: number;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  districts: DistrictStats[];
  byDeadline: DeadlineBucket[];
  byType: TypeBreakdownItem[];
  topDelayed: TopDelayedItem[];
  delayReasons: DelayReasonBreakdown[];
  upcoming: UpcomingItem[];
  recentPhotos: RecentPhotoItem[];
  generatedAt: string;
}

/* ───────────── Ko‘rsatkichning batafsil sahifasi ───────────── */

/**
 * BOSH SAHIFADAGI OLTITA KARTANING KALITI — URL'da ham shu ko‘rinishda.
 *
 * ⚠️ Serverdagi `KpiMetric` enumi bilan AYNI qiymatlar
 * (`dashboard/dto/kpi-metric.dto.ts`). Bitta harf farq qilsa, havola
 * 400 bilan qaytadi.
 */
export type KpiMetricKey = 'total' | 'on-plan' | 'delayed' | 'at-risk' | 'completing' | 'cost';

/**
 * Taqsimot qatori.
 *
 * ⚠️ `key` — ENUM QIYMATI (`delayed`, `high`, `q3`), ko‘rsatiladigan
 * matn emas: yorliq va rang mijozda (`health.ts`) turadi.
 */
export interface KpiBucket {
  key: string;
  count: number;
  /** Shu ko‘rsatkich to‘plami ichidagi ulush, %. */
  percent: number;
  /** Guruhdagi loyiha qiymati, so‘m. */
  amount: string;
}

export interface KpiDistrictRow {
  districtId: string;
  code: string;
  name: string;
  shortName: string;
  count: number;
  percent: number;
  totalCost: string;
  avgProgress: number;
  delayed: number;
  atRisk: number;
}

export interface KpiTypeRow {
  typeId: string;
  code: string;
  name: string;
  color: string;
  count: number;
  percent: number;
  totalCost: string;
  avgProgress: number;
}

/** Pudratchi / moliya manbasi / kechikish sababi. `id: null` — biriktirilmagan. */
export interface KpiNamedRow {
  id: string | null;
  name: string | null;
  color: string | null;
  count: number;
  percent: number;
  totalCost: string;
  avgProgress: number;
}

/** Yil yoki oy kesimi (`key` — yil raqami yoki 1–12). */
export interface KpiPeriodRow {
  key: number;
  count: number;
  amount: string;
}

export interface KpiMetricDetail {
  metric: KpiMetricKey;
  year: number;
  /** Filtrdagi JAMI obyekt — foizlarning maxraji. */
  scopeTotal: number;
  count: number;
  percentOfScope: number;
  finance: {
    totalCost: string;
    fundedAmount: string;
    paidAmount: string;
    unfunded: string;
    fundedPercent: number;
    paidPercent: number;
  };
  progress: { avg: number; expectedAvg: number; gapAvg: number };
  delays: {
    delayedCount: number;
    avgDelayDays: number;
    maxDelayDays: number;
    over90: number;
    openDelays: number;
    overdue: number;
    avgRiskScore: number;
  };
  coverage: {
    withoutResponsible: number;
    withoutContractor: number;
    withoutCoords: number;
    staleReports: number;
  };
  health: KpiBucket[];
  status: KpiBucket[];
  risk: KpiBucket[];
  progressBuckets: KpiBucket[];
  byDistrict: KpiDistrictRow[];
  byType: KpiTypeRow[];
  byYear: KpiPeriodRow[];
  /** Joriy yil — har doim 12 ta qator, bo‘sh oy ham bor. */
  byMonth: KpiPeriodRow[];
  byFundingSource: KpiNamedRow[];
  byContractor: KpiNamedRow[];
  byDelayReason: KpiNamedRow[];
  generatedAt: string;
}

export interface KpiMetricObject {
  id: string;
  code: string;
  name: string;
  districtName: string;
  typeName: string;
  typeColor: string;
  plannedEndDate: string;
  daysLeft: number;
  progressPercent: number;
  expectedProgress: number;
  healthStatus: ObjectHealth;
  status: ObjectStatus;
  delayDays: number;
  riskLevel: RiskLevel;
  riskScore: number;
  totalCost: string;
  fundedAmount: string;
  contractorName: string | null;
  responsibleName: string | null;
  primaryReason: string | null;
  lastReportAt: string | null;
}

/** Xarita uchun GeoJSON — chegara + jonli statistika bitta javobda. */
export interface DistrictGeoJson {
  type: 'FeatureCollection';
  bbox: number[] | null;
  features: Array<{
    type: 'Feature';
    geometry: GeoJSON.Geometry | null;
    properties: DistrictStats & { soato: string | null; kind: string };
  }>;
}

/** Tuman xaritasidagi obyekt nuqtasi. */
export interface MapObjectPoint {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  healthStatus: ObjectHealth;
  progressPercent: number;
  /** `null` — mahalla chegarasi yo‘q yoki obyekt ularning tashqarisida. */
  mahallaId: string | null;
}

/**
 * TUMAN XARITASI — mahalla chegaralari, obyekt nuqtalari va tumanning
 * o‘z konturi BITTA javobda.
 *
 * ⚠️ `features[].properties` shakli `DistrictGeoJson` BILAN AYNI
 * (`DistrictStats`). Bu ataylab: bitta xarita komponenti va bitta
 * jadval ikkala darajani ham chizadi. Shakl farq qilsa, mahalla uchun
 * butun boshqa ekran yozishga to‘g‘ri kelardi.
 */
export interface MahallaGeoJson {
  type: 'FeatureCollection';
  district: {
    id: string;
    code: string;
    name: string;
    shortName: string;
    centerLat: number;
    centerLng: number;
    geometry: GeoJSON.Geometry | null;
  };
  bbox: number[] | null;
  /** Qoplama o‘lchovi — ekranda ochiq aytiladi, yashirilmaydi. */
  coverage: { mahallas: number; withMahalla: number; withoutMahalla: number };
  objects: MapObjectPoint[];
  features: Array<{
    type: 'Feature';
    geometry: GeoJSON.Geometry | null;
    properties: DistrictStats & { officialName: string | null };
  }>;
}

export interface ProgressTimelinePoint {
  month: string;
  label: string;
  avgProgress: number;
  updates: number;
  completed: number;
}
