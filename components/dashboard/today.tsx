'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Braces,
  CalendarDays,
  Flame,
  Layers,
  NotebookPen,
  Stethoscope,
  Target,
  TriangleAlert,
} from 'lucide-react';
import { CONTENT_TYPE_LABELS, MISTAKE_LABELS } from '@/lib/content/taxonomy';
import type { CardStub } from '@/lib/content/study';
import { buildSessionQueue, masteryDistribution, queueSummary } from '@/lib/srs/queue';
import {
  daySeries,
  logLabel,
  masteryCounts,
  medicalCoverage,
  mistakeInsights,
  readingStats,
  recentLogs,
  recentMistakes,
  reviewForecast,
  streak,
  todayStats,
  weakCategories,
} from '@/lib/store/selectors';
import { useStudy } from '@/lib/store/provider';
import { formatDuration, formatMinutes, formatRelative, greeting } from '@/lib/utils/format';
import { Badge, Button, EmptyState, Progress, SectionHeading, Skeleton } from '@/components/ui/primitives';
import { openCommandPalette } from '@/components/shell/command-palette';
import { ConsistencyGrid, ForecastBars, BarList, MasteryBar } from '@/components/progress/charts';

/* ------------------------------------------------------------------
   The dashboard answers one question: what should I study right now?
   Everything below either feeds the review queue, opens a drill, or
   shows a weakness that the next session will address.
------------------------------------------------------------------ */

export function TodayDashboard({ cards }: { cards: CardStub[] }) {
  const { state, ready } = useStudy();

  const derived = useMemo(() => {
    if (!ready) return null;
    const summary = queueSummary(state, cards);
    const queue = buildSessionQueue(state, cards, { limit: state.settings.sessionLimit });
    const today = todayStats(state);
    const coverage = medicalCoverage(state);
    return {
      summary,
      queue,
      today,
      streakDays: streak(state),
      series: daySeries(state, 84),
      forecast: reviewForecast(state, 14),
      mastery: masteryCounts(state),
      distribution: masteryDistribution(state.reviews),
      insights: mistakeInsights(state),
      weak: weakCategories(state),
      mistakes: recentMistakes(state, 5),
      logs: recentLogs(state, 6),
      reading: readingStats(state, 30),
      coverage,
      notesCount: state.notes.length,
    };
  }, [cards, ready, state]);

  if (!derived) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const { summary, today, streakDays, series, forecast, mastery, insights, weak, mistakes, logs, reading, coverage } = derived;
  const estimatedSeconds = summary.due * 9 + summary.newAvailable * 14;
  const reviewProgress = Math.min(1, today.reviews / Math.max(1, state.settings.dailyReviewGoal));

  const plan = [
    {
      id: 'review',
      label: 'Spaced repetition',
      detail: summary.due > 0 ? `${summary.due} due · ${summary.newAvailable} new` : `${summary.newAvailable} new cards available`,
      minutes: 10,
      done: today.reviews > 0,
      href: '/review',
      icon: Layers,
    },
    {
      id: 'reading',
      label: 'Reading drill',
      detail: reading.attempts > 0 ? `${reading.attempts} passages in 30 days · ${reading.questions} questions` : 'One passage with full result analysis',
      minutes: 15,
      done: today.readingSeconds > 0,
      href: '/reading',
      icon: BookOpen,
    },
    {
      id: 'medical',
      label: 'Medical Japanese',
      detail: `${coverage.termsTracked} terms and ${coverage.phrasesTracked} phrases tracked`,
      minutes: 10,
      done: today.medical > 0,
      href: '/medical',
      icon: Stethoscope,
    },
    {
      id: 'case',
      label: 'Clinical case',
      detail: coverage.cases > 0 ? `${coverage.cases} completed` : 'Run one consultation in Japanese',
      minutes: 10,
      done: today.cases > 0,
      href: '/cases',
      icon: Target,
    },
    {
      id: 'grammar',
      label: 'Grammar contrast',
      detail: 'Compare two patterns that get confused in reading',
      minutes: 10,
      done: false,
      href: '/grammar/compare',
      icon: Braces,
    },
  ];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="meta-label">{new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Today</h1>
        </div>
        <div className="flex items-center gap-2">
          {streakDays > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[12px] text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-warning" />
              <span className="tabular-nums">{streakDays}</span> day streak
            </span>
          ) : null}
          <Button variant="ghost" size="sm" onClick={() => openCommandPalette()}>
            Search <span className="hidden text-muted sm:inline">everything</span>
          </Button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          {/* Primary action block */}
          <section className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="meta-label">Due now</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-4xl tabular-nums leading-none tracking-tight text-foreground">{summary.due}</span>
                  <span className="text-[13px] text-muted-foreground">
                    review{summary.due === 1 ? '' : 's'}
                    {summary.newAvailable > 0 ? ` · ${summary.newAvailable} new` : ''}
                  </span>
                </div>
                <p className="mt-1.5 text-[12.5px] text-muted">
                  {summary.due === 0 && summary.newAvailable === 0
                    ? 'Nothing is due. Read a passage, or study a clinical topic.'
                    : `Session of ${derived.queue.length} cards · about ${formatMinutes(Math.max(1, estimatedSeconds / 60))}`}
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:items-end">
                {summary.due + summary.newAvailable > 0 ? (
                  <Link
                    href="/review"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    Start review
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href="/reading"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                  >
                    Reading drill
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                <div className="flex gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => openCommandPalette('胸痛')}>
                    Quick medical
                  </Button>
                  <Link
                    href="/notebook?new=1"
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-surface px-2.5 text-xs text-foreground hover:bg-surface-secondary"
                  >
                    <NotebookPen className="h-3.5 w-3.5" /> Note
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between text-[11.5px] text-muted">
                <span>
                  Daily goal · {today.reviews}/{state.settings.dailyReviewGoal} reviews
                </span>
                <span>
                  Reading today · {formatDuration(today.readingSeconds)}
                  {today.cases > 0 ? ` · ${today.cases} case${today.cases === 1 ? '' : 's'}` : ''}
                </span>
              </div>
              <Progress value={reviewProgress} className="mt-2" />
            </div>

            {insights.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-border pt-3">
                {insights.slice(0, 2).map((insight) => (
                  <li key={insight} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                    <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                    {insight}
                  </li>
                ))}
              </ul>
            ) : null}
          </section>

          {/* Plan */}
          <section>
            <SectionHeading title="Today’s plan" hint="30–60 minutes" />
            <ul className="divide-y divide-border">
              {plan.map((block) => {
                const Icon = block.icon;
                return (
                  <li key={block.id}>
                    <Link href={block.href} className="group flex items-center gap-3 py-2.5">
                      <span
                        className={
                          block.done
                            ? 'flex h-5 w-5 items-center justify-center rounded-full bg-success-muted text-success'
                            : 'flex h-5 w-5 items-center justify-center rounded-full border border-border text-muted'
                        }
                      >
                        <Icon className="h-3 w-3" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] text-foreground group-hover:text-primary">{block.label}</span>
                        <span className="block truncate text-[12px] text-muted">{block.detail}</span>
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{block.minutes}m</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <SectionHeading
                title="Weak areas"
                hint="last 60 days"
                action={
                  <Link href="/notebook?tab=mistakes" className="text-[12px] text-primary hover:underline">
                    All mistakes
                  </Link>
                }
              />
              <div className="pt-3">
                <BarList
                  items={weak.map((item) => ({
                    label: item.label,
                    value: item.count,
                    total: weak.reduce((sum, entry) => sum + entry.count, 0),
                    hint: `${Math.round(item.share * 100)}% of recent misses`,
                  }))}
                  tone="warning"
                  emptyLabel="No mistakes recorded yet. Wrong reading answers are categorised here automatically."
                />
              </div>
            </section>

            <section>
              <SectionHeading
                title="Recent mistakes"
                action={
                  <Link href="/notebook?tab=mistakes" className="text-[12px] text-primary hover:underline">
                    Notebook
                  </Link>
                }
              />
              {mistakes.length === 0 ? (
                <div className="pt-3">
                  <EmptyState
                    compact
                    title="Nothing to review here"
                    description="Answer a reading question incorrectly and the reason it went wrong is filed automatically."
                  />
                </div>
              ) : (
                <ul className="divide-y divide-border pt-1">
                  {mistakes.map((mistake) => (
                    <li key={mistake.id} className="flex items-start gap-2.5 py-2">
                      <Badge tone="warning" className="mt-0.5 shrink-0">
                        {MISTAKE_LABELS[mistake.category].en}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] text-foreground">{mistake.note ?? mistake.contentId}</p>
                        <p className="text-[11px] text-muted">
                          {CONTENT_TYPE_LABELS[mistake.contentType]?.en ?? mistake.contentType} · {formatRelative(mistake.createdAt)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section>
            <SectionHeading title="Recent activity" />
            {logs.length === 0 ? (
              <div className="pt-3">
                <EmptyState compact title="No study recorded yet" description="Reviews, reading sessions and cases appear here as you work." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {logs.map((log) => (
                  <li key={log.id} className="flex items-baseline justify-between gap-3 py-1.5 text-[12.5px]">
                    <span className="truncate text-muted-foreground">{logLabel(log)}</span>
                    <span className="shrink-0 text-[11px] text-muted">{formatRelative(log.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Context column */}
        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Consistency" hint="12 weeks" />
            <div className="pt-3">
              <ConsistencyGrid
                days={series.map((day) => ({
                  key: day.key,
                  label: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(day.date),
                  reviews: day.stats.reviews + day.stats.newItems,
                  readingMinutes: Math.round(day.stats.readingSeconds / 60),
                  isToday: day.isToday,
                }))}
              />
            </div>
          </section>

          <section>
            <SectionHeading title="Review load" hint="next 14 days" />
            <div className="pt-3">
              <ForecastBars days={forecast.days} max={forecast.max} overdue={forecast.overdue} />
            </div>
          </section>

          <section>
            <SectionHeading
              title="Mastery"
              hint={`${mastery.total} tracked`}
              action={
                <Link href="/progress" className="text-[12px] text-primary hover:underline">
                  Progress
                </Link>
              }
            />
            <div className="pt-3">
              {mastery.total === 0 ? (
                <p className="text-[12.5px] text-muted">Nothing tracked yet. Cards enter the queue as you review them.</p>
              ) : (
                <MasteryBar counts={mastery.counts} total={mastery.total} />
              )}
            </div>
          </section>

          <section>
            <SectionHeading title="Notes" />
            <div className="flex items-center justify-between pt-3 text-[12.5px]">
              <span className="text-muted-foreground">{derived.notesCount} notebook notes</span>
              <Link href="/notebook" className="text-primary hover:underline">
                Open
              </Link>
            </div>
          </section>

          <section>
            <SectionHeading title="Coverage" hint="medical" />
            <dl className="space-y-1.5 pt-3 text-[12.5px]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Terms tracked</dt>
                <dd className="font-mono tabular-nums">{coverage.termsTracked}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Phrases tracked</dt>
                <dd className="font-mono tabular-nums">{coverage.phrasesTracked}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Encounter stages</dt>
                <dd className="font-mono tabular-nums">{coverage.stagesCovered}/19</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cases completed</dt>
                <dd className="font-mono tabular-nums">{coverage.cases}</dd>
              </div>
            </dl>
            <Link href="/medical/quick" className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary hover:underline">
              <CalendarDays className="h-3.5 w-3.5" /> Open quick clinical mode
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
