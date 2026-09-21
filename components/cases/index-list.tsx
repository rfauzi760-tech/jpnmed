'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, TriangleAlert } from 'lucide-react';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { formatPercent, formatRelative } from '@/lib/utils/format';
import { Badge, EmptyState, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/interactive';

/* ------------------------------------------------------------------
   Case index.

   Shows what each case is for and what happened last time, so the
   choice is about clinical coverage rather than reading titles.
------------------------------------------------------------------ */

export type CaseRow = {
  id: string;
  title: string;
  titleJa: string;
  specialty: string;
  difficulty: string;
  setting: string;
  chiefComplaint: string;
  questionCount: number;
  redFlagCount: number;
  teachingPoints: number;
};

const DIFFICULTY_TONE: Record<string, 'outline' | 'warning' | 'danger' | 'neutral'> = {
  basic: 'outline',
  intermediate: 'neutral',
  advanced: 'warning',
  emergency: 'danger',
};

export function CaseIndex({ rows }: { rows: CaseRow[] }) {
  const { state, ready } = useStudy();
  const [specialty, setSpecialty] = useState('all');
  const [difficulty, setDifficulty] = useState('all');

  const specialties = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.specialty, (counts.get(row.specialty) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const attemptSummary = useMemo(() => {
    const map = new Map<string, { best: number; last: string; attempts: number }>();
    for (const attempt of state.caseAttempts) {
      const ratio = attempt.maxScore > 0 ? attempt.score / attempt.maxScore : 0;
      const existing = map.get(attempt.caseId);
      map.set(attempt.caseId, {
        best: Math.max(existing?.best ?? 0, ratio),
        last: !existing || new Date(attempt.finishedAt) > new Date(existing.last) ? attempt.finishedAt : existing.last,
        attempts: (existing?.attempts ?? 0) + 1,
      });
    }
    return map;
  }, [state.caseAttempts]);

  const filtered = rows.filter((row) => {
    if (specialty !== 'all' && row.specialty !== specialty) return false;
    if (difficulty !== 'all' && row.difficulty !== difficulty) return false;
    return true;
  });

  const finished = rows.filter((row) => attemptSummary.has(row.id)).length;
  const average = state.caseAttempts.length
    ? state.caseAttempts.reduce((sum, attempt) => sum + attempt.score / Math.max(1, attempt.maxScore), 0) / state.caseAttempts.length
    : 0;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Clinical cases · 症例"
        title="Consultation simulator"
        description="Run a Japanese consultation end to end: ask the questions, hear the answers, and get told exactly which clinically important question you never asked."
        meta={
          <>
            <span>{rows.length} cases</span>
            <span>
              {finished} attempted{ready ? '' : ' (loading)'}
            </span>
            {state.caseAttempts.length > 0 ? <span>{formatPercent(average)} average score across {state.caseAttempts.length} runs</span> : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <SegmentedControl
          ariaLabel="Difficulty"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: 'all', label: 'All' },
            { value: 'basic', label: 'Basic' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
            { value: 'emergency', label: 'Emergency' },
          ]}
        />
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSpecialty('all')}
            className={cn(
              'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
              specialty === 'all' ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            All specialties
          </button>
          {specialties.map(([id, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSpecialty(id)}
              className={cn(
                'rounded-[5px] border px-2 py-1 text-[11.5px] transition-colors',
                specialty === id ? 'border-border-strong bg-surface-secondary text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {id}
              <span className="ml-1 font-mono text-[10.5px] text-muted">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No cases match" description="Clear the specialty or difficulty filter." />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {filtered.map((row) => {
            const attempt = attemptSummary.get(row.id);
            return (
              <li key={row.id} className="group flex flex-wrap items-start gap-x-5 gap-y-2 py-3.5">
                <div className="min-w-[260px] flex-1">
                  <Link href={`/cases/${row.id}`} className="block">
                    <span lang="ja" className="text-[15.5px] tracking-tight text-foreground group-hover:text-primary">
                      {row.titleJa}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-muted-foreground">{row.title}</span>
                    <span className="mt-0.5 block text-[11.5px] text-muted">
                      {row.specialty} · {row.setting}
                    </span>
                  </Link>
                </div>
                <p lang="ja" className="min-w-[220px] flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
                  {row.chiefComplaint}
                </p>
                <div className="flex shrink-0 flex-col items-start gap-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={DIFFICULTY_TONE[row.difficulty] ?? 'outline'}>{row.difficulty}</Badge>
                    {row.redFlagCount > 0 ? (
                      <Badge tone="danger">
                        <TriangleAlert className="mr-0.5 h-3 w-3" />
                        {row.redFlagCount}
                      </Badge>
                    ) : null}
                    {attempt ? (
                      <Badge tone={attempt.best >= 0.85 ? 'success' : attempt.best >= 0.6 ? 'warning' : 'danger'}>
                        best {formatPercent(attempt.best)}
                      </Badge>
                    ) : (
                      <Badge tone="outline">Not run</Badge>
                    )}
                  </div>
                  <span className="text-[10.5px] text-muted">
                    {row.questionCount} questions · {row.teachingPoints} teaching points
                    {attempt ? ` · last ${formatRelative(attempt.last)}` : ''}
                  </span>
                  <Link
                    href={`/cases/${row.id}`}
                    className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
                  >
                    {attempt ? 'Run again' : 'Start case'}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <section>
        <SectionHeading title="How cases are structured" />
        <div className="grid gap-4 pt-3 text-[12.5px] leading-relaxed text-muted-foreground sm:grid-cols-3">
          <p>
            <span className="block text-foreground">Every case hides its diagnosis.</span>
            You ask questions in Japanese; the patient answers in Japanese. Nothing is revealed until you end the consultation.
          </p>
          <p>
            <span className="block text-foreground">Scoring is clinical, not linguistic.</span>
            Each important question carries a weight; red-flag questions carry the most. Missing one is reported explicitly.
          </p>
          <p>
            <span className="block text-foreground">Feedback includes phrasing.</span>
            Missing polite endings, over-long questions and double-barrelled sentences are listed alongside the clinical gaps.
          </p>
        </div>
      </section>
    </div>
  );
}
