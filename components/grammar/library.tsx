'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { GRAMMAR_FAMILY_LABELS } from '@/lib/content/taxonomy';
import { masteryOf, MASTERY_LABELS } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, EmptyState, Input, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { AddToReviewButton, BookmarkButton } from '@/components/study/review-controls';

/* ------------------------------------------------------------------
   Grammar library.

   Organised by function, not by JLPT order: the point of N2/N1 grammar
   is choosing between near-synonyms, so patterns that compete with each
   other sit next to each other.
------------------------------------------------------------------ */

export type GrammarRow = {
  id: string;
  pattern: string;
  kana?: string;
  meaning: string;
  meaningsId?: string;
  family: string;
  jlptLevel: string;
  formation: string;
  nuance: string;
  register: string[];
  whenToUse: string[];
  example: string;
  exampleCount: number;
  contrastNote?: string;
  similarIds: string[];
  commonMistakeCount: number;
};

export function GrammarLibrary({
  rows,
  featured,
}: {
  rows: GrammarRow[];
  featured: { id: string; a: string; b: string; aPattern: string; bPattern: string; note?: string }[];
}) {
  const { state, actions, ready } = useStudy();
  const [family, setFamily] = useState('all');
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);

  const families = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.family, (counts.get(row.family) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    return rows.filter((row) => {
      if (family !== 'all' && row.family !== family) return false;
      if (!needle) return true;
      return [row.pattern, row.kana ?? '', row.meaning, row.meaningsId ?? '', row.nuance, row.formation]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [deferred, family, rows]);

  const tracked = rows.filter((row) => state.reviews[makeReviewKey('grammar', row.id)]).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Grammar · 文法"
        title="Pattern library"
        description="Function-grouped patterns with contrast notes. Learn where a pattern is wrong as carefully as where it is right."
        meta={
          <>
            <span>{rows.length} patterns</span>
            <span>{tracked} in the review queue</span>
            <span>{families.length} function groups</span>
          </>
        }
        actions={
          <>
            <Link
              href="/grammar/compare"
              className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Compare grammar
            </Link>
            <Button
              variant="secondary"
              size="sm"
              disabled={!ready}
              onClick={() =>
                actions.addManyToReview(
                  filtered
                    .filter((row) => !state.reviews[makeReviewKey('grammar', row.id)])
                    .map((row) => ({ contentType: 'grammar' as const, contentId: row.id })),
                )
              }
            >
              Add {filtered.length} shown to review
            </Button>
          </>
        }
      />

      {/* Featured comparisons */}
      {featured.length > 0 ? (
        <section>
          <SectionHeading title="Comparisons worth doing today" hint="pairs the exam and real reading confuse" />
          <ul className="grid gap-2 pt-3 sm:grid-cols-2">
            {featured.slice(0, 4).map((pair) => (
              <li key={pair.id}>
                <Link
                  href={`/grammar/compare?a=${pair.a}&b=${pair.b}`}
                  className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-surface-secondary"
                >
                  <span className="min-w-0 flex-1">
                    <span lang="ja" className="block text-[14.5px] text-foreground">
                      {pair.aPattern} <span className="text-muted">vs</span> {pair.bPattern}
                    </span>
                    {pair.note ? <span className="mt-0.5 block truncate text-[11.5px] text-muted">{pair.note}</span> : null}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search patterns, meanings or nuance"
            className="pl-8"
            aria-label="Search grammar"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFamily('all')}
          className={cn(
            'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
            family === 'all' ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          All functions
        </button>
        {families.map(([id, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFamily(id)}
            className={cn(
              'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
              family === id ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {GRAMMAR_FAMILY_LABELS[id as keyof typeof GRAMMAR_FAMILY_LABELS]?.en ?? id}
            <span className="ml-1 font-mono text-[10.5px] tabular-nums text-muted">{count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No patterns match" description="Try a different function group or clear the search." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((row) => {
            const level = masteryOf(state.reviews[makeReviewKey('grammar', row.id)]);
            return (
              <li key={row.id} className="group flex flex-wrap items-start gap-x-4 gap-y-2 py-3">
                <div className="min-w-[190px] flex-1">
                  <Link href={`/grammar/${row.id}`} className="block">
                    <span lang="ja" className="text-[16px] tracking-tight text-foreground group-hover:text-primary">
                      {row.pattern}
                    </span>
                    <span className="ml-2 text-[12px] text-muted">{row.kana}</span>
                    <span className="mt-0.5 block text-[13px] text-foreground">{row.meaning}</span>
                    {row.meaningsId ? <span className="block text-[11.5px] text-muted">{row.meaningsId}</span> : null}
                  </Link>
                </div>
                <div className="min-w-[240px] flex-[2] space-y-1">
                  {row.example ? (
                    <Link href={`/grammar/${row.id}`} lang="ja" className="block text-[13.5px] leading-relaxed text-muted-foreground hover:text-foreground">
                      {row.example}
                    </Link>
                  ) : null}
                  {row.contrastNote ? (
                    <p className="text-[11.5px] leading-relaxed text-muted">{row.contrastNote}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge>{row.jlptLevel}</Badge>
                  {row.commonMistakeCount > 0 ? (
                    <Badge tone="warning" title={`${row.commonMistakeCount} common mistakes`}>
                      {row.commonMistakeCount} trap{row.commonMistakeCount === 1 ? '' : 's'}
                    </Badge>
                  ) : null}
                  {state.reviews[makeReviewKey('grammar', row.id)] ? (
                    <span className="text-[11px] text-muted" title={MASTERY_LABELS[level]}>
                      {MASTERY_LABELS[level]}
                    </span>
                  ) : null}
                  <AddToReviewButton contentType="grammar" contentId={row.id} />
                  <BookmarkButton contentKey={makeReviewKey('grammar', row.id)} label="" />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
