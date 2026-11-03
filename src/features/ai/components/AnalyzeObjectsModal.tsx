import { CheckCheck, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/shared/api/client';
import { useAnalyzeMany, useObjects, type AnalyzeManyResult } from '@/shared/api/queries';
import { HEALTH_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Badge, Button, LoadingBlock, Modal, SearchInput } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { formatPercent } from '@/shared/utils/money.utils';
import { useFiltersStore } from '@/store/filters.store';

/** Serverdagi `ArrayMaxSize` bilan AYNI — ikkisi ajralib ketmasligi kerak. */
const MAX_SELECTION = 50;
const PAGE_SIZE = 40;

/**
 * TANLANGAN OBYEKTLARNI TAHLIL QILISH.
 *
 * ⚠️ «Hozir tahlil qilish» (butun baza) dan ALOHIDA tugma va alohida
 * yo‘l: u `settings.manage` talab qiladi va yuzlab obyektni aylanadi.
 * Bu yerda esa odam bir nechtasini ongli ravishda belgilaydi — shuning
 * uchun ruxsat obyektni ko‘rish darajasida qoladi.
 *
 * ⚠️ «Hammasini belgilash» FAQAT ro‘yxatda ko‘rinib turganlarni
 * belgilaydi. Ko‘rinmagan obyektni jimgina tanlash — foydalanuvchi
 * nimani yuborganini bilmay qoladigan holat.
 */
export function AnalyzeObjectsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { regionId } = useFiltersStore();
  const analyze = useAnalyzeMany();

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 350);
  const [selected, setSelected] = useState<string[]>([]);
  const [withMilestones, setWithMilestones] = useState(true);
  const [result, setResult] = useState<AnalyzeManyResult | null>(null);

  const sessionKey = open ? 'open' : null;
  const [lastKey, setLastKey] = useState<string | null>(null);
  if (sessionKey !== lastKey) {
    setLastKey(sessionKey);
    setSelected([]);
    setSearch('');
    setResult(null);
  }

  const { data, isFetching } = useObjects({
    limit: PAGE_SIZE,
    sortBy: 'riskScore',
    sortOrder: 'DESC',
    ...(regionId ? { regionId } : {}),
    ...(debounced.trim() ? { search: debounced.trim() } : {}),
  });

  const items = useMemo(() => data?.items ?? [], [data]);
  const allVisibleSelected =
    items.length > 0 && items.every((item) => selected.includes(item.id));

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_SELECTION) {
        toast.error(`Bir vaqtda ko‘pi bilan ${MAX_SELECTION} ta obyekt tanlanadi`);
        return current;
      }
      return [...current, id];
    });
  }

  function toggleAllVisible() {
    if (allVisibleSelected) {
      setSelected((current) => current.filter((id) => !items.some((item) => item.id === id)));
      return;
    }
    setSelected((current) => {
      const merged = new Set(current);
      for (const item of items) {
        if (merged.size >= MAX_SELECTION) break;
        merged.add(item.id);
      }
      return [...merged];
    });
  }

  async function run() {
    if (selected.length === 0) return;
    try {
      const response = await analyze.mutateAsync({ objectIds: selected, withMilestones });
      setResult(response);
      toast.success(`${response.analyzed} ta obyekt tahlil qilindi`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  /* ───── Natija ───── */
  if (result) {
    const failures = result.results.filter((item) => !item.ok);
    return (
      <Modal
        open={open}
        onClose={onClose}
        size="lg"
        title="Tahlil yakunlandi"
        description="Natijalar obyekt kartasidagi «AI tahlil» bo‘limida ko‘rinadi."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResult(null)}>
              Yana tahlil qilish
            </Button>
            <Button onClick={onClose}>Yopish</Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Tahlil qilindi" value={result.analyzed} tone="text-ok-600 dark:text-ok-500" />
            <Stat label="Bosqich tahlili" value={result.milestones} />
            <Stat
              label="Xatolik"
              value={result.failed}
              tone={result.failed > 0 ? 'text-danger-600 dark:text-danger-400' : undefined}
            />
          </div>

          {/* ⚠️ Yiqilganlar RO‘YXAT bilan: «3 tasida xatolik» degan raqam
              qaysi obyektni qayta urinib ko‘rish kerakligini aytmaydi. */}
          {failures.length > 0 ? (
            <ul className="space-y-1.5 rounded-xl surface-muted p-3">
              {failures.map((item) => (
                <li key={item.objectId} className="text-meta text-muted">
                  <span className="mono text-micro">{item.objectId.slice(0, 8)}</span> — {item.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Modal>
    );
  }

  /* ───── Tanlov ───── */
  return (
    <Modal
      open={open}
      onClose={analyze.isPending ? () => undefined : onClose}
      size="lg"
      title="Obyektlarni tanlab tahlil qilish"
      description="Bir nechta obyektni belgilang — risk, kechikish prognozi va byudjet og‘ishi qayta hisoblanadi."
      footer={
        <>
          <span className="num mr-auto text-meta text-muted">
            {selected.length} / {MAX_SELECTION} tanlandi
          </span>
          <Button variant="secondary" onClick={onClose} disabled={analyze.isPending}>
            Bekor qilish
          </Button>
          <Button
            onClick={run}
            loading={analyze.isPending}
            disabled={selected.length === 0}
            leftIcon={<Sparkles className="size-3.5" />}
          >
            Tahlil qilish
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onValueChange={setSearch}
            placeholder="Nomi yoki kodi bo‘yicha…"
            className="min-w-[200px] flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleAllVisible}
            disabled={items.length === 0}
            leftIcon={<CheckCheck className="size-3.5" />}
          >
            {allVisibleSelected ? 'Belgini olish' : 'Ko‘rinayotganlarni belgilash'}
          </Button>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg surface-muted px-3 py-2 text-meta">
          <input
            type="checkbox"
            checked={withMilestones}
            onChange={(event) => setWithMilestones(event.target.checked)}
            className="size-3.5 accent-[var(--color-brand-500)]"
          />
          <span className="text-strong">Har bosqich alohida tahlil qilinsin</span>
          <span className="text-muted">— ish rejasi bor obyektlar uchun</span>
        </label>

        {isFetching && items.length === 0 ? (
          <LoadingBlock />
        ) : items.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-8 text-meta text-muted">
            <Search className="size-4" />
            Obyekt topilmadi
          </p>
        ) : (
          <ul className="max-h-[320px] space-y-1 overflow-y-auto pr-1">
            {items.map((object) => {
              const checked = selected.includes(object.id);
              const health = HEALTH_META[object.healthStatus];
              return (
                <li key={object.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors',
                      checked ? 'bg-brand-50 dark:bg-brand-500/10' : 'hover:bg-neutral-100/70 dark:hover:bg-white/5',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(object.id)}
                      className="size-3.5 shrink-0 accent-[var(--color-brand-500)]"
                    />
                    <span className="mono text-micro text-muted">{object.code}</span>
                    <span className="min-w-0 flex-1 truncate text-meta text-strong">{object.name}</span>
                    <span className="num shrink-0 text-micro text-muted">
                      {formatPercent(object.progressPercent)}
                    </span>
                    <Badge className={health.chip}>{health.label}</Badge>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl surface-muted px-3.5 py-3 text-center">
      <p className="text-micro text-muted">{label}</p>
      <p className={`num mt-1 text-lede font-bold ${tone ?? 'text-strong'}`}>{value}</p>
    </div>
  );
}
