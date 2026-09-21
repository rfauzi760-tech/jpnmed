'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Clock, RotateCcw, Target } from 'lucide-react';
import { SKILL_LABELS } from '@/lib/content/taxonomy';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { formatMinutes, formatPercent, formatRelative } from '@/lib/utils/format';
import { Badge, Button, EmptyState, PageHeader, Meter, SectionHeading } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/interactive';

/* ------------------------------------------------------------------
   Reading index.

   Presents passages as practice material, not as articles: what it
   costs in minutes, how many questions it asks, which skills it tests,
   and what happened last time. In-progress passages come first.
------------------------------------------------------------------ */

export type PassageRow = {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  level: string;
  topic: string;
  characterCount: number;
  estimatedMinutes: number;
  difficulty: number;
  questionCount: number;
  skills: string[];
  verificationStatus: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  notice: 'Notice',
  email: 'Email',
  essay: 'Essay',
  opinion: 'Opinion',
  explanation: 'Explanation',
  science: 'Science',
  health: 'Health',
  society: 'Society',
  workplace: 'Workplace',
  news: 'News',
  'medical-information': 'Medical information',
  'hospital-notice': 'Hospital notice',
  'patient-instructions': 'Patient instructions',
};

export function ReadingIndex({ rows }: { rows: PassageRow[] }) {
  const { state, ready } = useStudy();
  const [level, setLevel] = useState<'all' | 'N3' | 'N2' | 'N1'>('all');
  const [status, setStatus] = useState<'all' | 'in-progress' | 'done' | 'untouched'>('all');

  const attemptByPassage = useMemo(() => {
    const map = new Map<string, { best: number; total: number; last: string; attempts: number }>();
    for (const attempt of state.attempts) {
      const existing = map.get(attempt.passageId);
      const ratio = attempt.total > 0 ? attempt.score / attempt.total : 0;
      if (!existing) {
        map.set(attempt.passageId, { best: ratio, total: attempt.total, last: attempt.finishedAt, attempts: 1 });
      } else {
        map.set(attempt.passageId, {
          best: Math.max(existing.best, ratio),
          total: attempt.total,
          last: new Date(attempt.finishedAt) > new Date(existing.last) ? attempt.finishedAt : existing.last,
          attempts: existing.attempts + 1,
        });
      }
    }
    return map;
  }, [state.attempts]);

  const inProgress = useMemo(
    () => Object.values(state.readingProgress).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [state.readingProgress],
  );

  const filtered = useMemo(() => {
    return rows
      .filter((row) => (level === 'all' ? true : row.level === level))
      .filter((row) => {
        if (status === 'all') return true;
        const attempt = attemptByPassage.get(row.id);
        const progress = state.readingProgress[row.id];
        if (status === 'in-progress') return Boolean(progress) && !attempt;
        if (status === 'done') return Boolean(attempt);
        return !attempt && !progress;
      })
      .sort((a, b) => {
        const aProgress = state.readingProgress[a.id] ? 1 : 0;
        const bProgress = state.readingProgress[b.id] ? 1 : 0;
        if (aProgress !== bProgress) return bProgress - aProgress;
        return a.estimatedMinutes - b.estimatedMinutes;
      });
  }, [attemptByPassage, level, rows, state.readingProgress, status]);

  const completed = rows.filter((row) => attemptByPassage.has(row.id)).length;
  const averageAccuracy = useMemo(() => {
    const attempts = state.attempts;
    if (attempts.length === 0) return 0;
    const correct = attempts.reduce((sum, attempt) => sum + attempt.score, 0);
    const total = attempts.reduce((sum, attempt) => sum + attempt.total, 0);
    return total > 0 ? correct / total : 0;
  }, [state.attempts]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Reading · 読解"
        title="Reading trainer"
        description="Real passage formats — notices, essays, hospital explanations — read under a timer, then analysed question by question against the evidence sentence."
        meta={
          <>
            <span>{rows.length} passages</span>
            <span>
              {completed} completed{ready ? '' : ' (loading)'}
            </span>
            {state.attempts.length > 0 ? (
              <span>
                {formatPercent(averageAccuracy)} average accuracy across {state.attempts.length} attempts
              </span>
            ) : null}
          </>
        }
        actions={
          <Link
            href="/notebook?tab=mistakes"
            className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-foreground hover:bg-surface-secondary"
          >
            Mistake notebook
          </Link>
        }
      />

      {inProgress.length > 0 ? (
        <section className="rounded-lg border border-border bg-surface p-3.5">
          <SectionHeading title="Unfinished passages" hint="answers are kept as you go" />
          <ul className="divide-y divide-border pt-1">
            {inProgress.map((progress) => {
              const row = rows.find((item) => item.id === progress.passageId);
              if (!row) return null;
              const answered = Object.keys(progress.answers).length;
              return (
                <li key={progress.passageId} className="flex items-center gap-3 py-2">
                  <BookOpen className="h-4 w-4 shrink-0 text-muted" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/reading/${row.id}`} lang="ja" className="block truncate text-[14px] text-foreground hover:text-primary">
                      {row.title}
                    </Link>
                    <p className="text-[11.5px] text-muted">
                      {answered}/{row.questionCount} answered · saved {formatRelative(progress.updatedAt)}
                    </p>
                  </div>
                  <Link
                    href={`/reading/${row.id}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                  >
                    Resume
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel="Level"
          value={level}
          onChange={setLevel}
          options={[
            { value: 'all', label: 'All levels' },
            { value: 'N3', label: 'N3' },
            { value: 'N2', label: 'N2' },
            { value: 'N1', label: 'N1' },
          ]}
        />
        <SegmentedControl
          ariaLabel="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Everything' },
            { value: 'in-progress', label: 'In progress' },
            { value: 'done', label: 'Completed' },
            { value: 'untouched', label: 'Not started' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No passages match" description="Change the level or status filter to see more material." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((row) => {
            const attempt = attemptByPassage.get(row.id);
            return (
              <li key={row.id} className="group flex flex-wrap items-start gap-x-5 gap-y-2 py-3">
                <div className="min-w-[260px] flex-1">
                  <Link href={`/reading/${row.id}`} className="block">
                    <span lang="ja" className="text-[15.5px] tracking-tight text-foreground group-hover:text-primary">
                      {row.title}
                    </span>
                    {row.titleEn ? <span className="ml-2 text-[11.5px] text-muted">{row.titleEn}</span> : null}
                    <span className="mt-0.5 block text-[12px] text-muted">
                      {CATEGORY_LABELS[row.category] ?? row.category} · {row.topic}
                    </span>
                  </Link>
                </div>

                <div className="flex min-w-[220px] flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {formatMinutes(row.estimatedMinutes)}
                  </span>
                  <span className="font-mono tabular-nums">{row.characterCount}字</span>
                  <span className="inline-flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {row.questionCount} questions
                  </span>
                  <span className="flex flex-wrap gap-1">
                    {row.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="rounded-[4px] bg-surface-secondary px-1.5 py-px text-[10.5px] text-muted-foreground">
                        {SKILL_LABELS[skill as keyof typeof SKILL_LABELS]?.en ?? skill}
                      </span>
                    ))}
                  </span>
                </div>

                <div className="flex min-w-[150px] shrink-0 flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Badge tone="primary">{row.level}</Badge>
                    {attempt ? (
                      <Badge tone={attempt.best >= 0.8 ? 'success' : attempt.best >= 0.6 ? 'warning' : 'danger'}>
                        best {formatPercent(attempt.best)}
                      </Badge>
                    ) : state.readingProgress[row.id] ? (
                      <Badge tone="info">In progress</Badge>
                    ) : (
                      <Badge tone="outline">Not started</Badge>
                    )}
                  </div>
                  <div className={cn('w-full max-w-[150px]', attempt ? '' : 'opacity-40')}>
                    <span className="mb-1 block font-mono text-[10.5px] text-muted">difficulty {row.difficulty}/10</span>
                    <Meter value={row.difficulty} max={10} tone={row.difficulty >= 8 ? 'danger' : row.difficulty >= 6 ? 'warning' : 'info'} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3 text-[11.5px] text-muted">
        <span>
          {state.attempts.length} attempts · {state.mistakes.filter((mistake) => mistake.passageId).length} reading mistakes filed
        </span>
        {state.attempts.length > 0 ? (
          <Link href="/progress" className="inline-flex items-center gap-1 text-primary hover:underline">
            <RotateCcw className="h-3 w-3" />
            See skill breakdown
          </Link>
        ) : null}
      </div>
    </div>
  );
}
