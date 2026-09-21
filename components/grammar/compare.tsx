'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { GRAMMAR_FAMILY_LABELS } from '@/lib/content/taxonomy';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, Callout, EmptyState, PageHeader, SectionHeading, Select } from '@/components/ui/primitives';
import { SegmentedControl } from '@/components/ui/interactive';

/* ------------------------------------------------------------------
   Compare Grammar.

   Two patterns, one table, and an auto-generated discrimination drill
   built from the example sentences already in the database: the pattern
   is masked and the learner picks which of the two belongs there.
------------------------------------------------------------------ */

export type CompareRow = {
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
  whenNotToUse: string[];
  examples: { ja: string; en: string }[];
  contrastNote?: string;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function maskExample(sentence: string, pattern: string) {
  return sentence.replace(new RegExp(escapeRegExp(pattern)), '＿＿');
}

type Drill = { sentence: string; options: [string, string]; correct: 0 | 1; en: string; sourcePattern: string };

export function GrammarCompare({
  rows,
  featured,
  initialA,
  initialB,
}: {
  rows: CompareRow[];
  featured: { a: string; b: string; aPattern: string; bPattern: string }[];
  initialA?: string;
  initialB?: string;
}) {
  const [aId, setAId] = useState(initialA && rows.some((r) => r.id === initialA) ? initialA : rows[0]?.id ?? '');
  const [bId, setBId] = useState(
    initialB && rows.some((r) => r.id === initialB) ? initialB : rows[1]?.id ?? rows[0]?.id ?? '',
  );
  const [familyFilter, setFamilyFilter] = useState<'all' | 'same' | 'contrast'>('all');

  const a = rows.find((row) => row.id === aId);
  const b = rows.find((row) => row.id === bId);

  const drill = useMemo<Drill[]>(() => {
    if (!a || !b) return [];
    const items: Drill[] = [];
    const collect = (source: CompareRow, other: CompareRow) => {
      for (const example of source.examples) {
        if (!example.ja.includes(source.pattern)) continue;
        items.push({
          sentence: maskExample(example.ja, source.pattern),
          options: [a.pattern, b.pattern],
          correct: source.id === a.id ? 0 : 1,
          en: example.en,
          sourcePattern: source.pattern,
        });
      }
    };
    collect(a, b);
    collect(b, a);
    return items.slice(0, 8);
  }, [a, b]);

  const [drillIndex, setDrillIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [tally, setTally] = useState({ correct: 0, total: 0 });

  const optionRows = useMemo(() => {
    if (familyFilter === 'all') return rows;
    if (!a) return rows;
    return rows.filter((row) =>
      familyFilter === 'same' ? row.family === a.family : row.family !== a.family,
    );
  }, [a, familyFilter, rows]);

  if (!a || !b) {
    return <EmptyState title="No patterns available" description="The grammar library is empty." />;
  }

  const rowsOfComparison: { label: string; a: React.ReactNode; b: React.ReactNode; differs?: boolean }[] = [
    {
      label: 'Meaning',
      a: a.meaning,
      b: b.meaning,
      differs: a.meaning !== b.meaning,
    },
    {
      label: 'Indonesian',
      a: a.meaningsId ?? '—',
      b: b.meaningsId ?? '—',
    },
    {
      label: 'Structure',
      a: <span lang="ja">{a.formation}</span>,
      b: <span lang="ja">{b.formation}</span>,
      differs: a.formation !== b.formation,
    },
    {
      label: 'Function group',
      a: GRAMMAR_FAMILY_LABELS[a.family as keyof typeof GRAMMAR_FAMILY_LABELS]?.en ?? a.family,
      b: GRAMMAR_FAMILY_LABELS[b.family as keyof typeof GRAMMAR_FAMILY_LABELS]?.en ?? b.family,
      differs: a.family !== b.family,
    },
    {
      label: 'Register',
      a: a.register.join(', ') || 'neutral',
      b: b.register.join(', ') || 'neutral',
      differs: a.register.join() !== b.register.join(),
    },
    {
      label: 'Nuance',
      a: a.nuance,
      b: b.nuance,
      differs: true,
    },
    {
      label: 'Use it when',
      a: (
        <ul className="space-y-1">
          {a.whenToUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
      b: (
        <ul className="space-y-1">
          {b.whenToUse.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
      differs: true,
    },
    {
      label: 'Ruled out for',
      a: a.whenNotToUse.length ? a.whenNotToUse.join('; ') : '—',
      b: b.whenNotToUse.length ? b.whenNotToUse.join('; ') : '—',
    },
    {
      label: 'First example',
      a: (
        <span lang="ja">
          {a.examples[0]?.ja}
          <span className="mt-1 block text-[11.5px] text-muted">{a.examples[0]?.en}</span>
        </span>
      ),
      b: (
        <span lang="ja">
          {b.examples[0]?.ja}
          <span className="mt-1 block text-[11.5px] text-muted">{b.examples[0]?.en}</span>
        </span>
      ),
      differs: true,
    },
  ];

  const differenceCount = rowsOfComparison.filter((row) => row.differs).length;
  const currentDrill = drill[drillIndex];
  const answered = choice !== null;
  const isRight = currentDrill ? choice === currentDrill.correct : false;

  const grade = (index: number) => {
    if (answered || !currentDrill) return;
    setChoice(index);
    setTally((current) => ({
      correct: current.correct + (index === currentDrill.correct ? 1 : 0),
      total: current.total + 1,
    }));
  };

  const nextDrill = () => {
    setChoice(null);
    setDrillIndex((index) => (index + 1) % Math.max(1, drill.length));
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Grammar · 比較"
        title="Compare grammar"
        description="Put two near-synonymous patterns side by side: formation, register, nuance, and the examples that separate them."
        meta={
          <>
            <span>{differenceCount} fields differ</span>
            <span>
              {a.family === b.family
                ? `Same function group · ${GRAMMAR_FAMILY_LABELS[a.family as keyof typeof GRAMMAR_FAMILY_LABELS]?.en ?? a.family}`
                : 'Different function groups'}
            </span>
          </>
        }
      />

      {/* Selectors */}
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['A', aId, setAId],
              ['B', bId, setBId],
            ] as const
          ).map(([slot, value, setter]) => (
            <div key={slot} className="flex items-center gap-2">
              <span className="meta-label w-4 shrink-0">{slot}</span>
              <Select value={value} onChange={(event) => setter(event.target.value)}>
                {optionRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.pattern} — {row.meaning}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SegmentedControl
            ariaLabel="Filter patterns"
            value={familyFilter}
            onChange={setFamilyFilter}
            options={[
              { value: 'all', label: 'All patterns' },
              { value: 'same', label: 'Same group' },
              { value: 'contrast', label: 'Other groups' },
            ]}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAId(bId);
              setBId(aId);
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Swap
          </Button>
          <div className="flex flex-wrap items-center gap-1">
            {featured.slice(0, 6).map((pair) => (
              <button
                key={`${pair.a}-${pair.b}`}
                type="button"
                onClick={() => {
                  setAId(pair.a);
                  setBId(pair.b);
                }}
                className="rounded-[5px] border border-border px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
              >
                <span lang="ja">
                  {pair.aPattern} / {pair.bPattern}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse text-left align-top">
          <thead className="bg-surface-secondary/70">
            <tr>
              <th className="w-[130px] px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted">Field</th>
              <th className="px-3 py-2">
                <span lang="ja" className="text-[16px] tracking-tight text-foreground">
                  {a.pattern}
                </span>
                <span className="ml-2 text-[11.5px] text-muted">{a.kana}</span>
                <Badge className="ml-2" tone="primary">
                  {a.jlptLevel}
                </Badge>
              </th>
              <th className="px-3 py-2">
                <span lang="ja" className="text-[16px] tracking-tight text-foreground">
                  {b.pattern}
                </span>
                <span className="ml-2 text-[11.5px] text-muted">{b.kana}</span>
                <Badge className="ml-2" tone="primary">
                  {b.jlptLevel}
                </Badge>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rowsOfComparison.map((row) => (
              <tr key={row.label} className={cn(row.differs && 'bg-warning-muted/25')}>
                <th scope="row" className="px-3 py-2.5 align-top text-[11px] font-medium uppercase tracking-wider text-muted">
                  {row.label}
                </th>
                <td className="px-3 py-2.5 align-top text-[13px] leading-relaxed text-foreground">{row.a}</td>
                <td className="px-3 py-2.5 align-top text-[13px] leading-relaxed text-foreground">{row.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-warning-muted" />
          highlighted rows differ between the two patterns
        </span>
        <Link href={`/grammar/${a.id}`} className="hover:text-foreground">
          Open {a.pattern}
        </Link>
        <Link href={`/grammar/${b.id}`} className="hover:text-foreground">
          Open {b.pattern}
        </Link>
      </div>

      {a.contrastNote || b.contrastNote ? (
        <Callout tone="info" title="Contrast note">
          <p>{a.contrastNote ?? b.contrastNote}</p>
        </Callout>
      ) : null}

      {/* Discrimination drill */}
      <section>
        <SectionHeading
          title="Which one fits?"
          hint="examples from the database, with the pattern removed"
          action={
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {tally.correct}/{tally.total} correct
            </span>
          }
        />
        {!currentDrill ? (
          <div className="pt-3">
            <EmptyState
              compact
              title="No drill sentences for this pair"
              description="Neither pattern appears in the stored examples with its surface form intact."
            />
          </div>
        ) : (
          <div className="space-y-3 pt-3">
            <p lang="ja" className="text-[16px] leading-loose text-foreground">
              {currentDrill.sentence}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {[0, 1].map((index) => {
                const label = currentDrill.options[index];
                const state = !answered
                  ? 'idle'
                  : index === currentDrill.correct
                    ? 'correct'
                    : index === choice
                      ? 'wrong'
                      : 'idle';
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => grade(index)}
                    lang="ja"
                    className={cn(
                      'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-[14px] transition-colors',
                      state === 'idle' && 'border-border text-foreground hover:bg-surface-secondary',
                      state === 'correct' && 'border-success/40 bg-success-muted text-success',
                      state === 'wrong' && 'border-danger/40 bg-danger-muted text-danger',
                    )}
                  >
                    {state === 'correct' ? <Check className="h-3.5 w-3.5" /> : null}
                    {state === 'wrong' ? <X className="h-3.5 w-3.5" /> : null}
                    {label}
                  </button>
                );
              })}
              {answered ? (
                <Button variant="ghost" size="sm" onClick={nextDrill}>
                  Next sentence
                </Button>
              ) : null}
            </div>
            {answered ? (
              <div className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
                <p className={isRight ? 'text-success' : 'text-danger'}>
                  {isRight ? 'Correct.' : `It is ${currentDrill.options[currentDrill.correct]}.`}
                </p>
                <p>{currentDrill.en}</p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
