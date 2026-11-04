import {
  Check,
  Mail,
  Minus,
  Moon,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sun,
  Tags,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import {
  useCatalogs,
  useResetSetting,
  useSettings,
  useUpdateSetting,
  type SettingDefinition,
} from '@/shared/api/queries';
import { ROLE_LABELS } from '@/shared/constants/health';
import { PERMISSION_GROUPS, unknownPermissions } from '@/shared/constants/permissions';
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  ErrorState,
  Input,
  LoadingBlock,
  PageHeader,
  Tabs,
  type TabOption,
} from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';
import { CATEGORY_META, CATEGORY_ORDER, SETTING_META } from './settings.meta';

type Section = 'profile' | 'system' | 'catalogs';

/**
 * SOZLAMALAR.
 *
 * ⚠️ Bu sahifada KOD KALITLARI KO‘RSATILMAYDI — na ruxsatlar
 * (`objects.create`), na sozlamalar (`photos.maxDistanceMeters`).
 * Uni dasturchi emas, hokimlik xodimi ochadi: unga «qaysi
 * o‘zgaruvchi» emas, «bu nimaga ta’sir qiladi» kerak. Tarjima ikki
 * joyda: `shared/constants/permissions.ts` va `settings.meta.ts`.
 */
export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const can = useAuthStore((state) => state.can);

  const sections: ReadonlyArray<TabOption<Section>> = [
    { value: 'profile', label: 'Profil va huquqlar' },
    ...(can('settings.view') ? ([{ value: 'system', label: 'Tizim sozlamalari' }] as const) : []),
    { value: 'catalogs', label: 'Ma’lumotnomalar' },
  ];

  const [section, setSection] = useState<Section>('profile');

  return (
    <>
      <PageHeader
        title="Sozlamalar"
        description="Profilingiz, tizim parametrlari va ma’lumotnomalar"
      />

      <div className="mb-4 overflow-x-auto">
        <Tabs options={sections} value={section} onChange={setSection} size="md" />
      </div>

      {section === 'profile' && user ? <ProfileSection user={user} /> : null}
      {section === 'system' ? <SystemSettings canManage={can('settings.manage')} /> : null}
      {section === 'catalogs' ? <CatalogsView /> : null}
    </>
  );
}

/* ═══════════════════ Profil va huquqlar ═══════════════════ */

function ProfileSection({ user }: { user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']> }) {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const granted = useMemo(() => new Set(user.permissions), [user.permissions]);
  const extra = useMemo(() => unknownPermissions(user.permissions), [user.permissions]);

  const openGroups = PERMISSION_GROUPS.filter((group) =>
    group.actions.some((action) => granted.has(action.key)),
  ).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ───── Profil ───── */}
        <Card>
          <CardHeader title="Mening profilim" />
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3.5">
              <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-lede font-semibold text-strong">{user.fullName}</p>
                <p className="truncate text-meta text-muted">
                  {user.position ?? ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>

            <dl className="grid gap-2.5 sm:grid-cols-2">
              <Fact icon={<Mail className="size-3.5" />} label="Email" value={user.email} />
              <Fact
                icon={<ShieldCheck className="size-3.5" />}
                label="Tizimdagi roli"
                value={ROLE_LABELS[user.role]}
              />
            </dl>

            {/* ⚠️ «23 ta ruxsat» o‘zicha hech narsa demaydi — shuning
                uchun yoniga «nechta bo‘limda» qo‘shiladi va pastda
                har bir bo‘lim ochib beriladi. */}
            <p className="rounded-xl surface-muted px-3.5 py-2.5 text-meta text-muted">
              Sizga <span className="font-semibold text-strong">{user.permissions.length} ta amal</span>{' '}
              ochilgan — tizimning{' '}
              <span className="font-semibold text-strong">{openGroups} ta bo‘limida</span>. To‘liq
              ro‘yxat quyida.
            </p>
          </CardBody>
        </Card>

        {/* ───── Ko‘rinish ───── */}
        <Card>
          <CardHeader
            title="Ko‘rinish"
            subtitle="Tanlov faqat shu brauzerda saqlanadi — boshqa xodimlarga ta’sir qilmaydi"
            action={<Palette className="size-4 text-muted" />}
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-3">
              <ThemeOption
                active={theme === 'light'}
                onSelect={() => setTheme('light')}
                label="Yorug‘"
                hint="Kunduzgi ish uchun"
                icon={<Sun className="size-3.5" />}
                variant="light"
              />
              <ThemeOption
                active={theme === 'dark'}
                onSelect={() => setTheme('dark')}
                label="Qorong‘i"
                hint="Kam yorug‘likda ko‘zni charchatmaydi"
                icon={<Moon className="size-3.5" />}
                variant="dark"
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* ───── Huquqlar ───── */}
      <Card>
        <CardHeader
          title="Sizga ochiq bo‘limlar va amallar"
          subtitle="Yashil belgi — amal sizga ochiq. Chiziqcha — bu amalni bajara olmaysiz."
        />
        {/* ⚠️ GRID emas, USTUNLAR (`columns-*`): bo‘limlarda amallar
            soni har xil (1 tadan 5 tagacha) va gridda bitta qatordagi
            kartalar eng balandiga tenglashib, kalta kartalar ostida
            bo‘sh joy qolardi. Ustunlarda kartalar zich joylashadi. */}
        <CardBody className="gap-3 md:columns-2 xl:columns-3 [&>*]:mb-3 [&>*]:break-inside-avoid">
          {PERMISSION_GROUPS.map((group) => {
            const Icon = group.icon;
            const allowed = group.actions.filter((action) => granted.has(action.key)).length;
            const closed = allowed === 0;

            return (
              <div
                key={group.key}
                className={cn(
                  'rounded-xl p-3.5 transition-colors',
                  closed
                    ? 'surface-muted opacity-70'
                    : 'shadow-[inset_0_0_0_1px_var(--border-subtle)]',
                )}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      'grid size-8 shrink-0 place-items-center rounded-lg',
                      closed
                        ? 'bg-neutral-200/70 text-neutral-500 dark:bg-white/8 dark:text-neutral-400'
                        : 'bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-400',
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-strong">{group.label}</p>
                    <p className="mt-0.5 text-micro leading-snug text-muted">{group.description}</p>
                  </div>
                  <span
                    className={cn(
                      'num shrink-0 rounded-md px-1.5 py-0.5 text-nano font-semibold',
                      closed
                        ? 'bg-neutral-200/70 text-neutral-500 dark:bg-white/8 dark:text-neutral-400'
                        : 'bg-ok-50 text-ok-700 dark:bg-ok-500/12 dark:text-ok-400',
                    )}
                  >
                    {allowed}/{group.actions.length}
                  </span>
                </div>

                <ul className="mt-2.5 space-y-1">
                  {group.actions.map((action) => {
                    const on = granted.has(action.key);
                    return (
                      <li key={action.key} className="flex items-center gap-2 text-meta">
                        <span
                          className={cn(
                            'grid size-4 shrink-0 place-items-center rounded-full',
                            on
                              ? 'bg-ok-500 text-white'
                              : 'bg-neutral-200 text-neutral-400 dark:bg-white/10 dark:text-neutral-500',
                          )}
                        >
                          {on ? <Check className="size-2.5" strokeWidth={3.2} /> : <Minus className="size-2.5" strokeWidth={3.2} />}
                        </span>
                        <span className={on ? 'text-strong' : 'text-faint line-through'}>
                          {action.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </CardBody>

        {/* ⚠️ Ro‘yxatda yo‘q ruxsat JIM O‘TKAZILMAYDI: u serverga yangi
            huquq qo‘shilib, tarjima yangilanmaganini bildiradi. */}
        {extra.length > 0 ? (
          <p className="mt-3 rounded-lg bg-warn-50 px-3 py-2 text-meta text-warn-700 dark:bg-warn-500/10 dark:text-warn-500">
            Tarjimasi hali yozilmagan {extra.length} ta ruxsat: {extra.join(', ')}
          </p>
        ) : null}
      </Card>
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl surface-muted px-3 py-2">
      <dt className="flex items-center gap-1.5 text-micro text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 truncate text-meta font-semibold text-strong" title={value}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Mavzu tanlovi — kichik MAKET bilan.
 *
 * ⚠️ Ilgari bu yerda shunchaki kulrang to‘rtburchak turardi va
 * «Yorug‘» bilan «Qorong‘i» orasidagi farq faqat yozuvdan bilinardi.
 * Kichik maket (yon menyu + ikkita karta) tanlovdan keyin ekran
 * qanday ko‘rinishini OLDINDAN ko‘rsatadi.
 */
function ThemeOption({
  active,
  onSelect,
  label,
  hint,
  icon,
  variant,
}: {
  active: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
  icon: React.ReactNode;
  variant: 'light' | 'dark';
}) {
  const dark = variant === 'dark';
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'rounded-xl p-2.5 text-left transition-shadow',
        active
          ? 'shadow-[0_0_0_2px_var(--color-brand-500)]'
          : 'shadow-[inset_0_0_0_1px_var(--border-subtle)] hover:shadow-[inset_0_0_0_1px_var(--border-strong)]',
      )}
    >
      <span
        className={cn(
          'flex h-16 gap-1 overflow-hidden rounded-lg p-1.5',
          dark ? 'bg-[#0d1721]' : 'bg-[#f1f6fb]',
        )}
        aria-hidden
      >
        <span className={cn('w-1/4 rounded-[3px]', dark ? 'bg-[#02183a]' : 'bg-[#02183a]')} />
        <span className="flex flex-1 flex-col gap-1">
          <span className={cn('h-1/3 rounded-[3px]', dark ? 'bg-[#1b2937]' : 'bg-white')} />
          <span className={cn('flex-1 rounded-[3px]', dark ? 'bg-[#1b2937]' : 'bg-white')} />
        </span>
      </span>

      <span className="mt-2 flex items-center gap-1.5">
        <span className={active ? 'text-brand-600 dark:text-brand-400' : 'text-muted'}>{icon}</span>
        <span className="text-meta font-semibold text-strong">{label}</span>
        {active ? (
          <span className="ml-auto grid size-4 place-items-center rounded-full bg-brand-500 text-white">
            <Check className="size-2.5" strokeWidth={3.2} />
          </span>
        ) : null}
      </span>
      <span className="mt-0.5 block text-nano text-muted">{hint}</span>
    </button>
  );
}

/* ═══════════════════ Tizim sozlamalari ═══════════════════ */

function SystemSettings({ canManage }: { canManage: boolean }) {
  const { data, isLoading, isError, error, refetch } = useSettings();

  if (isLoading) return <LoadingBlock />;
  // ⚠️ XATO HOLATI MAJBURIY. Busiz so‘rov yiqilganda sahifa BO‘SH
  // ro‘yxat ko‘rsatardi — foydalanuvchi «ma’lumot yo‘q» deb o‘ylab,
  // aslida tarmoq uzilganini bilmay qolardi.
  if (isError) return <ErrorState message={getErrorMessage(error)} onRetry={() => void refetch()} />;

  const entries = Object.entries(data ?? {});
  // ⚠️ Tartib QAT'IY: server obyektining kalit tartibi kafolatlanmagan
  // va sozlamalar har yangilanishda joyini almashtirib turardi.
  entries.sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a[0]) + 1 || 99) - (CATEGORY_ORDER.indexOf(b[0]) + 1 || 99),
  );

  return (
    <div className="space-y-4">
      {!canManage ? (
        <p className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-meta text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">
          Sozlamalarni ko‘rishingiz mumkin, lekin o‘zgartirish huquqi yo‘q. O‘zgartirish kerak
          bo‘lsa, bosh administratorga murojaat qiling.
        </p>
      ) : null}

      {entries.map(([category, items]) => {
        const meta = CATEGORY_META[category];
        const Icon = meta?.icon;
        return (
          <Card key={category}>
            <CardHeader
              title={
                <span className="flex items-center gap-2">
                  {Icon ? (
                    <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/12 dark:text-brand-400">
                      <Icon className="size-4" strokeWidth={2} />
                    </span>
                  ) : null}
                  {meta?.label ?? category}
                </span>
              }
              subtitle={meta?.hint}
            />
            <CardBody className="divide-y divide-[color:var(--border-cell)]">
              {items.map((setting) => (
                <SettingRow
                  key={`${setting.key}:${JSON.stringify(setting.value)}`}
                  setting={setting}
                  canManage={canManage}
                />
              ))}
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

/** Obyekt qiymatli sozlama uchun qulay tahrir: har kalit — alohida maydon. */
type Draft = Record<string, string>;

function SettingRow({ setting, canManage }: { setting: SettingDefinition; canManage: boolean }) {
  const update = useUpdateSetting();
  const reset = useResetSetting();
  const meta = SETTING_META[setting.key];

  const isObject = typeof setting.value === 'object' && setting.value !== null;
  const initial = useMemo<Draft>(() => {
    if (isObject) {
      return Object.fromEntries(
        Object.entries(setting.value as Record<string, unknown>).map(([k, v]) => [k, String(v)]),
      );
    }
    return { value: String(setting.value) };
  }, [isObject, setting.value]);

  const [draft, setDraft] = useState<Draft>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const fieldOrder = useMemo(() => {
    const keys = Object.keys(initial);
    const preferred = meta?.fields ? Object.keys(meta.fields) : [];
    return [...preferred.filter((k) => keys.includes(k)), ...keys.filter((k) => !preferred.includes(k))];
  }, [initial, meta]);

  async function save() {
    try {
      let parsed: unknown;
      if (isObject) parsed = draft;
      else if (typeof setting.value === 'number') parsed = Number(draft.value);
      else if (typeof setting.value === 'boolean') parsed = draft.value === 'true';
      else parsed = draft.value;

      await update.mutateAsync({ key: setting.key, value: parsed });
      toast.success(`«${meta?.label ?? setting.description}» saqlandi`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  async function restore() {
    try {
      await reset.mutateAsync(setting.key);
      toast.success('Sukut qiymatga qaytarildi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-2.5 py-3 first:pt-0 last:pb-0">
      <div className="min-w-[200px] flex-1">
        {/* ⚠️ Kod kaliti KO‘RSATILMAYDI. Ilgari u nom ostida
            `font-mono` bilan turardi va sahifani «dasturchi paneli»
            ga o‘xshatib yuborardi. */}
        <p className="text-ui font-medium text-strong">
          {meta?.label ?? setting.description ?? setting.key}
        </p>
        <p className="mt-0.5 text-meta leading-snug text-muted">
          {meta?.hint ?? setting.description}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {typeof setting.value === 'boolean' ? (
          <Toggle
            on={draft.value === 'true'}
            disabled={!canManage}
            onToggle={(next) => setDraft({ value: String(next) })}
          />
        ) : isObject ? (
          <div className="grid gap-1.5">
            {/* ⚠️ Tartib TA'RIFDAN olinadi, qiymat obyektining kalit
                tartibidan emas: bazadagi JSON kalitlari istalgan
                tartibda saqlanishi mumkin va maydonlar har
                yangilanishda joyini almashtirardi. */}
            {fieldOrder.map((field) => (
              <label key={field} className="flex items-center gap-2">
                <span className="w-[132px] shrink-0 text-right text-micro text-muted">
                  {meta?.fields?.[field] ?? field}
                </span>
                <Input
                  value={draft[field] ?? ''}
                  disabled={!canManage}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, [field]: event.target.value }))
                  }
                  className="w-64"
                />
              </label>
            ))}
          </div>
        ) : (
          <span className="relative inline-flex items-center">
            <Input
              value={draft.value}
              disabled={!canManage}
              type={typeof setting.value === 'number' ? 'number' : 'text'}
              onChange={(event) => setDraft({ value: event.target.value })}
              /* ⚠️ Matn maydoni kengroq: «Qurilish obyektlari nazorati
                 tizimi» 52 (208px) ga sig‘may, qirqilib turardi. */
              className={cn(typeof setting.value === 'number' ? 'w-40' : 'w-72', meta?.unit && 'pr-14')}
            />
            {meta?.unit ? (
              <span className="text-faint pointer-events-none absolute right-3 text-meta">
                {meta.unit}
              </span>
            ) : null}
          </span>
        )}

        {/* ⚠️ Konteyner kengligi QAT'IY. «Saqlash» faqat qiymat
            o‘zgarganda ko‘rinadi, lekin joyi saqlanib qoladi — aks
            holda tugma paydo bo‘lganda butun qator chapga siljib,
            foydalanuvchi yozayotgan maydon o‘rnidan qochardi.
            Ilgari tugma har qatorda o‘chiq holda turardi: o‘n bitta
            «ishlamaydigan» tugma sahifani buzardi. */}
        {canManage ? (
          <div className="flex w-[116px] shrink-0 items-center justify-end gap-1.5">
            {dirty ? (
              <Button
                size="sm"
                onClick={save}
                loading={update.isPending}
                leftIcon={<Save className="size-3.5" />}
              >
                Saqlash
              </Button>
            ) : null}
            <button
              type="button"
              onClick={restore}
              disabled={reset.isPending}
              title="Boshlang‘ich qiymatga qaytarish"
              aria-label="Boshlang‘ich qiymatga qaytarish"
              className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-neutral-100 hover:text-strong disabled:opacity-50 dark:hover:bg-white/8"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Haqiqiy kalit (switch) — oddiy «checkbox» emas. */
function Toggle({
  on,
  disabled,
  onToggle,
}: {
  on: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <label className={cn('inline-flex items-center gap-2.5', disabled && 'opacity-60')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => onToggle(!on)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          on ? 'bg-ok-500' : 'bg-neutral-300 dark:bg-white/20',
          !disabled && 'cursor-pointer',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[left] duration-150',
            on ? 'left-[22px]' : 'left-0.5',
          )}
        />
      </button>
      <span className="text-meta font-medium text-strong">{on ? 'Yoqilgan' : 'O‘chirilgan'}</span>
    </label>
  );
}

/* ═══════════════════ Ma’lumotnomalar ═══════════════════ */

function CatalogsView() {
  const { data, isLoading } = useCatalogs();
  if (isLoading) return <LoadingBlock />;

  const groups = [
    {
      title: 'Qurilish turlari',
      hint: 'Obyekt qaysi sohaga tegishli',
      items: data?.constructionTypes ?? [],
    },
    {
      title: 'Moliyalashtirish manbalari',
      hint: 'Mablag‘ qayerdan ajratilgani',
      items: data?.fundingSources ?? [],
    },
    {
      title: 'Kechikish sabablari',
      hint: 'Muammo sababini tanlash uchun',
      items: data?.delayReasons ?? [],
    },
  ];

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2.5 rounded-xl bg-brand-50 px-3.5 py-2.5 text-meta text-brand-900 dark:bg-brand-500/10 dark:text-brand-200">
        <Tags className="mt-0.5 size-4 shrink-0" />
        {/* ⚠️ Nima uchun tahrirlab bo‘lmasligi AYTILADI. Sababsiz
            «faqat ko‘rish» ro‘yxati buzuq sahifa taassurotini
            qoldiradi. */}
        <span>
          Ma’lumotnomalar — obyekt qo‘shishda va hisobotlarda ishlatiladigan tayyor ro‘yxatlar.
          Ularning rangi butun tizimdagi diagrammalarda bir xil ishlatiladi, shuning uchun
          o‘zgartirish alohida amal sifatida bajariladi.
        </span>
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <Card key={group.title}>
            <CardHeader title={group.title} subtitle={group.hint} />
            <CardBody>
              <p className="mb-2 text-micro text-muted">{group.items.length} ta yozuv</p>
              <ul className="divide-y divide-[color:var(--border-cell)]">
                {group.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-2.5 py-2">
                    <span
                      className="size-3.5 shrink-0 rounded-md"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-meta text-strong">
                      {item.name}
                    </span>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
