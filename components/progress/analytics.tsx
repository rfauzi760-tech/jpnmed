'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { MISTAKE_LABELS, SKILL_LABELS, stageLabel } from '@/lib/content/taxonomy';
import {
  accuracyTone,
  daySeries,
  masteryCounts,
  medicalCoverage,
  mistakeBreakdown,
  mistakeInsights,
  readingStats,
  retention,
  reviewForecast,
  reviewItemsByType,
  streak,
  todayStats,
} from '@/lib/store/selectors';
import { MASTERY_LABELS, masteryDistribution, masteryOf } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatMinutes, formatPercent } from '@/lib/utils/format';
import { Badge, EmptyState, PageHeader, SectionHeading, StatRow } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/interactive';
import { BarList, ConsistencyGrid, ForecastBars, MasteryBar, Sparkline, StageProgress } from '@/components/progress/charts';

/* ------------------------------------------------------------------
   Progress.

   Every number on this page is derived from a stored event, and each
   block ends in a decision the learner can act on. Decorative analytics
   were deliberately left out.
------------------------------------------------------------------ */

export type ProgressTotals = {
  library: { vocabulary: number; grammar: number; terms: number; phrases: number; symptoms: number; diseases: number };
  stages: { id: string; label: string; total: number }[];
  specialtiesOf: Record<string, string[]>;
};

export function ProgressAnalytics({ totals }: { totals: ProgressTotals }) {
  const { state, ready } = useStudy();
  const [days, setDays] = useState<'30' | '90' | 'all'>('30');
  const windowDays = days === 'all' ? 3650 : Number(days);

  const derived = useMemo(() => {
    const reading = readingStats(state, windowDays);
    const mistakeList = mistakeBreakdown(state, windowDays);
    const retentionStats = retention(state, windowDays);
    const coverage = medicalCoverage(state);
    const mastery = masteryCounts(state);
    const forecast = reviewForecast(state, 14);
    const series = daySeries(state, 84);
    const byType = reviewItemsByType(state.reviews);

    // Grammar recall is measured from logged reviews of grammar cards.
    const grammarLogs = state.logs.filter((log) => log.kind === 'review' && log.area.startsWith('grammar:'));
    const grammarAgain = grammarLogs.filter((log) => log.area.endsWith(':again')).length;

    const vocabularyLogs = state.logs.filter((log) => log.kind === 'review' && log.area.startsWith('vocabulary:'));
    const vocabularyAgain = vocabularyLogs.filter((log) => log.area.endsWith(':again')).length;

    // Reading accuracy trend: attempts in chronological order.
    const attemptSeries = [...state.attempts]
      .sort((a, b) => new Date(a.finishedAt).getTime() - new Date(b.finishedAt).getTime())
      .map((attempt) => (attempt.total > 0 ? attempt.score / attempt.total : 0));

    const specialties = new Set<string>();
    for (const item of Object.values(state.reviews)) {
      if (item.contentType !== 'medical-term') continue;
      for (const specialty of totals.specialtiesOf[item.contentId] ?? []) specialties.add(specialty);
    }

    const stageRows = totals.stages.map((stage) => {
      const tracked = Object.values(state.reviews).filter(
        (item) => item.contentType === 'clinical-phrase' && item.contentId.split('-')[1] === stage.id,
      );
      return { ...stage, covered: tracked.length };
    });

    return {
      reading,
      mistakeList,
      retentionStats,
      coverage,
      mastery,
      forecast,
      series,
      byType,
      grammar: { total: grammarLogs.length, again: grammarAgain },
      vocabulary: { total: vocabularyLogs.length, again: vocabularyAgain },
      attemptSeries,
      insights: mistakeInsights(state),
      specialties: [...specialties],
      stageRows,
      streakDays: streak(state),
      today: todayStats(state),
      distribution: masteryDistribution(state.reviews),
    };
  }, [state, totals, windowDays]);

  if (!ready) {
    return (
      <div className="space-y-3">
        <PageHeader eyebrow="Progress · 進捗" title="Analytics" />
        <p className="text-[13px] text-muted">Loading your study history…</p>
      </div>
    );
  }

  const trackedTotal = Object.keys(state.reviews).length;

  if (trackedTotal === 0 && state.attempts.length === 0 && state.caseAttempts.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Progress · 進捗" title="Analytics" />
        <EmptyState
          title="No study recorded yet"
          description="This page fills in as you review cards, read passages and run cases. Nothing is estimated or invented — every figure comes from an event you produced."
          action={
            <div className="flex flex-wrap gap-2">
              <Link href="/review" className="inline-flex h-7 items-center rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground">
                Start reviewing
              </Link>
              <Link href="/reading" className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-foreground">
                Read a passage
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const recallRate = (again: number, total: number) => (total === 0 ? 0 : (total - again) / total);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress · 進捗"
        title="Analytics"
        description="Accuracy, retention and coverage — each block ends in something to do next."
        meta={
          <>
            <span>{trackedTotal} items tracked</span>
            <span>{state.attempts.length} reading attempts</span>
            <span>{state.caseAttempts.length} cases</span>
            <span>{derived.streakDays} day streak</span>
          </>
        }
        actions={
          <SegmentedControl
            ariaLabel="Window"
            value={days}
            onChange={setDays}
            options={[
              { value: '30', label: '30 days' },
              { value: '90', label: '90 days' },
              { value: 'all', label: 'All time' },
            ]}
          />
        }
      />

      {/* Movement this window */}
      <section>
        <SectionHeading title="Japanese" hint="reading, recall and accuracy" />
        <div className="mt-3">
          <StatRow
            items={[
              {
                label: 'Reading accuracy',
                value: derived.reading.questions > 0 ? formatPercent(derived.reading.accuracy) : '—',
                hint: `${derived.reading.questions} questions`,
              },
              {
                label: 'Seconds / question',
                value:
                  derived.reading.questions > 0 ? `${Math.round(derived.reading.averageSecondsPerQuestion)}s` : '—',
                hint: derived.reading.attempts > 0 ? `${derived.reading.attempts} passages` : undefined,
              },
              {
                label: 'Review recall',
                value: derived.retentionStats.sessions > 0 ? formatPercent(recallRate(derived.retentionStats.reviewed - derived.retentionStats.recalled, derived.retentionStats.reviewed)) : '—',
                hint: `${derived.retentionStats.sessions} reviews`,
              },
              {
                label: 'Grammar recall',
                value: derived.grammar.total > 0 ? formatPercent(recallRate(derived.grammar.again, derived.grammar.total)) : '—',
                hint: `${derived.grammar.total} grammar reviews`,
              },
            ]}
          />
        </div>
      </section>

      <div className="grid gap-7 lg:grid-cols-2">
        <section>
          <SectionHeading title="Mistake distribution" hint={`last ${days === 'all' ? 'year' : `${days} days`}`} />
          <div className="pt-3">
            <BarList
              items={derived.mistakeList.map((item) => ({
                label: MISTAKE_LABELS[item.category]?.en ?? item.category,
                value: item.count,
                total: derived.mistakeList.reduce((sum, entry) => sum + entry.count, 0),
                hint: `${Math.round(item.share * 100)}% of filed mistakes`,
              }))}
              tone="warning"
              emptyLabel="No mistakes filed in this window."
            />
          </div>
          {derived.insights.length > 0 ? (
            <ul className="mt-3 space-y-1 border-t border-border pt-3">
              {derived.insights.map((insight) => (
                <li key={insight} className="text-[12.5px] leading-relaxed text-muted-foreground">
                  {insight}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section>
          <SectionHeading title="Reading by skill" hint="weakest first" />
          <div className="pt-3">
            <BarList
              items={derived.reading.bySkill.map((row) => ({
                label: SKILL_LABELS[row.skill as keyof typeof SKILL_LABELS]?.en ?? row.skill,
                value: Math.round(row.accuracy * 100),
                total: 100,
                hint: `${row.total} questions`,
              }))}
              tone={derived.reading.accuracy >= 0.8 ? 'primary' : 'danger'}
              emptyLabel="No reading questions answered in this window."
            />
          </div>
          {derived.attemptSeries.length > 1 ? (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-baseline justify-between">
                <span className="meta-label">Accuracy trend</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                  <TrendingUp className="h-3 w-3" />
                  {derived.attemptSeries.length} attempts
                </span>
              </div>
              <Sparkline points={derived.attemptSeries} />
              <p className="text-[11px] text-muted">
                Latest attempt {formatPercent(derived.attemptSeries[derived.attemptSeries.length - 1])} correct.
              </p>
            </div>
          ) : null}
        </section>
      </div>

      <section>
        <SectionHeading title="Vocabulary and grammar load" hint="scheduled work" />
        <div className="mt-3 grid gap-7 lg:grid-cols-2">
          <div>
            <ForecastBars days={derived.forecast.days} max={derived.forecast.max} overdue={derived.forecast.overdue} />
            <p className="mt-2 text-[11.5px] text-muted">
              {derived.forecast.overdue > 0
                ? 'Overdue reviews compound; clear them before adding new material.'
                : 'The next two weeks are sustainable. This is a good time to add new entries.'}
            </p>
          </div>
          <div>
            <MasteryBar counts={derived.mastery.counts} total={derived.mastery.total} />
            <p className="mt-2 text-[11.5px] text-muted">
              {derived.mastery.mastered} of {derived.mastery.total} tracked items are strong or mastered.
            </p>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Medical Japanese" hint="what is usable in a room" />
        <div className="mt-3 grid gap-7 lg:grid-cols-3">
          <div>
            <StageProgress stages={derived.stageRows} />
          </div>
          <div>
            <dl className="space-y-2 text-[12.5px]">
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">Terminology tracked</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  {derived.coverage.termsTracked}
                  <span className="text-muted">/{totals.library.terms}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">Phrases tracked</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  {derived.coverage.phrasesTracked}
                  <span className="text-muted">/{totals.library.phrases}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">Strong or mastered clinical items</dt>
                <dd className="font-mono tabular-nums text-foreground">{derived.coverage.mastered}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">Specialties touched</dt>
                <dd className="font-mono tabular-nums text-foreground">{derived.specialties.length}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-b border-border pb-1.5">
                <dt className="text-muted-foreground">Encounter stages covered</dt>
                <dd className="font-mono tabular-nums text-foreground">{derived.coverage.stagesCovered}/18</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Case accuracy</dt>
                <dd className={cn('font-mono tabular-nums', `text-${accuracyTone(derived.coverage.caseAccuracy)}`)}>
                  {derived.coverage.cases > 0 ? formatPercent(derived.coverage.caseAccuracy) : '—'}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
              A stage counts as covered when any of its phrases is in the review queue — the phrasebook is the checklist for a
              complete encounter.
            </p>
          </div>
          <div>
            <div className="meta-label mb-1.5">By content type</div>
            <ul className="space-y-1.5 text-[12.5px]">
              {[...derived.byType.entries()].map(([type, value]) => (
                <li key={type} className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">{type.replace(/-/g, ' ')}</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {value.mastered}
                    <span className="text-muted">/{value.tracked}</span>
                  </span>
                </li>
              ))}
              {derived.byType.size === 0 ? <li className="text-muted">Nothing tracked yet.</li> : null}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Consistency" hint="12 weeks" />
        <div className="mt-3">
          <ConsistencyGrid
            days={derived.series.map((day) => ({
              key: day.key,
              label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(day.date),
              reviews: day.stats.reviews + day.stats.newItems,
              readingMinutes: Math.round(day.stats.readingSeconds / 60),
              isToday: day.isToday,
            }))}
          />
          <p className="mt-1 text-[11.5px] text-muted">
            Today: {derived.today.reviews} reviews · {formatDuration(derived.today.readingSeconds)} reading ·{' '}
            {derived.today.cases} case{derived.today.cases === 1 ? '' : 's'} · goal {state.settings.dailyReviewGoal} reviews (
            {formatPercent(Math.min(1, derived.today.reviews / Math.max(1, state.settings.dailyReviewGoal)))})
          </p>
        </div>
      </section>

      {/* Next actions */}
      <section>
        <SectionHeading title="What to do next" hint="derived from the above" />
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {buildRecommendations({
            readingAccuracy: derived.reading.accuracy,
            weakestSkill: derived.reading.bySkill[0]?.skill,
            overdue: derived.forecast.overdue,
            topMistake: derived.mistakeList[0]?.category,
            stagesCovered: derived.coverage.stagesCovered,
            termsTracked: derived.coverage.termsTracked,
            phrasesTracked: derived.coverage.phrasesTracked,
            cases: derived.coverage.cases,
            unseenVocabulary: totals.library.vocabulary,
          }).map((recommendation) => (
            <li key={recommendation.href}>
              <Link href={recommendation.href} className="group flex items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] text-foreground group-hover:text-primary">{recommendation.title}</span>
                  <span className="block text-[11.5px] text-muted">{recommendation.reason}</span>
                </span>
                <Badge tone={recommendation.tone ?? 'outline'}>{recommendation.tag}</Badge>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="border-t border-border pt-3 text-[11.5px] text-muted">
        Mastery levels are derived from scheduler stability: {MASTERY_LABELS.familiar} at first successful reviews,{' '}
        {MASTERY_LABELS.strong} around a month, {MASTERY_LABELS.mastered} beyond four months.
        {Object.values(state.reviews).filter((item) => masteryOf(item) === 'learning').length > 0
          ? ` ${Object.values(state.reviews).filter((item) => masteryOf(item) === 'learning').length} items are still in learning.`
          : ''}
      </p>
    </div>
  );
}

function buildRecommendations(input: {
  readingAccuracy: number;
  weakestSkill?: string;
  overdue: number;
  topMistake?: string;
  stagesCovered: number;
  termsTracked: number;
  phrasesTracked: number;
  cases: number;
  unseenVocabulary: number;
}) {
  const items: { title: string; reason: string; href: string; tag: string; tone?: 'primary' | 'warning' | 'danger' | 'success' }[] = [];

  if (input.overdue > 0) {
    items.push({
      title: 'Clear the overdue reviews first',
      reason: `${input.overdue} cards are past due, which inflates every interval that follows.`,
      href: '/review',
      tag: 'Review',
      tone: 'danger',
    });
  }
  if (input.weakestSkill) {
    items.push({
      title: `Drill the weakest reading skill: ${SKILL_LABELS[input.weakestSkill as keyof typeof SKILL_LABELS]?.en ?? input.weakestSkill}`,
      reason: `Your accuracy there is the lowest recorded, so a passage that exercises it moves the average most.`,
      href: '/reading',
      tag: 'Reading',
      tone: 'warning',
    });
  }
  if (input.topMistake) {
    items.push({
      title: `Review filed mistakes: ${MISTAKE_LABELS[input.topMistake as keyof typeof MISTAKE_LABELS]?.en ?? input.topMistake}`,
      reason: 'The notebook lists each miss with the evidence sentence, so the cause stays visible.',
      href: '/notebook?tab=mistakes',
      tag: 'Notebook',
    });
  }
  if (input.stagesCovered < 18) {
    items.push({
      title: 'Cover another encounter stage',
      reason: `${18 - input.stagesCovered} of the eighteen stages have no phrases in the review queue yet.`,
      href: '/medical/phrases',
      tag: 'Phrasebook',
      tone: 'primary',
    });
  }
  if (input.termsTracked < 40) {
    items.push({
      title: 'Add more clinical terminology',
      reason: `${input.termsTracked} terms are tracked. A ward-facing core is roughly a hundred items.`,
      href: '/medical/terms',
      tag: 'Terms',
    });
  }
  if (input.cases < 3) {
    items.push({
      title: 'Run another clinical case',
      reason: 'Cases expose the questions you never think to ask, which reading alone cannot.',
      href: '/cases',
      tag: 'Cases',
      tone: 'primary',
    });
  }
  if (input.phrasesTracked > 0 && input.cases >= 3) {
    items.push({
      title: 'Compare two grammar patterns used in the last passage',
      reason: `Reading accuracy is ${formatPercent(input.readingAccuracy)}. Contrast drills target the inference questions that cost the most.`,
      href: '/grammar/compare',
      tag: 'Grammar',
    });
  }

  return items.slice(0, 5);
}
