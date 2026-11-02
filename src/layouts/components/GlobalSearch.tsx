import { useQuery } from '@tanstack/react-query';
import { Building2, Loader2, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetPaginated } from '@/shared/api/client';
import type { ConstructionObject } from '@/shared/api/types';
import { HEALTH_META } from '@/shared/constants/health';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { Badge } from '@/shared/ui';
import { cn } from '@/shared/utils/cn';

/** Sarlavhadagi umumiy qidiruv — obyekt nomi, kodi va manzili bo‘yicha. */
export function GlobalSearch() {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debounced = useDebounce(term, 300);
  const enabled = debounced.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: async () => {
      const { items } = await apiGetPaginated<ConstructionObject>('/objects', {
        params: { search: debounced, limit: 7 },
      });
      return items;
    },
    enabled,
    staleTime: 30_000,
  });

  const results = enabled ? (data ?? []) : [];

  // Tashqariga bosilganda yopiladi.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  // `/` tugmasi — qidiruvga o‘tish (matn maydonida bo‘lmasa).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  function goTo(object: ConstructionObject) {
    navigate(`/objects/${object.id}`);
    setOpen(false);
    setTerm('');
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      goTo(results[activeIndex] ?? results[0]);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <Search className="text-faint pointer-events-none absolute inset-y-0 left-3.5 my-auto size-4" />
      <input
        ref={inputRef}
        type="search"
        value={term}
        onChange={(event) => {
          setTerm(event.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onInputKeyDown}
        placeholder="Obyekt, manzil, tuman yoki mas’ul bo‘yicha qidirish…"
        aria-label="Umumiy qidiruv"
        className="surface-inset h-9 w-full rounded-full pr-10 pl-10 text-ui transition-shadow placeholder:text-faint placeholder:font-light focus:bg-[var(--surface)] focus:shadow-[0_0_0_1px_var(--color-brand-500),0_0_0_3px_rgb(255_127_0/0.2)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="pointer-events-none absolute inset-y-0 right-3 my-auto flex h-5 items-center">
        {isFetching ? (
          <Loader2 className="text-faint size-3.5 animate-spin" />
        ) : (
          <kbd className="text-faint rounded-[4px] px-1.5 text-nano shadow-[0_0_0_1px_rgb(16_42_76/0.12)] dark:shadow-[0_0_0_1px_rgb(255_255_255/0.14)]">/</kbd>
        )}
      </span>

      {open && enabled ? (
        <div className="absolute top-full right-0 left-0 z-40 mt-2 overflow-hidden pop">
          {results.length === 0 ? (
            <p className="t-meta px-4 py-7 text-center">
              {isFetching ? 'Qidirilmoqda…' : `«${debounced}» bo‘yicha hech narsa topilmadi`}
            </p>
          ) : (
            <ul role="listbox" className="max-h-[22rem] overflow-y-auto py-1">
              {results.map((object, index) => {
                const meta = HEALTH_META[object.healthStatus];
                return (
                  <li key={object.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => goTo(object)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        index === activeIndex && 'bg-brand-500/8 dark:bg-white/6',
                      )}
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-lg"
                        style={{ backgroundColor: `${object.type?.color ?? '#B4B4BC'}1f` }}
                      >
                        <Building2 className="size-4" style={{ color: object.type?.color ?? '#B4B4BC' }} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-ui font-medium text-strong">
                          {object.name}
                        </span>
                        <span className="text-faint block truncate text-meta">
                          <span className="mono">{object.code}</span>{' · '}{object.district?.shortName ?? '—'}
                        </span>
                      </span>
                      <Badge className={meta.chip} dot={meta.dot}>
                        {meta.label}
                      </Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
