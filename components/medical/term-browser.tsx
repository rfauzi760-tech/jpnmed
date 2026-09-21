'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { MEDICAL_CATEGORIES, SPECIALTIES, categoryLabel } from '@/lib/content/taxonomy';
import { masteryOf } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, EmptyState, Input, PageHeader, Select, VerificationBadge } from '@/components/ui/primitives';
import { AddToReviewButton } from '@/components/study/review-controls';

/* ------------------------------------------------------------------
   Medical dictionary.

   Dense by design: a ward look-up should show the term, both languages,
   the category and whether a patient-friendly explanation exists,
   without opening anything.
------------------------------------------------------------------ */

export type TermRow = {
  id: string;
  japanese: string;
  kana?: string;
  romaji: string;
  english: string;
  indonesian: string;
  patientFriendly?: string;
  patientExpression?: string;
  category: string;
  specialties: string[];
  tags: string[];
  alternativeNames: string[];
  definitionJa?: string;
  verificationStatus: 'draft' | 'reviewed' | 'verified';
  related: number;
};

export function TermBrowser({
  rows,
  initialCategory,
  initialQuery,
}: {
  rows: TermRow[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const { state, ready } = useStudy();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [category, setCategory] = useState(initialCategory ?? 'all');
  const [specialty, setSpecialty] = useState('all');
  const [onlyPatientFriendly, setOnlyPatientFriendly] = useState(false);
  const deferred = useDeferredValue(query);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    return counts;
  }, [rows]);

  const specialtyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) for (const id of row.specialties) counts.set(id, (counts.get(id) ?? 0) + 1);
    return counts;
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    return rows.filter((row) => {
      if (category !== 'all' && row.category !== category) return false;
      if (specialty !== 'all' && !row.specialties.includes(specialty)) return false;
      if (onlyPatientFriendly && !row.patientFriendly) return false;
      if (!needle) return true;
      return [
        row.japanese,
        row.kana ?? '',
        row.english,
        row.indonesian,
        row.patientFriendly ?? '',
        row.patientExpression ?? '',
        row.definitionJa ?? '',
        row.alternativeNames.join(' '),
        row.specialties.join(' '),
        row.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [category, deferred, onlyPatientFriendly, rows, specialty]);

  const activeCategories = MEDICAL_CATEGORIES.filter((item) => categoryCounts.has(item.id));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Medical dictionary · 医療用語"
        title="Terminology"
        description="Every term carries the technical form, an Indonesian and English gloss, and — where it exists — the wording that actually works with a patient."
        meta={
          <>
            <span>{rows.length} terms</span>
            <span>{filtered.length} shown</span>
            <span>{rows.filter((row) => row.patientFriendly).length} with patient-friendly wording</span>
          </>
        }
        actions={
          <Link
            href="/medical/quick"
            className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Quick clinical mode
          </Link>
        }
      />

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by Japanese, kana, English or Indonesian"
              className="pl-8"
              aria-label="Filter terminology"
            />
          </div>
          <Select value={specialty} onChange={(event) => setSpecialty(event.target.value)} className="w-auto min-w-[190px]" aria-label="Specialty">
            <option value="all">All specialties</option>
            {SPECIALTIES.filter((item) => specialtyCounts.has(item.id)).map((item) => (
              <option key={item.id} value={item.id}>
                {item.label.en} ({specialtyCounts.get(item.id)})
              </option>
            ))}
          </Select>
          <label className="inline-flex cursor-pointer items-center gap-2 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              checked={onlyPatientFriendly}
              onChange={(event) => setOnlyPatientFriendly(event.target.checked)}
              className="h-3.5 w-3.5 accent-current"
            />
            Has patient-friendly wording
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
              category === 'all' ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            All categories
          </button>
          {activeCategories.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={cn(
                'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
                category === item.id ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label.en}
              <span className="ml-1 font-mono text-[10.5px] tabular-nums text-muted">{categoryCounts.get(item.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No terms match"
          description="Try a different category, or clear the search field. Searching in kana also works."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setSpecialty('all');
                setOnlyPatientFriendly(false);
              }}
            >
              Reset filters
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-surface-secondary/90">
              <tr className="text-[11px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 font-medium">Term</th>
                <th className="px-3 py-2 font-medium">Bahasa Indonesia / English</th>
                <th className="px-3 py-2 font-medium">Patient-friendly wording</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((row) => {
                const item = state.reviews[makeReviewKey('medical-term', row.id)];
                const mastery = masteryOf(item);
                return (
                  <tr key={row.id} className="group align-top transition-colors hover:bg-surface-secondary/50">
                    <td className="px-3 py-2">
                      <Link href={`/medical/terms/${encodeURIComponent(row.id)}`} className="block">
                        <span lang="ja" className="block text-[15px] text-foreground">
                          {row.japanese}
                        </span>
                        {row.kana && (state.settings.medicalDisplay.furigana === 'always' || (state.settings.medicalDisplay.furigana === 'difficult' && /[\u3400-\u9fff]/.test(row.japanese))) ? (
                          <span lang="ja" className="block text-[11.5px] text-muted">
                            {row.kana}
                          </span>
                        ) : null}
                        {state.settings.medicalDisplay.romaji === 'always' ? <span className="block text-[11.5px] text-info">{row.romaji}</span> : state.settings.medicalDisplay.romaji === 'hover' ? <span className="block text-[11.5px] text-info opacity-0 transition-opacity group-hover:opacity-100">{row.romaji}</span> : null}
                        {row.alternativeNames.length > 0 ? (
                          <span lang="ja" className="block text-[10.5px] text-muted">
                            also: {row.alternativeNames.join('、')}
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className="block text-[13px] text-foreground">{row.indonesian}</span>
                      {state.settings.medicalDisplay.english ? <span className="block text-[11.5px] text-muted">{row.english}</span> : null}
                    </td>
                    <td className="max-w-[260px] px-3 py-2">
                      {row.patientFriendly ? (
                        <span lang="ja" className="block text-[12.5px] leading-relaxed text-muted-foreground">
                          {row.patientFriendly}
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone="neutral">{categoryLabel(row.category)}</Badge>
                      {row.specialties.length > 0 ? (
                        <span className="mt-1 block text-[10.5px] text-muted">
                          {row.specialties
                            .map((id) => SPECIALTIES.find((item) => item.id === id)?.label.en ?? id)
                            .slice(0, 2)
                            .join(' · ')}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <span
                          className={cn(
                            'inline-block h-1.5 w-1.5 rounded-full',
                            mastery === 'new' ? 'bg-border-strong' : mastery === 'learning' ? 'bg-warning' : mastery === 'familiar' ? 'bg-info' : 'bg-success',
                          )}
                          title={item ? mastery : 'Not in the review queue'}
                        />
                        <AddToReviewButton contentType="medical-term" contentId={row.id} />
                        {row.verificationStatus === 'draft' ? <VerificationBadge status="draft" /> : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-border pt-3 text-[11.5px] text-muted">
        {ready ? `${Object.keys(state.reviews).filter((key) => key.startsWith('medical-term:')).length} terms in the review queue` : 'Loading review state…'}
      </p>
    </div>
  );
}
