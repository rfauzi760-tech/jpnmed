'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Braces,
  CornerDownLeft,
  Layers,
  Loader,
  NotebookPen,
  Search,
  Stethoscope,
  Target,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS } from '@/lib/content/taxonomy';
import { groupHits, searchDocs, type SearchDoc, type SearchHit, type SearchType } from '@/lib/search';
import { cn } from '@/lib/utils/cn';
import { Badge, Kbd } from '@/components/ui/primitives';

/* ------------------------------------------------------------------
   Global search.

   The index is a single JSON payload fetched the first time the palette
   opens, then scored in memory on every keystroke. Results carry their
   type and the field that matched, so a Japanese hit is never confused
   with an English gloss hit.
------------------------------------------------------------------ */

const PALETTE_EVENT = 'jmed:open-palette';

export function openCommandPalette(query?: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PALETTE_EVENT, { detail: { query } }));
}

type Action = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
  icon: React.ReactNode;
  keywords: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState<SearchDoc[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const loadIndex = useCallback(async () => {
    if (index || loading) return;
    setLoading(true);
    try {
      const response = await fetch('/api/search-index');
      const payload = (await response.json()) as { docs: SearchDoc[] };
      setIndex(payload.docs);
    } catch {
      setIndex([]);
    } finally {
      setLoading(false);
    }
  }, [index, loading]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const isPaletteKey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (isPaletteKey) {
        event.preventDefault();
        setOpen((v) => !v);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<{ query?: string }>).detail;
      setQuery(detail?.query ?? '');
      setOpen(true);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(PALETTE_EVENT, onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      void loadIndex();
      // Wait for paint so the input exists before focusing.
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      setActive(0);
    }
  }, [open, loadIndex]);

  const actions: Action[] = useMemo(() => {
    const go = (href: string) => () => {
      setOpen(false);
      router.push(href);
    };
    return [
      { id: 'review', label: 'Start today’s review', hint: 'SRS session', run: go('/review'), icon: <Layers className="h-3.5 w-3.5" />, keywords: 'review srs study sentence cards anki fukushuu' },
      { id: 'reading', label: 'Open the reading trainer', hint: 'Reading', run: go('/reading'), icon: <BookOpen className="h-3.5 w-3.5" />, keywords: 'reading passage dokkai comprehension' },
      { id: 'quick', label: 'Quick clinical mode', hint: 'Hospital lookup', run: go('/medical/quick'), icon: <Stethoscope className="h-3.5 w-3.5" />, keywords: 'clinical quick chest pain hospital emergency setsumei' },
      { id: 'grammar-compare', label: 'Compare similar grammar', hint: 'Grammar', run: go('/grammar/compare'), icon: <Braces className="h-3.5 w-3.5" />, keywords: 'grammar compare bunpou difference' },
      { id: 'notebook', label: 'Add a notebook note', hint: 'Notebook', run: go('/notebook?new=1'), icon: <NotebookPen className="h-3.5 w-3.5" />, keywords: 'note notebook memo markdown' },
      { id: 'case', label: 'Run a clinical case', hint: 'Cases', run: go('/cases'), icon: <Target className="h-3.5 w-3.5" />, keywords: 'case simulation patient shinryou' },
    ];
  }, [router]);

  const hits = useMemo(() => (index ? searchDocs(index, query, 30) : []), [index, query]);

  const actionHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) => `${action.label} ${action.keywords}`.toLowerCase().includes(q));
  }, [actions, query]);

  const grouped = useMemo(() => groupHits(hits), [hits]);

  /** Flat list drives arrow-key navigation across groups and actions. */
  const flat = useMemo(() => {
    const rows: ({ kind: 'hit'; hit: SearchHit } | { kind: 'action'; action: Action })[] = [];
    for (const action of actionHits.slice(0, query.trim() ? 3 : actions.length)) rows.push({ kind: 'action', action });
    for (const hit of hits) rows.push({ kind: 'hit', hit });
    return rows;
  }, [actionHits, actions.length, hits, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const select = useCallback(
    (row: (typeof flat)[number] | undefined) => {
      if (!row) return;
      if (row.kind === 'action') {
        row.action.run();
        return;
      }
      setOpen(false);
      router.push(row.hit.url);
    },
    [router],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((v) => Math.min(flat.length - 1, v + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((v) => Math.max(0, v - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      select(flat[active]);
    }
  };

  if (!open) return null;

  const quickClinical = query.trim().length > 0 && hits.some((h) => ['medical-term', 'symptom', 'disease'].includes(h.type));

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-3 sm:p-6">
      <button type="button" aria-label="Close search" onClick={() => setOpen(false)} className="fixed inset-0 cursor-default bg-black/35 animate-fade dark:bg-black/55" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="relative mt-[8vh] flex max-h-[76vh] w-full max-w-2xl flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-overlay animate-rise"
      >
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search Japanese, kana, English, Indonesian…"
            aria-label="Search all content"
            className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          {loading ? <Loader className="h-3.5 w-3.5 animate-spin text-muted" /> : null}
          <Kbd>Esc</Kbd>
        </div>

        <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1.5 scroll-thin">
          {query.trim().length === 0 ? (
            <li className="px-3.5 pb-1.5 pt-1 text-[11px] uppercase tracking-wider text-muted">
              Quick actions · try 胸痛, きょうつう, chest pain, nyeri dada
            </li>
          ) : null}

          {flat.map((row, position) => {
            const isActive = position === active;
            if (row.kind === 'action') {
              return (
                <li key={`action-${row.action.id}`}>
                  <button
                    type="button"
                    data-index={position}
                    onMouseEnter={() => setActive(position)}
                    onClick={() => select(row)}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3.5 py-1.5 text-left text-[13.5px]',
                      isActive ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/70',
                    )}
                  >
                    <span className="text-muted">{row.action.icon}</span>
                    <span className="flex-1 truncate text-foreground">{row.action.label}</span>
                    {row.action.hint ? <Badge tone="outline">{row.action.hint}</Badge> : null}
                    {isActive ? <CornerDownLeft className="h-3.5 w-3.5 text-muted" /> : null}
                  </button>
                </li>
              );
            }

            const hit = row.hit;
            const showGroup = position === 0 || flat[position - 1]?.kind === 'action' || (flat[position - 1] as { hit: SearchHit }).hit.type !== hit.type;
            return (
              <li key={`hit-${hit.id}`}>
                {showGroup ? (
                  <div className="mt-1 flex items-center gap-2 px-3.5 pb-1 pt-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted">
                      {CONTENT_TYPE_LABELS[hit.type as SearchType]?.en ?? hit.type}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}
                <button
                  type="button"
                  data-index={position}
                  onMouseEnter={() => setActive(position)}
                  onClick={() => select(row)}
                  className={cn(
                    'flex w-full items-start gap-3 px-3.5 py-1.5 text-left',
                    isActive ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/70',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span lang="ja" className="truncate text-[14.5px] font-medium text-foreground">
                        {hit.ja}
                      </span>
                      {hit.kana && hit.kana !== hit.ja ? (
                        <span lang="ja" className="truncate text-[11.5px] text-muted-foreground">
                          {hit.kana}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                      {hit.en}
                      {hit.idn ? <span className="text-muted"> · {hit.idn}</span> : null}
                    </div>
                    {hit.context ? <div className="mt-0.5 truncate text-[11.5px] text-muted">{hit.context}</div> : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {hit.badge ? <Badge tone="outline">{hit.badge}</Badge> : null}
                    <span className="text-[10.5px] uppercase tracking-wide text-muted">{hit.matched}</span>
                  </div>
                </button>
              </li>
            );
          })}

          {!loading && index && flat.length === 0 ? (
            <li className="px-3.5 py-6 text-center text-[13px] text-muted-foreground">
              No results for “{query}”. Try a single word, kana, or the Indonesian term.
            </li>
          ) : null}
        </ul>

        <div className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-2 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline">
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
            </span>
            <span className="hidden sm:inline">
              <Kbd>↵</Kbd> open
            </span>
            <span>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd> toggle
            </span>
          </div>
          {quickClinical ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push(`/medical/quick?q=${encodeURIComponent(query)}`);
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Quick clinical mode <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <span className="text-muted">{index ? `${index.length} indexed items` : 'building index…'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function SearchTrigger({ compact }: { compact?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => openCommandPalette()}
      className={cn(
        'group flex items-center gap-2 rounded-md border border-border bg-surface text-left text-[13px] text-muted transition-colors hover:border-border-strong hover:text-muted-foreground',
        compact ? 'h-8 w-8 justify-center p-0' : 'h-8 w-full px-2.5',
      )}
      aria-label="Open search"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      {compact ? null : (
        <>
          <span className="flex-1 truncate">Search everything…</span>
          <span className="hidden items-center gap-0.5 lg:inline-flex">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </>
      )}
    </button>
  );
}
