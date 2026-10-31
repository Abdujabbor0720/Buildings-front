import { RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useCatalogs, useResetSetting, useSettings, useUpdateSetting, type SettingDefinition } from '@/shared/api/queries';
import { ROLE_LABELS } from '@/shared/constants/health';
import {
  Avatar, Badge, Button, Card, CardBody, CardHeader, Input, LoadingBlock, PageHeader, Tabs, type TabOption,
} from '@/shared/ui';
import { useAuthStore } from '@/store/auth.store';
import { useUiStore } from '@/store/ui.store';

type Section = 'profile' | 'system' | 'catalogs';

const CATEGORY_LABELS: Record<string, string> = {
  app: 'Umumiy',
  dashboard: 'Bosh sahifa',
  objects: 'Obyektlar',
  photos: 'Foto-hisobotlar',
  support: 'Yordam markazi',
  general: 'Boshqa',
};

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const can = useAuthStore((state) => state.can);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  const sections: ReadonlyArray<TabOption<Section>> = [
    { value: 'profile', label: 'Profil' },
    ...(can('settings.view') ? ([{ value: 'system', label: 'Tizim sozlamalari' }] as const) : []),
    { value: 'catalogs', label: 'Kataloglar' },
  ];

  const [section, setSection] = useState<Section>('profile');

  return (
    <>
      <PageHeader title="Sozlamalar" description="Profil, tizim parametrlari va ma’lumotnomalar" />
      <div className="mb-4 overflow-x-auto">
        <Tabs options={sections} value={section} onChange={setSection} size="md" />
      </div>

      {section === 'profile' && user ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader title="Mening profilim" />
            <CardBody className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar name={user.fullName} src={user.avatarUrl} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-body font-semibold text-strong">{user.fullName}</p>
                  <p className="truncate text-meta text-muted">{user.position ?? ROLE_LABELS[user.role]}</p>
                </div>
              </div>
              <dl className="space-y-2 text-ui">
                <Row label="Email" value={user.email} />
                <Row label="Rol" value={ROLE_LABELS[user.role]} />
                <Row label="Ruxsatlar" value={`${user.permissions.length} ta`} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ko‘rinish" subtitle="Tanlov shu brauzerda saqlanadi" />
            <CardBody>
              <div className="grid grid-cols-2 gap-2">
                {(['light', 'dark'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={`rounded-xl border-2 p-3 text-left transition-colors ${
                      theme === value ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-subtle hover:bg-neutral-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={`block h-10 rounded-md ${value === 'light' ? 'bg-neutral-100' : 'bg-neutral-800'}`} />
                    <span className="mt-2 block text-meta font-medium text-strong">
                      {value === 'light' ? 'Yorug‘' : 'Qorong‘i'}
                    </span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Ruxsatlar ro‘yxati" subtitle="Rolga biriktirilgan amallar" />
            <CardBody>
              <div className="flex flex-wrap gap-1.5">
                {user.permissions.map((permission) => (
                  <Badge key={permission} className="surface-muted font-mono text-muted">{permission}</Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      {section === 'system' ? <SystemSettings canManage={can('settings.manage')} /> : null}
      {section === 'catalogs' ? <CatalogsView /> : null}
    </>
  );
}

function SystemSettings({ canManage }: { canManage: boolean }) {
  const { data, isLoading } = useSettings();
  if (isLoading) return <LoadingBlock />;

  return (
    <div className="space-y-4">
      {Object.entries(data ?? {}).map(([category, items]) => (
        <Card key={category}>
          <CardHeader title={CATEGORY_LABELS[category] ?? category} />
          <CardBody className="space-y-3">
            {items.map((setting) => (
              <SettingRow
                key={`${setting.key}:${JSON.stringify(setting.value)}`}
                setting={setting}
                canManage={canManage}
              />
            ))}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function SettingRow({ setting, canManage }: { setting: SettingDefinition; canManage: boolean }) {
  const update = useUpdateSetting();
  const reset = useResetSetting();
  const isObject = typeof setting.value === 'object' && setting.value !== null;
  const [draft, setDraft] = useState(() => (isObject ? JSON.stringify(setting.value) : String(setting.value)));

  const dirty = draft !== (isObject ? JSON.stringify(setting.value) : String(setting.value));

  async function save() {
    try {
      let parsed: unknown = draft;
      if (typeof setting.value === 'number') parsed = Number(draft);
      else if (typeof setting.value === 'boolean') parsed = draft === 'true';
      else if (isObject) parsed = JSON.parse(draft);

      await update.mutateAsync({ key: setting.key, value: parsed });
      toast.success('Sozlama saqlandi');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-subtle pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="text-meta font-medium text-strong">{setting.description || setting.key}</p>
        <p className="font-mono text-micro text-muted">{setting.key}</p>
      </div>

      {typeof setting.value === 'boolean' ? (
        <label className="inline-flex cursor-pointer items-center gap-2 text-meta">
          <input
            type="checkbox"
            checked={draft === 'true'}
            disabled={!canManage}
            onChange={(event) => setDraft(String(event.target.checked))}
            className="size-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
          />
          {draft === 'true' ? 'Yoqilgan' : 'O‘chirilgan'}
        </label>
      ) : (
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={!canManage}
          type={typeof setting.value === 'number' ? 'number' : 'text'}
          className="w-56"
        />
      )}

      {canManage ? (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={save} loading={update.isPending} disabled={!dirty} leftIcon={<Save className="size-3.5" />}>
            Saqlash
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => reset.mutate(setting.key)}
            loading={reset.isPending}
            aria-label="Sukut qiymatga qaytarish"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function CatalogsView() {
  const { data, isLoading } = useCatalogs();
  if (isLoading) return <LoadingBlock />;

  const groups: Array<{ title: string; items: typeof data extends undefined ? never : NonNullable<typeof data>['constructionTypes'] }> = [
    { title: 'Qurilish turlari', items: data?.constructionTypes ?? [] },
    { title: 'Moliyalashtirish manbalari', items: data?.fundingSources ?? [] },
    { title: 'Kechikish sabablari', items: data?.delayReasons ?? [] },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {groups.map((group) => (
        <Card key={group.title}>
          <CardHeader title={group.title} subtitle={`${group.items.length} ta yozuv`} />
          <CardBody>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <li key={item.id} className="flex items-center gap-2.5 rounded-lg surface-muted px-2.5 py-2">
                  <span className="size-3 shrink-0 rounded-[3px]" style={{ backgroundColor: item.color }} />
                  <span className="min-w-0 flex-1 truncate text-meta text-strong">{item.name}</span>
                  <span className="mono text-nano text-muted">{item.code}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate font-medium text-strong">{value}</dd>
    </div>
  );
}
