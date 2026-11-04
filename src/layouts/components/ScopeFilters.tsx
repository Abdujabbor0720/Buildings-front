import { Popover, PopoverButton, PopoverPanel, Transition } from '@headlessui/react';
import { CalendarRange, Check, ChevronDown, MapPin } from 'lucide-react';
import { Fragment, useMemo } from 'react';
import { useDistricts, useRegions } from '@/shared/api/queries';
import { Button } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';
import { useFiltersStore } from '@/store/filters.store';

/**
 * Sarlavhadagi QAMROV boshqaruvlari: viloyat, tuman(lar) va yil oralig‘i.
 * ⚠️ Holat `filters.store` da — bu filtr barcha sahifalarga ta’sir qiladi
 * va sahifalar almashganda saqlanib qoladi.
 */
export function ScopeFilters() {
  const { regionId, districtIds, yearFrom, yearTo, setRegion, toggleDistrict, setDistricts, setYearRange } =
    useFiltersStore();

  const { data: regions } = useRegions();
  const activeRegionId = regionId ?? regions?.[0]?.id;
  const { data: districts } = useDistricts(activeRegionId);

  const activeRegion = regions?.find((r) => r.id === activeRegionId) ?? regions?.[0];

  const districtLabel = useMemo(() => {
    if (districtIds.length === 0) return 'Barcha tumanlar';
    if (districtIds.length === 1) {
      return districts?.find((d) => d.id === districtIds[0])?.shortName ?? '1 ta tuman';
    }
    return `${districtIds.length} ta tuman`;
  }, [districtIds, districts]);

  return (
    <div className="flex items-center gap-2">
      {/* ───── Viloyat ───── */}
      <Popover className="relative">
        {/* ⚠️ Faqat BIRINCHI filtr to‘ldirilgan — u butun ekrandagi
            ma’lumot qaysi hududga tegishli ekanini aytadi va qolgan
            boshqaruvlar unga bo‘ysunadi. Ikkinchi, uchinchisi ham
            to‘ldirilsa, sarlavha uchta bir xil «tugma» qatoriga aylanib,
            qaysi biri asosiy ekani yo‘qolardi. */}
        {/* ⚠️ Faol tab bilan AYNI ko'rinish (gradient + o'z rangidagi
            soya): sarlavhadagi asosiy tugma va karta ichidagi faol
            segment bitta ekranda turadi — ikkalasi boshqa-boshqa
            ko'kda bo'lsa, interfeys ikki qo'ldan yig'ilgan bo'lib
            ko'rinardi. */}
        <PopoverButton className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-linear-to-b from-brand-400 to-brand-600 px-2.5 text-meta font-semibold text-white shadow-[var(--shadow-brand)] transition-[filter] hover:brightness-110 focus:outline-none">
          <MapPin className="size-3.5" />
          <span className="hidden sm:inline">Viloyat</span>
          <ChevronDown className="size-3.5 opacity-80" />
        </PopoverButton>
        <DropdownPanel>
          {({ close }) => (
            <ul className="py-1">
              {(regions ?? []).map((region) => (
                <li key={region.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setRegion(region.id);
                      close();
                    }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-ui transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6',
                      region.id === activeRegionId && 'font-medium text-strong',
                    )}
                  >
                    {region.name}
                    {region.id === activeRegionId ? <Check className="size-4" /> : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DropdownPanel>
      </Popover>

      <span className="bg-line mx-1 hidden h-4 w-px md:block" aria-hidden />

      {/* ───── Tuman ───── */}
      <Popover className="relative hidden md:block">
        <PopoverButton className="inline-flex h-8 max-w-[280px] items-center gap-1.5 rounded-lg surface px-2.5 text-meta text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.1)] transition-colors hover:bg-neutral-100 focus:outline-none dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:bg-white/8">
          <span className="truncate">{activeRegion?.name ?? 'Viloyat'}</span>
          <span className="text-faint shrink-0">·</span>
          <span className="shrink-0 truncate text-muted">{districtLabel}</span>
          <ChevronDown className="text-faint size-3.5 shrink-0" />
        </PopoverButton>
        <DropdownPanel className="w-72">
          {() => (
            <>
              <div className="flex items-center justify-between border-b border-subtle px-3 py-2">
                <span className="t-label">Tumanlar</span>
                <button
                  type="button"
                  onClick={() => setDistricts([])}
                  className="text-meta font-medium text-brand-700 underline decoration-brand-500/40 underline-offset-4 transition-colors hover:text-brand-500 dark:text-brand-400"
                >
                  Tozalash
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto py-1">
                {(districts ?? []).map((district) => {
                  const checked = districtIds.includes(district.id);
                  return (
                    <li key={district.id}>
                      <label className="flex cursor-pointer items-center gap-2.5 px-3 py-1.5 text-ui transition-colors hover:bg-neutral-100/70 dark:hover:bg-white/6">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleDistrict(district.id)}
                          className="size-3.5 rounded-[3px] border-neutral-300 text-brand-500 focus:ring-brand-500"
                        />
                        <span className="flex-1 truncate">{district.name}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </DropdownPanel>
      </Popover>

      {/* ───── Yil oralig‘i ───── */}
      <Popover className="relative">
        <PopoverButton className="inline-flex h-8 items-center gap-1.5 rounded-lg surface px-2.5 text-meta text-strong shadow-[0_0_0_1px_rgb(16_42_76/0.1)] transition-colors hover:bg-neutral-100 focus:outline-none dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)] dark:hover:bg-white/8">
          <CalendarRange className="text-faint size-3.5" />
          <span className="num text-meta">
            {yearFrom} – {yearTo}
          </span>
          <ChevronDown className="text-faint size-3.5" />
        </PopoverButton>
        <DropdownPanel className="w-64">
          {({ close }) => <YearRangePicker from={yearFrom} to={yearTo} onApply={(a, b) => { setYearRange(a, b); close(); }} />}
        </DropdownPanel>
      </Popover>
    </div>
  );
}

function DropdownPanel({
  children,
  className,
}: {
  children: (bag: { close: () => void }) => React.ReactNode;
  className?: string;
}) {
  return (
    <Transition
      as={Fragment}
      enter="transition duration-150 ease-out" enterFrom="opacity-0 -translate-y-1" enterTo="opacity-100 translate-y-0"
      leave="transition duration-100 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0"
    >
      <PopoverPanel
        className={cn(
          'absolute left-0 z-40 mt-2 w-56 overflow-hidden pop',
          className,
        )}
      >
        {({ close }) => <>{children({ close })}</>}
      </PopoverPanel>
    </Transition>
  );
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 11 }, (_, i) => CURRENT_YEAR - 4 + i);

/** Tez tanlovlar — hokim ko‘pincha «joriy yil» yoki «uch yillik dastur» ni tanlaydi. */
const PRESETS: Array<{ label: string; from: number; to: number }> = [
  { label: 'Joriy yil', from: CURRENT_YEAR, to: CURRENT_YEAR },
  { label: 'Joriy va keyingi', from: CURRENT_YEAR, to: CURRENT_YEAR + 1 },
  { label: 'Uch yillik dastur', from: CURRENT_YEAR, to: CURRENT_YEAR + 2 },
  { label: 'Barcha yillar', from: YEARS[0], to: YEARS[YEARS.length - 1] },
];

function YearRangePicker({ from, to, onApply }: { from: number; to: number; onApply: (from: number, to: number) => void }) {
  return (
    <div className="p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="t-label block">Dan</span>
          <select
            defaultValue={from}
            id="year-from"
            className="num h-8 w-full rounded-lg surface px-2 text-ui shadow-[0_0_0_1px_rgb(16_42_76/0.1)] focus:outline-none dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]"
          >
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="t-label block">Gacha</span>
          <select
            defaultValue={to}
            id="year-to"
            className="num h-8 w-full rounded-lg surface px-2 text-ui shadow-[0_0_0_1px_rgb(16_42_76/0.1)] focus:outline-none dark:shadow-[0_0_0_1px_rgb(255_255_255/0.12)]"
          >
            {YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onApply(preset.from, preset.to)}
            className="surface-inset rounded-full px-2.5 py-1 text-meta text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/12 dark:hover:text-brand-300"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <Button
        size="sm"
        className="mt-3 w-full justify-center"
        onClick={() => {
          const fromEl = document.getElementById('year-from') as HTMLSelectElement | null;
          const toEl = document.getElementById('year-to') as HTMLSelectElement | null;
          onApply(Number(fromEl?.value ?? from), Number(toEl?.value ?? to));
        }}
      >
        Qo‘llash
      </Button>
    </div>
  );
}
