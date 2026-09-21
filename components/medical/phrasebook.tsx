'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { PHRASE_STAGES, REGISTER_LABELS, STAGE_GROUP_LABELS } from '@/lib/content/taxonomy';
import { masteryOf } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, EmptyState, Input, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { CopyButton } from '@/components/ui/interactive';
import { AddToReviewButton, BookmarkButton, NoteButton } from '@/components/study/review-controls';

/* ------------------------------------------------------------------
   Clinical phrasebook.

   Organised by the order of an encounter, not alphabetically: the whole
   point is to have the right sentence at the right moment. Phrases
   sharing an intent are grouped, so the learner can see the polite,
   patient-friendly and formal options side by side.
------------------------------------------------------------------ */

export type PhraseRow = {
  id: string;
  intent: string;
  japanese: string;
  kana?: string;
  romaji: string;
  english: string;
  indonesian: string;
  register: 'patient-friendly' | 'polite' | 'formal' | 'staff';
  stage: string;
  specialtyTags: string[];
  variants: string[];
  relatedTermIds: string[];
  notes?: string;
};

export function Phrasebook({
  rows,
  initialStage,
  highlight,
}: {
  rows: PhraseRow[];
  initialStage?: string;
  highlight?: string;
}) {
  const { state, actions, ready } = useStudy();
  const display = state.settings.medicalDisplay;
  const [stage, setStage] = useState(initialStage && PHRASE_STAGES.some((item) => item.id === initialStage) ? initialStage : 'greeting');
  const [register, setRegister] = useState<'all' | PhraseRow['register']>('all');
  const [query, setQuery] = useState('');
  const [searchAllStages, setSearchAllStages] = useState(false);
  const deferred = useDeferredValue(query);

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.stage, (counts.get(row.stage) ?? 0) + 1);
    return counts;
  }, [rows]);

  const stageInfo = PHRASE_STAGES.find((item) => item.id === stage)!;

  const visible = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    const scoped = rows.filter((row) => (searchAllStages || !needle ? true : row.stage === stage));
    return scoped.filter((row) => {
      if (register !== 'all' && row.register !== register) return false;
      if (!needle) return true;
      return [row.japanese, row.kana ?? '', row.english, row.indonesian, row.intent, ...row.variants]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [deferred, register, rows, searchAllStages, stage]);

  const grouped = useMemo(() => {
    const map = new Map<string, PhraseRow[]>();
    for (const row of visible) {
      const list = map.get(row.intent) ?? [];
      list.push(row);
      map.set(row.intent, list);
    }
    return [...map.entries()];
  }, [visible]);

  const stageTracked = rows.filter((row) => row.stage === stage && state.reviews[makeReviewKey('clinical-phrase', row.id)]).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Phrasebook · 診察表現"
        title="Clinical phrasebook"
        description="Eighteen stages of a Japanese consultation, each with the natural polite form, a patient-friendly alternative and the formal register for written explanations."
        meta={
          <>
            <span>{rows.length} phrases</span>
            <span>18 stages</span>
            <span>
              {stageInfo.label.en} · {stageTracked} in review
            </span>
          </>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            disabled={!ready}
            onClick={() =>
              actions.addManyToReview(
                visible
                  .filter((row) => !state.reviews[makeReviewKey('clinical-phrase', row.id)])
                  .map((row) => ({ contentType: 'clinical-phrase' as const, contentId: row.id })),
              )
            }
          >
            Add {visible.length} shown to review
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[190px_minmax(0,1fr)]">
        {/* Stage rail */}
        <nav aria-label="Encounter stages" className="lg:sticky lg:top-14 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto scroll-thin">
          <div className="flex gap-1.5 overflow-x-auto pb-2 lg:block lg:overflow-visible lg:pb-0">
            {(['opening', 'assessment', 'explanation', 'aftercare'] as const).map((group) => (
              <div key={group} className="min-w-max lg:mb-3 lg:min-w-0">
                <div className="meta-label hidden px-1 lg:block">{STAGE_GROUP_LABELS[group].en}</div>
                <ul className="flex gap-1.5 lg:block">
                  {PHRASE_STAGES.filter((item) => item.group === group).map((item) => {
                    const active = item.id === stage;
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setStage(item.id);
                            setSearchAllStages(false);
                          }}
                          aria-current={active ? 'true' : undefined}
                          className={cn(
                            'flex w-full items-baseline justify-between gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-left text-[12.5px] transition-colors',
                            active ? 'bg-surface-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-surface-secondary/60 hover:text-foreground',
                          )}
                        >
                          <span>
                            {item.label.short ?? item.label.en}
                            <span lang="ja" className="ml-1.5 hidden text-[10.5px] text-muted lg:inline">
                              {item.label.ja}
                            </span>
                          </span>
                          <span className="font-mono text-[10.5px] tabular-nums text-muted">{stageCounts.get(item.id) ?? 0}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Phrases */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchAllStages ? 'Search every stage' : `Search within ${stageInfo.label.en}`}
                className="pl-8"
                aria-label="Search phrases"
              />
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={searchAllStages}
                onChange={(event) => setSearchAllStages(event.target.checked)}
                className="h-3.5 w-3.5"
              />
              All stages
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'polite', 'patient-friendly', 'formal', 'staff'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRegister(item)}
                  className={cn(
                    'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
                    register === item ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item === 'all' ? 'All registers' : REGISTER_LABELS[item].en}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
            <div>
              <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
                {searchAllStages ? 'All stages' : stageInfo.label.en}
              </h2>
              <p lang="ja" className="text-[11.5px] text-muted">
                {searchAllStages ? 'すべて' : stageInfo.label.ja}
              </p>
            </div>
            <span className="text-[11.5px] text-muted">{visible.length} phrases</span>
          </div>

          {grouped.length === 0 ? (
            <EmptyState title="No phrases match" description="Clear the register filter or search across all stages." />
          ) : (
            <div className="space-y-5">
              {grouped.map(([intent, items]) => (
                <section key={intent}>
                  <SectionHeading
                    title={intent}
                    hint={searchAllStages ? items[0]?.stage.replace(/-/g, ' ') : undefined}
                  />
                  <ul className="divide-y divide-border pt-1">
                    {items.map((phrase) => {
                      const key = makeReviewKey('clinical-phrase', phrase.id);
                      const mastery = masteryOf(state.reviews[key]);
                      return (
                        <li
                          key={phrase.id}
                          className={cn('group py-2.5', highlight === phrase.id && 'rounded-md bg-primary-muted/50 px-2 ring-1 ring-primary/30')}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p lang="ja" className="text-[15.5px] leading-relaxed text-foreground">
                                {phrase.japanese}
                              </p>
                              {phrase.kana && (display.furigana === 'always' || (display.furigana === 'difficult' && /[\u3400-\u9fff]/.test(phrase.japanese))) ? (
                                <p lang="ja" className="text-[11.5px] text-muted">
                                  {phrase.kana}
                                </p>
                              ) : null}
                              {display.romaji === 'always' ? <p className="text-[11.5px] text-info">{phrase.romaji}</p> : display.romaji === 'hover' ? <p className="text-[11.5px] text-info opacity-0 transition-opacity group-hover:opacity-100">{phrase.romaji}</p> : null}
                              {display.indonesian ? <p className="mt-0.5 text-[12.5px] text-foreground">{phrase.indonesian}</p> : null}
                              {display.english ? <p className="text-[11.5px] text-muted">{phrase.english}</p> : null}
                            </div>
                            <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                              <Badge tone={phrase.register === 'patient-friendly' ? 'info' : phrase.register === 'formal' ? 'neutral' : 'outline'}>
                                {REGISTER_LABELS[phrase.register].en}
                              </Badge>
                              {state.reviews[key] ? (
                                <Badge tone={mastery === 'mastered' || mastery === 'strong' ? 'success' : 'warning'}>{mastery}</Badge>
                              ) : null}
                            </div>
                          </div>

                          {phrase.variants.length > 0 ? (
                            <ul className="mt-1.5 space-y-0.5 border-l-2 border-l-border pl-3">
                              {phrase.variants.map((variant) => (
                                <li key={variant} lang="ja" className="text-[13.5px] text-muted-foreground">
                                  {variant}
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          {phrase.notes ? <p className="mt-1.5 text-[11.5px] text-muted">{phrase.notes}</p> : null}

                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <CopyButton text={phrase.japanese} />
                            <AddToReviewButton contentType="clinical-phrase" contentId={phrase.id} />
                            <NoteButton contentType="clinical-phrase" contentId={phrase.id} defaultTitle={phrase.japanese} />
                            <BookmarkButton contentKey={key} label="" />
                            {phrase.specialtyTags.length > 0 ? (
                              <span className="ml-1 text-[10.5px] text-muted">{phrase.specialtyTags.join(' · ')}</span>
                            ) : null}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11.5px] text-muted">
            <Link href="/medical/quick" className="text-primary hover:underline">
              Quick clinical mode
            </Link>
            <span>{rows.length} phrases across 18 stages</span>
            <span>Copy buttons copy the Japanese only.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
