'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, Layers, PauseCircle, RotateCcw, Sparkles } from 'lucide-react';
import type { ReviewRating } from '@/lib/content/schema';
import type { StudyCard } from '@/lib/content/study';
import { RETENTION_KEYS, RETENTION_LABELS, RATINGS, previewIntervals } from '@/lib/srs/fsrs';
import { buildSessionQueue, type SessionItem } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatMinutes, intervalLabel } from '@/lib/utils/format';
import { Badge, Button, EmptyState, Kbd, LinkButton, PageHeader, Progress, SectionHeading } from '@/components/ui/primitives';
import { ShortcutHint } from '@/components/ui/interactive';
import { BookmarkButton } from '@/components/study/review-controls';
import { RomajiLine } from '@/components/study/prefs';

/* ------------------------------------------------------------------
   Review session.

   One card at a time, four honest ratings, and the interval each one
   implies shown before the learner commits. The queue is composed once
   per session so rating a card never reshuffles what is in front of you.
------------------------------------------------------------------ */

export type DeckKey = 'all' | 'vocabulary' | 'grammar' | 'medical' | 'phrases' | 'symptoms' | 'diseases';

const DECK_FILTERS: Record<DeckKey, (card: StudyCard) => boolean> = {
  all: () => true,
  vocabulary: (card) => card.contentType === 'vocabulary',
  grammar: (card) => card.contentType === 'grammar',
  medical: (card) => card.contentType === 'medical-term',
  phrases: (card) => card.contentType === 'clinical-phrase',
  symptoms: (card) => card.contentType === 'symptom',
  diseases: (card) => card.contentType === 'disease',
};

const DECK_LABELS: Record<DeckKey, string> = {
  all: 'Everything',
  vocabulary: 'Vocabulary',
  grammar: 'Grammar',
  medical: 'Terminology',
  phrases: 'Phrases',
  symptoms: 'Symptoms',
  diseases: 'Diseases',
};

const RATING_TONE: Record<ReviewRating, string> = {
  again: 'border-danger/40 text-danger hover:bg-danger-muted',
  hard: 'border-warning/40 text-warning hover:bg-warning-muted',
  good: 'border-info/40 text-info hover:bg-info-muted',
  easy: 'border-success/40 text-success hover:bg-success-muted',
};

export function ReviewSession({
  cards,
  initialDeck = 'all',
}: {
  cards: StudyCard[];
  initialDeck?: DeckKey;
}) {
  const { state, actions, ready } = useStudy();
  const [deck, setDeck] = useState<DeckKey>(initialDeck);
  const [queue, setQueue] = useState<SessionItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [sessionKey, setSessionKey] = useState(0);
  const [tally, setTally] = useState<Record<ReviewRating, number>>({ again: 0, hard: 0, good: 0, easy: 0 });
  const [struggled, setStruggled] = useState<string[]>([]);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [flash, setFlash] = useState<string | null>(null);
  const [lastExplanation, setLastExplanation] = useState<string | null>(null);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Compose the queue once per session. Ratings must not rebuild it.
  useEffect(() => {
    if (!ready) return;
    const current = stateRef.current;
    setQueue(buildSessionQueue(current, cards, { filter: DECK_FILTERS[deck] }));
    setIndex(0);
    setRevealed(false);
    setTally({ again: 0, hard: 0, good: 0, easy: 0 });
    setStruggled([]);
    setStartedAt(Date.now());
    setLastExplanation(null);
  }, [cards, deck, ready, sessionKey]);

  const current = queue?.[index];
  const card = current?.card;
  const done = queue !== null && index >= queue.length;

  const previews = useMemo(() => {
    if (!card || !revealed) return null;
    const base =
      state.reviews[card.key] ??
      ({
        id: card.key,
        contentId: card.contentId,
        contentType: card.contentType,
        due: new Date().toISOString(),
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        state: 'new' as const,
        createdAt: new Date().toISOString(),
      } satisfies (typeof state.reviews)[string]);
    return previewIntervals(base);
  }, [card, revealed, state.reviews]);

  const rate = (rating: ReviewRating) => {
    if (!card || !revealed) return;
    actions.rate(card.key, rating, { contentType: card.contentType, contentId: card.contentId });
    const result = previews?.[rating];
    setLastExplanation(result ? result.explanation : null);
    setTally((current) => ({ ...current, [rating]: current[rating] + 1 }));
    if (rating === 'again') setStruggled((list) => [card.front, ...list].slice(0, 8));
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  const suspend = () => {
    if (!card) return;
    actions.suspend(card.key, true);
    setFlash(`${card.front} suspended — it will stay out of the queue.`);
    setRevealed(false);
    setIndex((value) => value + 1);
  };

  // Keyboard: space reveals, 1–4 rate, s suspends.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }
      if (event.key === 'Escape') {
        setRevealed(false);
        return;
      }
      if (!revealed) return;
      const rating = RATINGS.find((item) => RETENTION_KEYS[item] === event.key);
      if (rating) {
        event.preventDefault();
        rate(rating);
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        suspend();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const total = queue?.length ?? 0;
  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  const reviewedCount = tally.again + tally.hard + tally.good + tally.easy;

  if (!ready || queue === null) {
    return (
      <div className="space-y-3">
        <PageHeader eyebrow="Review · 復習" title="Session" />
        <p className="text-[13px] text-muted">Preparing the queue…</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Review · 復習" title="Nothing in this deck yet" />
        <EmptyState
          title="The queue is empty for this deck"
          description="Either everything scheduled has been reviewed, or no cards from this deck have been added yet. Adding entries from vocabulary, terminology or the phrasebook puts them here."
          action={
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/vocabulary" size="sm" variant="secondary">
                Browse vocabulary
              </LinkButton>
              <LinkButton href="/medical/terms" size="sm" variant="ghost">
                Medical dictionary
              </LinkButton>
              <LinkButton href="/reading" size="sm" variant="ghost">
                Reading drill
              </LinkButton>
            </div>
          }
        />
        <DeckPicker deck={deck} onChange={setDeck} />
      </div>
    );
  }

  if (done) {
    const accuracy = reviewedCount > 0 ? (reviewedCount - tally.again) / reviewedCount : 0;
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Review · 復習"
          title="Session complete"
          description={`${reviewedCount} cards in ${formatMinutes(Math.max(1, elapsed / 60))}. Progress is saved automatically.`}
          actions={
            <Button variant="primary" size="md" onClick={() => setSessionKey((key) => key + 1)}>
              <RotateCcw className="h-3.5 w-3.5" />
              New session
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <section>
              <SectionHeading title="How it went" />
              <dl className="grid grid-cols-2 gap-3 pt-3 sm:grid-cols-4">
                {RATINGS.map((rating) => (
                  <div key={rating} className="rounded-md border border-border px-3 py-2">
                    <dt className="meta-label">{RETENTION_LABELS[rating]}</dt>
                    <dd className="mt-0.5 font-mono text-xl tabular-nums text-foreground">{tally[rating]}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12.5px] text-muted">
                {Math.round(accuracy * 100)}% of this session was recalled without an Again rating. Only Again resets a card's
                interval, so honest Hard ratings are cheap.
              </p>
            </section>

            {struggled.length > 0 ? (
              <section>
                <SectionHeading title="Cards that slipped" hint="they return within the hour" />
                <ul className="divide-y divide-border pt-1">
                  {struggled.map((label) => (
                    <li key={label} lang="ja" className="py-1.5 text-[14px] text-foreground">
                      {label}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4 lg:border-l lg:border-border lg:pl-6">
            <section>
              <SectionHeading title="Next up" />
              <p className="pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                {nextLoadHint(state.reviews)}
              </p>
            </section>
            <div className="flex flex-wrap gap-2">
              <LinkButton href="/" size="sm" variant="secondary">
                Back to today
              </LinkButton>
              <LinkButton href="/reading" size="sm" variant="ghost">
                Read something
              </LinkButton>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Review · 復習"
        title={DECK_LABELS[deck]}
        meta={
          <>
            <span className="font-mono tabular-nums">
              {index + 1} / {total}
            </span>
            <span>{reviewedCount} rated this session</span>
            <span>{formatDuration(elapsed)} elapsed</span>
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={suspend} title="Skip this card and keep it out of the queue">
              <PauseCircle className="h-3.5 w-3.5" />
              Suspend
            </Button>
            <LinkButton href="/" size="sm" variant="ghost">
              End session
            </LinkButton>
          </>
        }
      />

      <Progress value={index / Math.max(1, total)} />

      <DeckPicker deck={deck} onChange={setDeck} />

      {flash ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-secondary/60 px-3 py-2 text-[12.5px] text-muted-foreground">
          {flash}
          <button type="button" className="text-primary hover:underline" onClick={() => setFlash(null)}>
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* Card */}
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-border pb-2 text-[11.5px] text-muted">
            <span className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              {card?.deck}
            </span>
            <span className="flex items-center gap-2">
              {card?.badge ? <Badge tone="neutral">{card.badge}</Badge> : null}
              {current?.kind === 'new' ? <Badge tone="primary">New</Badge> : current?.kind === 'relearning' ? <Badge tone="danger">Relearning</Badge> : <Badge tone="outline">Review</Badge>}
            </span>
          </div>

          <div className="min-h-[280px] py-6">
            <p lang="ja" className={cn('tracking-tight text-foreground', card && card.front.length > 12 ? 'text-2xl leading-relaxed' : 'text-4xl leading-snug')}>
              {card?.front}
            </p>

            {revealed ? (
              <div className="mt-6 space-y-4 animate-fade">
                <div>
                  {card?.kana ? (
                    <p lang="ja" className="text-[14px] text-muted-foreground">
                      {card.kana}
                    </p>
                  ) : null}
                  {card?.kana ? <RomajiLine kana={card.kana} /> : null}
                </div>
                <div>
                  <p className="text-[17px] leading-relaxed text-foreground">{card?.primary}</p>
                  {card?.secondary ? <p className="mt-0.5 text-[13.5px] text-muted-foreground">{card.secondary}</p> : null}
                </div>
                {card?.detail ? (
                  <p lang="ja" className="max-w-prose text-[13.5px] leading-relaxed text-muted-foreground">
                    {card.detail}
                  </p>
                ) : null}
                {card?.example ? (
                  <div className="border-l-2 border-l-border-strong pl-3">
                    {card.exampleLabel ? <div className="meta-label">{card.exampleLabel}</div> : null}
                    <p lang="ja" className="text-[14.5px] leading-relaxed text-foreground">
                      {card.example}
                    </p>
                  </div>
                ) : null}
                {card?.facets && card.facets.length > 0 ? (
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    {card.facets.map((facet) => (
                      <div key={facet.label} className="border-b border-border/70 pb-1.5">
                        <dt className="meta-label">{facet.label}</dt>
                        <dd lang="ja" className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                          {facet.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </div>
            ) : (
              <p className="mt-8 text-[12.5px] text-muted">
                Recall the reading, the meaning and how it is used — then reveal.
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="border-t border-border pt-3">
            {!revealed ? (
              <div className="flex items-center justify-between gap-3">
                <Button variant="primary" size="lg" onClick={() => setRevealed(true)} className="min-w-[160px]">
                  Show answer
                </Button>
                <ShortcutHint keys={['space']} />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {RATINGS.map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => rate(rating)}
                      className={cn(
                        'flex flex-col items-start gap-0.5 rounded-md border bg-surface px-3 py-2 text-left transition-colors',
                        RATING_TONE[rating],
                      )}
                    >
                      <span className="flex w-full items-center justify-between text-[13px] font-medium">
                        {RETENTION_LABELS[rating]}
                        <Kbd>{RETENTION_KEYS[rating]}</Kbd>
                      </span>
                      <span className="text-[11px] text-muted">
                        {previews ? intervalLabel(previews[rating].due) : ''}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11.5px] text-muted">
                    {lastExplanation ?? 'The interval under each rating is what that answer would schedule.'}
                  </p>
                  <ShortcutHint keys={['1', '2', '3', '4']} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Context */}
        <aside className="space-y-4 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <section>
            <SectionHeading title="About this card" />
            <dl className="space-y-2 pt-3 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Deck</dt>
                <dd className="text-foreground">{card?.deck}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Content type</dt>
                <dd className="text-foreground">{card?.contentType}</dd>
              </div>
              {current?.kind !== 'new' ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Reviews</dt>
                  <dd className="font-mono tabular-nums text-foreground">{state.reviews[card?.key ?? '']?.reps ?? 0}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          {card ? (
            <section className="space-y-2">
              <Link href={card.url} className="inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
                Open the full entry
                <ArrowRight className="h-3 w-3" />
              </Link>
              <div className="flex flex-wrap items-center gap-1">
                <BookmarkButton contentKey={card.key} />
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading title="Session" />
            <ul className="space-y-1.5 pt-3 text-[12px] text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-muted" />
                {tally.good + tally.easy} answered well
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-muted" />
                {tally.hard} answered with difficulty
              </li>
              <li className="flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-muted" />
                {tally.again} to relearn
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DeckPicker({ deck, onChange }: { deck: DeckKey; onChange: (deck: DeckKey) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {(Object.keys(DECK_LABELS) as DeckKey[]).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={cn(
            'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
            deck === key
              ? 'border-border-strong bg-surface-secondary text-foreground'
              : 'border-border text-muted-foreground hover:text-foreground',
          )}
        >
          {DECK_LABELS[key]}
        </button>
      ))}
    </div>
  );
}

function nextLoadHint(reviews: Record<string, { due: string; state: string; suspended?: boolean }>) {
  const upcoming = Object.values(reviews)
    .filter((item) => !item.suspended && item.state !== 'new' && new Date(item.due).getTime() > Date.now())
    .map((item) => new Date(item.due).getTime())
    .sort((a, b) => a - b);
  if (upcoming.length === 0) return 'Nothing is scheduled ahead. Adding entries to review is the fastest way to build load.';
  const earliest = new Date(upcoming[0]);
  const minutes = Math.max(1, Math.round((earliest.getTime() - Date.now()) / 60_000));
  return `${upcoming.length} cards are scheduled ahead; the next one arrives in about ${formatMinutes(minutes)}.`;
}
