'use client';

import Link from 'next/link';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Plus, Search } from 'lucide-react';
import { COLLECTIONS } from '@/lib/content';
import { tagLabel } from '@/lib/content/taxonomy';
import { MASTERY_LABELS, masteryOf } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { formatPercent } from '@/lib/utils/format';
import { Badge, Button, EmptyState, Input, Kbd, ListRow, ListRows, PageHeader, Select } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/interactive';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';

/* ------------------------------------------------------------------
   Vocabulary reference.

   A dense, filterable table rather than a wall of flashcard cards: the
   learner scans, filters and only then opens an entry. A contextual
   panel on the right shows the highlighted row without a navigation.
------------------------------------------------------------------ */

export type VocabRow = {
  id: string;
  japanese: string;
  kana?: string;
  meaningsEn: string[];
  meaningsId: string[];
  definitionJa?: string;
  partOfSpeech: string[];
  jlptLevel?: string;
  tags: string[];
  medicalRelevance: boolean;
  exampleCount: number;
  example?: { ja: string; en: string };
  frequencyRank?: number;
  notes?: string;
  synonyms: string[];
};

type StateFilter = 'all' | 'untracked' | 'due' | 'learning' | 'difficult' | 'favorite' | 'medical';

export function VocabularyBrowser({
  rows,
  collections,
  initialCollection,
  initialQuery,
  initialLevel,
  initialState,
  initialTag,
}: {
  rows: VocabRow[];
  collections: { id: string; name: string; description: string; count: number }[];
  initialCollection?: string;
  initialQuery?: string;
  initialLevel?: string;
  initialState?: string;
  initialTag?: string;
}) {
  const router = useRouter();
  const { state, actions, ready } = useStudy();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [level, setLevel] = useState(initialLevel ?? 'all');
  const [stateFilter, setStateFilter] = useState<StateFilter>((initialState as StateFilter) ?? 'all');
  const [tag, setTag] = useState(initialTag ?? 'all');
  const [collection, setCollection] = useState(initialCollection ?? 'all');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const deferredQuery = useDeferredValue(query);

  const tagOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) for (const item of row.tags) counts.set(item, (counts.get(item) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const collectionIds = useMemo(() => {
    if (collection === 'all') return null;
    return new Set(COLLECTIONS.find((item) => item.id === collection)?.itemIds ?? []);
  }, [collection]);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (collectionIds && !collectionIds.has(row.id)) return false;
      if (level !== 'all' && row.jlptLevel !== level) return false;
      if (tag !== 'all' && !row.tags.includes(tag)) return false;

      if (stateFilter !== 'all') {
        const key = makeReviewKey('vocabulary', row.id);
        const item = state.reviews[key];
        switch (stateFilter) {
          case 'untracked':
            if (item) return false;
            break;
          case 'due':
            if (!item || new Date(item.due).getTime() > Date.now() || item.suspended) return false;
            break;
          case 'learning':
            if (!item || masteryOf(item) === 'mastered' || masteryOf(item) === 'strong') return false;
            break;
          case 'difficult':
            if (!item || item.lapses < 1) return false;
            break;
          case 'favorite':
            if (!state.bookmarks.includes(key)) return false;
            break;
          case 'medical':
            if (!row.medicalRelevance) return false;
            break;
        }
      }

      if (!needle) return true;
      const haystack = [
        row.japanese,
        row.kana ?? '',
        row.meaningsEn.join(' '),
        row.meaningsId.join(' '),
        row.definitionJa ?? '',
        row.notes ?? '',
        row.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [collectionIds, deferredQuery, level, rows, state.reviews, stateFilter, state.bookmarks, tag]);

  const active = filtered[Math.min(activeIndex, Math.max(0, filtered.length - 1))];

  useEffect(() => {
    setActiveIndex(0);
  }, [deferredQuery, level, stateFilter, tag, collection]);

  // Keyboard-first navigation: / focuses the filter, arrows walk the table.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
        return;
      }
      if (typing) return;
      if (event.key === 'ArrowDown' || event.key === 'j') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, filtered.length - 1));
        bodyRef.current?.scrollIntoView({ block: 'nearest' });
      }
      if (event.key === 'ArrowUp' || event.key === 'k') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === 'Enter' && active) router.push(`/vocabulary/${encodeURIComponent(active.id)}`);
      if (event.key === 'a' && active && !state.reviews[makeReviewKey('vocabulary', active.id)]) {
        actions.addToReview({ contentType: 'vocabulary', contentId: active.id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, active, filtered.length, router, state.reviews]);

  const tracked = filtered.filter((row) => state.reviews[makeReviewKey('vocabulary', row.id)]).length;
  const mature = filtered.filter((row) => {
    const level = masteryOf(state.reviews[makeReviewKey('vocabulary', row.id)]);
    return level === 'strong' || level === 'mastered';
  }).length;

  const addFiltered = () => {
    actions.addManyToReview(
      filtered
        .filter((row) => !state.reviews[makeReviewKey('vocabulary', row.id)])
        .map((row) => ({ contentType: 'vocabulary' as const, contentId: row.id })),
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vocabulary · 語彙"
        title="Reference database"
        description="Advanced vocabulary with readings, glosses, examples and relations. Filter, scan, then open the entries that matter."
        meta={
          <>
            <span>{rows.length} entries</span>
            <span>{filtered.length} shown</span>
            <span>
              {tracked} tracked · {mature} strong
            </span>
          </>
        }
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={addFiltered} disabled={!ready}>
              <Plus className="h-3.5 w-3.5" />
              Add {filtered.length} shown to review
            </Button>
            <Link
              href="/review?deck=vocabulary"
              className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-foreground hover:bg-surface-secondary"
            >
              Review vocabulary
            </Link>
          </>
        }
      />

      {/* Filters */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by Japanese, kana, English or Indonesian"
              className="pl-8"
              aria-label="Filter vocabulary"
            />
          </div>
          <SegmentedControl
            ariaLabel="JLPT level"
            value={level}
            onChange={setLevel}
            options={[
              { value: 'all', label: 'All' },
              { value: 'N3', label: 'N3' },
              { value: 'N2', label: 'N2' },
              { value: 'N1', label: 'N1' },
            ]}
          />
          <Select value={tag} onChange={(event) => setTag(event.target.value)} className="w-auto min-w-[150px]" aria-label="Tag">
            <option value="all">Any tag</option>
            {tagOptions.map(([id, count]) => (
              <option key={id} value={id}>
                {tagLabel(id)} ({count})
              </option>
            ))}
          </Select>
          <Select
            value={collection}
            onChange={(event) => setCollection(event.target.value)}
            className="w-auto min-w-[190px]"
            aria-label="Collection"
          >
            <option value="all">All vocabulary</option>
            {collections.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.count})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ['all', 'Everything'],
              ['untracked', 'Not started'],
              ['due', 'Due now'],
              ['learning', 'Learning'],
              ['difficult', 'Lapses'],
              ['favorite', 'Saved'],
              ['medical', 'Medical'],
            ] as [StateFilter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setStateFilter(id)}
              className={cn(
                'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
                stateFilter === id
                  ? 'border-border-strong bg-surface-secondary text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
          <span className="ml-auto hidden items-center gap-1 text-[11px] text-muted sm:flex">
            <Kbd>/</Kbd> filter · <Kbd>↑</Kbd>
            <Kbd>↓</Kbd> move · <Kbd>a</Kbd> add · <Kbd>↵</Kbd> open
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No entries match those filters"
          description="Reset the level or tag filter, or clear the search field."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery('');
                setLevel('all');
                setTag('all');
                setStateFilter('all');
                setCollection('all');
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Table */}
          <div ref={bodyRef} className="min-w-0 overflow-hidden rounded-lg border border-border">
            <table className="w-full border-collapse text-left">
              <thead className="sticky top-0 z-10 bg-surface-secondary/95 backdrop-blur">
                <tr className="text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-3 py-2 font-medium">Entry</th>
                  <th className="px-3 py-2 font-medium">Meaning</th>
                  <th className="hidden px-3 py-2 font-medium md:table-cell">Tag</th>
                  <th className="px-3 py-2 text-right font-medium">Level</th>
                  <th className="px-3 py-2 text-right font-medium">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row, index) => {
                  const item = state.reviews[makeReviewKey('vocabulary', row.id)];
                  const mastery = masteryOf(item);
                  const isActive = row.id === active?.id;
                  return (
                    <tr
                      key={row.id}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={cn('cursor-pointer transition-colors', isActive ? 'bg-primary-muted' : 'hover:bg-surface-secondary/60')}
                      onClick={() => setActiveIndex(index)}
                    >
                      <td className="max-w-[220px] px-3 py-2 align-top">
                        <Link href={`/vocabulary/${encodeURIComponent(row.id)}`} className="block">
                          <span lang="ja" className="block truncate text-[15px] text-foreground" title={row.kana}>
                            {row.japanese}
                          </span>
                          {row.kana ? (
                            <span lang="ja" className="block truncate text-[11.5px] text-muted">
                              {row.kana}
                            </span>
                          ) : null}
                        </Link>
                      </td>
                      <td className="max-w-[280px] px-3 py-2 align-top">
                        <span className="block truncate text-[13px] text-foreground">{row.meaningsEn.join('; ')}</span>
                        <span className="block truncate text-[11.5px] text-muted">{row.meaningsId.join('; ')}</span>
                      </td>
                      <td className="hidden px-3 py-2 align-top md:table-cell">
                        <span className="text-[11.5px] text-muted">{row.tags.slice(0, 2).map(tagLabel).join(' · ')}</span>
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        {row.jlptLevel ? <Badge>{row.jlptLevel}</Badge> : <span className="text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right align-top">
                        <span
                          className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full',
                            mastery === 'new'
                              ? 'bg-border-strong'
                              : mastery === 'learning'
                                ? 'bg-warning'
                                : mastery === 'familiar'
                                  ? 'bg-info'
                                  : 'bg-success',
                          )}
                          title={item ? MASTERY_LABELS[mastery] : 'Not in the queue'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Context panel */}
          <aside className="hidden lg:block">
            {active ? (
              <div className="sticky top-16 space-y-4">
                <div className="rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 lang="ja" className="text-xl tracking-tight text-foreground">
                        {active.japanese}
                      </h2>
                      {active.kana ? (
                        <p lang="ja" className="text-[12.5px] text-muted">
                          {active.kana}
                        </p>
                      ) : null}
                    </div>
                    <Link
                      href={`/vocabulary/${encodeURIComponent(active.id)}`}
                      className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
                    >
                      Open <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <dl className="mt-3 space-y-2 text-[12.5px]">
                    <div>
                      <dt className="meta-label">English</dt>
                      <dd className="text-foreground">{active.meaningsEn.join('; ')}</dd>
                    </div>
                    <div>
                      <dt className="meta-label">Indonesian</dt>
                      <dd className="text-muted-foreground">{active.meaningsId.join('; ')}</dd>
                    </div>
                    {active.definitionJa ? (
                      <div>
                        <dt className="meta-label">定義</dt>
                        <dd lang="ja" className="text-muted-foreground">
                          {active.definitionJa}
                        </dd>
                      </div>
                    ) : null}
                    {active.example ? (
                      <div>
                        <dt className="meta-label">Example</dt>
                        <dd>
                          <span lang="ja" className="block text-foreground">
                            {active.example.ja}
                          </span>
                          <span className="block text-[11.5px] text-muted">{active.example.en}</span>
                        </dd>
                      </div>
                    ) : null}
                    {active.synonyms.length > 0 ? (
                      <div>
                        <dt className="meta-label">Synonyms</dt>
                        <dd lang="ja" className="text-muted-foreground">
                          {active.synonyms.join('、')}
                        </dd>
                      </div>
                    ) : null}
                    {active.notes ? (
                      <div>
                        <dt className="meta-label">Reading note</dt>
                        <dd className="text-muted-foreground">{active.notes}</dd>
                      </div>
                    ) : null}
                  </dl>

                  <div className="mt-3 border-t border-border pt-3">
                    <ReviewStateLine contentType="vocabulary" contentId={active.id} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    <AddToReviewButton contentType="vocabulary" contentId={active.id} />
                    <NoteButton contentType="vocabulary" contentId={active.id} defaultTitle={active.japanese} />
                    <BookmarkButton contentKey={makeReviewKey('vocabulary', active.id)} />
                  </div>
                </div>

                <ListRows>
                  {tagOptions
                    .filter(([id]) => active.tags.includes(id))
                    .slice(0, 5)
                    .map(([id]) => (
                      <ListRow key={id} className="justify-between">
                        <span className="text-[12.5px] text-muted-foreground">{tagLabel(id)}</span>
                        <Button
                          variant="quiet"
                          size="sm"
                          className="text-[11.5px]"
                          onClick={() => setTag(id)}
                        >
                          Filter
                        </Button>
                      </ListRow>
                    ))}
                </ListRows>
              </div>
            ) : null}
          </aside>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11.5px] text-muted">
        <span>{formatPercent(rows.filter((row) => row.exampleCount >= 2).length / Math.max(1, rows.length))} have two examples or more</span>
        <span>{rows.filter((row) => row.medicalRelevance).length} flagged as clinically relevant</span>
      </div>
    </div>
  );
}
