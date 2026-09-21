'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  BookMarked,
  BookmarkPlus,
  Check,
  Clock,
  Eye,
  Focus,
  Highlighter,
  Pause,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import type { MistakeCategory, ReadingSkill } from '@/lib/content/schema';
import type { ReadingAids } from '@/lib/content/lookup';
import { MISTAKE_LABELS, SKILL_LABELS } from '@/lib/content/taxonomy';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatPercent } from '@/lib/utils/format';
import { Badge, Button, Callout, EmptyState, LinkButton, Meter, SectionHeading } from '@/components/ui/primitives';
import { SegmentedControl, Tabs } from '@/components/ui/interactive';
import { AddToReviewButton } from '@/components/study/review-controls';
import { PassageView, type PassageParagraph } from './passage-view';
import { QuestionPane, type QuestionView } from './question-pane';

/* ------------------------------------------------------------------
   Reading workspace.

   Left: the passage, with adjustable typography and a click-through
   dictionary. Right: questions, the dictionary panel, and notebook
   tools. Answers are written to the profile as they change, so a
   passage is never lost by navigating away.
------------------------------------------------------------------ */

export type PassageMeta = {
  id: string;
  title: string;
  titleEn?: string;
  category: string;
  level: string;
  topic: string;
  characterCount: number;
  estimatedMinutes: number;
  difficulty: number;
  paragraphs: PassageParagraph[];
  verificationStatus: string;
};

const SKILL_TO_MISTAKE: Record<ReadingSkill, MistakeCategory> = {
  'main-idea': 'main-idea',
  detail: 'distractor',
  inference: 'inference',
  reference: 'reference',
  paraphrase: 'paraphrase',
  'author-intent': 'inference',
  structure: 'contrast',
};

export function ReadingWorkspace({
  passage,
  questions,
  aids,
  available,
}: {
  passage: PassageMeta;
  questions: QuestionView[];
  aids: ReadingAids;
  available: { id: string; title: string; level: string }[];
}) {
  const { state, actions, ready } = useStudy();

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [showConnectors, setShowConnectors] = useState(true);
  const [showRoles, setShowRoles] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pane, setPane] = useState<'questions' | 'dictionary' | 'notebook'>('questions');
  const [mobilePane, setMobilePane] = useState<'passage' | 'questions'>('passage');
  const [noteDraft, setNoteDraft] = useState('');

  // Local typography state mirrors the profile so the toolbar feels instant.
  const [fontSize, setFontSize] = useState(18);
  const [leading, setLeading] = useState(1.95);
  const [measure, setMeasure] = useState(34);
  const [furigana, setFurigana] = useState<'hidden' | 'hover' | 'always'>('hover');
  const [serif, setSerif] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!ready || hydrated.current) return;
    hydrated.current = true;
    setFontSize(state.settings.readingSize);
    setLeading(state.settings.readingLeading);
    setMeasure(state.settings.readingWidthRem);
    setFurigana(state.settings.furigana);
    setSerif(state.settings.readingFont === 'serif');
    if (state.settings.timerEnabled === false) setRunning(false);
    const saved = state.readingProgress[passage.id];
    if (saved) setAnswers(saved.answers);
  }, [passage.id, ready, state.readingProgress, state.settings]);

  useEffect(() => {
    if (!running || submitted) return;
    const timer = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [running, submitted]);

  const marks = state.readingMarks[passage.id] ?? [];
  const entry = selected ? aids.glossary[selected] : undefined;

  const answeredCount = questions.filter((question) => answers[question.id] !== undefined).length;
  const score = questions.filter((question) => answers[question.id] === question.correctIndex).length;
  const accuracy = questions.length > 0 ? score / questions.length : 0;

  const bySkill = useMemo(() => {
    const map = new Map<string, { correct: number; total: number }>();
    for (const question of questions) {
      const entryValue = map.get(question.skill) ?? { correct: 0, total: 0 };
      entryValue.total += 1;
      if (answers[question.id] === question.correctIndex) entryValue.correct += 1;
      map.set(question.skill, entryValue);
    }
    return [...map.entries()].sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total);
  }, [answers, questions]);

  const answerQuestion = (questionId: string, optionIndex: number) => {
    setAnswers((current) => {
      const next = { ...current, [questionId]: optionIndex };
      actions.setReadingProgress({
        passageId: passage.id,
        answers: next,
        secondsSpent: elapsed,
        updatedAt: new Date().toISOString(),
      });
      return next;
    });
  };

  const submit = () => {
    const finishedAt = new Date();
    const list = questions.map((question) => {
      const chosenIndex = answers[question.id] ?? -1;
      const chosenOption = chosenIndex >= 0 ? question.options[chosenIndex] : undefined;
      return {
        questionId: question.id,
        chosenIndex,
        correct: chosenIndex === question.correctIndex,
        skill: question.skill as ReadingSkill,
        category: (chosenOption?.trap as MistakeCategory | undefined) ?? SKILL_TO_MISTAKE[question.skill as ReadingSkill],
        secondsSpent: 0,
        prompt: question.prompt,
      };
    });

    const answered = list.filter((item) => item.chosenIndex >= 0);
    const correct = answered.filter((item) => item.correct).length;

    actions.recordReadingAttempt({
      id: `${passage.id}-${Date.now()}`,
      passageId: passage.id,
      startedAt: new Date(Date.now() - elapsed * 1000).toISOString(),
      finishedAt: finishedAt.toISOString(),
      secondsSpent: elapsed,
      answers: answered.map(({ prompt: _prompt, ...rest }) => rest),
      score: correct,
      total: questions.length,
    });

    for (const item of answered) {
      if (item.correct) continue;
      actions.recordMistake({
        contentId: passage.id,
        contentType: 'reading',
        category: item.category,
        questionId: item.questionId,
        passageId: passage.id,
        note: item.prompt.length > 90 ? `${item.prompt.slice(0, 90)}…` : item.prompt,
      });
    }

    // Rushed reading is its own diagnosis, not a vocabulary problem.
    const estimateSeconds = passage.estimatedMinutes * 60;
    if (answered.length > 0 && correct / answered.length < 0.6 && elapsed < estimateSeconds * 0.5) {
      actions.recordMistake({
        contentId: passage.id,
        contentType: 'reading',
        category: 'rushed',
        passageId: passage.id,
        note: `Finished in ${formatDuration(elapsed)} against an estimate of ${passage.estimatedMinutes} min, with ${correct}/${answered.length} correct.`,
      });
    }

    actions.clearReadingProgress(passage.id);
    setSubmitted(true);
    setPane('questions');
    setMobilePane('questions');
  };

  const retry = () => {
    setAnswers({});
    setSubmitted(false);
    setElapsed(0);
    setRunning(true);
    setActiveQuestion(0);
    setMobilePane('passage');
  };

  const toggleMark = (surface: string) => {
    const next = marks.includes(surface) ? marks.filter((item) => item !== surface) : [...marks, surface];
    actions.setReadingMarks(passage.id, next);
  };

  const markedEntries = marks
    .map((surface) => aids.glossary[surface])
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const evidence =
    submitted && questions[activeQuestion]
      ? {
          paragraph: questions[activeQuestion].evidenceParagraph,
          sentence: questions[activeQuestion].evidenceSentence,
        }
      : undefined;

  const nextPassage = available[(available.findIndex((item) => item.id === passage.id) + 1) % Math.max(1, available.length)];

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="border-b border-border pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="meta-label">
              Reading · {passage.level} · {passage.category.replace(/-/g, ' ')}
            </div>
            <h1 lang="ja" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
              {passage.title}
            </h1>
            {passage.titleEn ? <p className="mt-0.5 text-[13px] text-muted-foreground">{passage.titleEn}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted">
            <span className="font-mono tabular-nums">{passage.characterCount}字</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              est. {passage.estimatedMinutes} min
            </span>
            <span className="font-mono tabular-nums" title="Elapsed time">
              {formatDuration(elapsed)}
            </span>
            <Meter value={passage.difficulty} max={10} tone={passage.difficulty >= 8 ? 'danger' : 'info'} className="w-24" />
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="ghost" size="sm" onClick={() => setRunning((value) => !value)} title="Pause or resume the timer">
          {running && !submitted ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {running && !submitted ? 'Pause' : 'Resume'}
        </Button>
        <div className="flex items-center gap-1 rounded-md border border-border px-1">
          <button
            type="button"
            aria-label="Smaller text"
            className="px-1.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              const next = Math.max(15, fontSize - 1);
              setFontSize(next);
              actions.updateSettings({ readingSize: next });
            }}
          >
            A−
          </button>
          <span className="font-mono text-[11px] text-muted">{fontSize}</span>
          <button
            type="button"
            aria-label="Larger text"
            className="px-1.5 py-1 text-[12px] text-muted-foreground hover:text-foreground"
            onClick={() => {
              const next = Math.min(26, fontSize + 1);
              setFontSize(next);
              actions.updateSettings({ readingSize: next });
            }}
          >
            A+
          </button>
        </div>
        <SegmentedControl
          ariaLabel="Line spacing"
          size="sm"
          value={String(leading)}
          onChange={(value) => {
            const next = Number(value);
            setLeading(next);
            actions.updateSettings({ readingLeading: next });
          }}
          options={[
            { value: '1.6', label: '1.6' },
            { value: '1.95', label: '1.95' },
            { value: '2.3', label: '2.3' },
          ]}
        />
        <SegmentedControl
          ariaLabel="Line width"
          size="sm"
          value={String(measure)}
          onChange={(value) => {
            const next = Number(value);
            setMeasure(next);
            actions.updateSettings({ readingWidthRem: next });
          }}
          options={[
            { value: '28', label: 'Narrow' },
            { value: '34', label: 'Standard' },
            { value: '42', label: 'Wide' },
          ]}
        />
        <SegmentedControl
          ariaLabel="Furigana"
          size="sm"
          value={furigana}
          onChange={(value) => {
            setFurigana(value);
            actions.updateSettings({ furigana: value });
          }}
          options={[
            { value: 'hidden', label: 'Hide' },
            { value: 'hover', label: 'Hover' },
            { value: 'always', label: 'Show' },
          ]}
        />
        <Button
          variant={serif ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            const next = !serif;
            setSerif(next);
            actions.updateSettings({ readingFont: next ? 'serif' : 'sans' });
          }}
          title="Mincho (serif) or Gothic (sans)"
        >
          <AlignLeft className="h-3.5 w-3.5" />
          {serif ? 'Mincho' : 'Gothic'}
        </Button>
        <Button variant={showConnectors ? 'primary' : 'ghost'} size="sm" onClick={() => setShowConnectors((value) => !value)}>
          <Sparkles className="h-3.5 w-3.5" />
          Connectors
        </Button>
        <Button variant={showRoles ? 'primary' : 'ghost'} size="sm" onClick={() => setShowRoles((value) => !value)}>
          <Eye className="h-3.5 w-3.5" />
          Structure
        </Button>
        <Button variant={focus ? 'primary' : 'ghost'} size="sm" onClick={() => setFocus((value) => !value)} className="ml-auto">
          <Focus className="h-3.5 w-3.5" />
          Focus
        </Button>
      </div>

      {/* Results strip */}
      {submitted ? (
        <section className="rounded-lg border border-border bg-surface p-3.5">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div>
              <div className="meta-label">Score</div>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className={cn('font-mono text-2xl tabular-nums', accuracy >= 0.8 ? 'text-success' : accuracy >= 0.6 ? 'text-warning' : 'text-danger')}>
                  {score}/{questions.length}
                </span>
                <span className="text-[12px] text-muted">{formatPercent(accuracy)}</span>
              </div>
            </div>
            <div>
              <div className="meta-label">Time</div>
              <div className="mt-0.5 font-mono text-[15px] tabular-nums text-foreground">
                {formatDuration(elapsed)}
                <span className="ml-1.5 text-[11px] text-muted">vs est. {passage.estimatedMinutes}m</span>
              </div>
            </div>
            <div className="min-w-[200px] flex-1">
              <div className="meta-label mb-1">Weakest skills this passage</div>
              <div className="flex flex-wrap gap-1.5">
                {bySkill.slice(0, 3).map(([skill, value]) => (
                  <Badge
                    key={skill}
                    tone={value.correct / value.total >= 0.8 ? 'success' : value.correct / value.total >= 0.5 ? 'warning' : 'danger'}
                  >
                    {SKILL_LABELS[skill as keyof typeof SKILL_LABELS]?.en ?? skill} {value.correct}/{value.total}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={retry}>
                <RefreshCw className="h-3.5 w-3.5" />
                Read again
              </Button>
              {nextPassage && nextPassage.id !== passage.id ? (
                <LinkButton href={`/reading/${nextPassage.id}`} size="sm" variant="ghost">
                  Next passage
                </LinkButton>
              ) : null}
              <LinkButton href="/notebook?tab=mistakes" size="sm" variant="ghost">
                Mistakes filed
              </LinkButton>
            </div>
          </div>
          <p className="mt-2.5 border-t border-border pt-2 text-[12px] leading-relaxed text-muted">
            Every wrong answer below shows the evidence sentence, the paragraph it sits in, why each distractor fails, and the skill
            being tested. The paragraph that proves each answer is highlighted in the passage while you review.
          </p>
        </section>
      ) : null}

      {/* Mobile pane switch */}
      <div className="lg:hidden">
        <SegmentedControl
          ariaLabel="Pane"
          value={mobilePane}
          onChange={setMobilePane}
          options={[
            { value: 'passage', label: `Passage` },
            { value: 'questions', label: `Questions ${answeredCount}/${questions.length}` },
          ]}
        />
      </div>

      <div className={cn('grid min-w-0 gap-6', focus ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_380px]')}>
        {/* Passage */}
        <div className={cn('min-w-0', mobilePane !== 'passage' && 'hidden lg:block')}>
          <PassageView
            paragraphs={passage.paragraphs}
            glossary={aids.glossary}
            furigana={aids.furigana}
            connectors={aids.connectors}
            furiganaMode={furigana}
            showConnectors={showConnectors}
            marks={marks}
            selected={selected}
            evidence={evidence}
            showRoles={showRoles}
            fontSize={fontSize}
            leading={leading}
            measureRem={focus ? Math.max(measure, 40) : measure}
            serif={serif}
            onSelect={(surface) => {
              setSelected(surface);
              setPane('dictionary');
              if (mobilePane === 'passage') setMobilePane('passage');
            }}
          />

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border pt-3 text-[11.5px] text-muted">
            <span>Tap any word for its reading and meaning.</span>
            {showConnectors ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2 w-4 border-b border-dotted border-primary" />
                logical connector
              </span>
            ) : null}
            {marks.length > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-4 rounded-sm bg-primary-muted" />
                {marks.length} highlighted
              </span>
            ) : null}
            <Link href="/vocabulary" className="ml-auto text-primary hover:underline">
              Browse vocabulary
            </Link>
          </div>

          {!submitted && answeredCount === questions.length && questions.length > 0 ? (
            <div className="mt-4">
              <Callout tone="info" title="All questions answered">
                Submit to see the evidence for each answer. Your time and answers have already been saved.
              </Callout>
            </div>
          ) : null}
        </div>

        {/* Right pane */}
        <aside className={cn('min-w-0', focus ? 'hidden' : '', mobilePane !== 'questions' && 'hidden lg:block')}>
          <div className="lg:sticky lg:top-14 lg:max-h-[calc(100dvh-5rem)] lg:overflow-y-auto lg:pr-1 scroll-thin">
            <Tabs
              items={[
                { id: 'questions', label: 'Questions', count: questions.length },
                { id: 'dictionary', label: 'Dictionary' },
                { id: 'notebook', label: 'Notebook', count: marks.length },
              ]}
              value={pane}
              onChange={(value) => setPane(value as typeof pane)}
            />

            {pane === 'questions' ? (
              <div className="pt-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted">
                  <span>
                    {answeredCount}/{questions.length} answered
                  </span>
                  {submitted ? (
                    <Button variant="ghost" size="sm" onClick={retry}>
                      <RefreshCw className="h-3.5 w-3.5" />
                      Reset
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" disabled={answeredCount < questions.length} onClick={submit}>
                      <Check className="h-3.5 w-3.5" />
                      Submit answers
                    </Button>
                  )}
                </div>
                <QuestionPane
                  questions={questions}
                  answers={answers}
                  submitted={submitted}
                  onAnswer={answerQuestion}
                  onFocus={setActiveQuestion}
                />
              </div>
            ) : null}

            {pane === 'dictionary' ? (
              <div className="space-y-4 pt-3">
                {!selected ? (
                  <EmptyState
                    compact
                    title="No word selected"
                    description="Click any word in the passage to see its reading, meaning and the entry behind it."
                    icon={<Search className="h-4 w-4" />}
                  />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 lang="ja" className="text-xl tracking-tight text-foreground">
                            {entry?.surface ?? selected}
                          </h3>
                          {entry?.kana ? (
                            <p lang="ja" className="text-[12.5px] text-muted">
                              {entry.kana}
                            </p>
                          ) : null}
                        </div>
                        <button type="button" onClick={() => setSelected(undefined)} aria-label="Clear selection" className="text-muted hover:text-foreground">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {entry ? (
                        <>
                          <p className="mt-2 text-[13.5px] text-foreground">{entry.en}</p>
                          {entry.idn ? <p className="text-[12.5px] text-muted-foreground">{entry.idn}</p> : null}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <Badge tone="neutral">{entry.type.replace('-', ' ')}</Badge>
                            <Link href={entry.url} className="text-[11.5px] text-primary hover:underline">
                              Open full entry
                            </Link>
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-[12.5px] text-muted">
                          Only the reading is known for this word — it is not a dictionary entry yet.
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
                      {entry && entry.type !== 'grammar' ? (
                        <AddToReviewButton
                          contentType={entry.type === 'vocabulary' ? 'vocabulary' : 'medical-term'}
                          contentId={entry.contentId}
                        />
                      ) : null}
                      <Button variant="ghost" size="sm" onClick={() => toggleMark(selected)}>
                        <Highlighter className="h-3.5 w-3.5" />
                        {marks.includes(selected) ? 'Remove highlight' : 'Highlight'}
                      </Button>
                    </div>

                    {entry?.tags.length ? (
                      <p className="text-[11.5px] text-muted">
                        Tags: {entry.tags.join(', ')}
                      </p>
                    ) : null}
                  </div>
                )}

                {marks.length > 0 ? (
                  <section className="border-t border-border pt-3">
                    <SectionHeading
                      title="Highlighted words"
                      hint={`${marks.length}`}
                      action={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            actions.addManyToReview(
                              markedEntries
                                .filter((item) => item.type !== 'grammar')
                                .map((item) => ({
                                  contentType: item.type === 'vocabulary' ? ('vocabulary' as const) : ('medical-term' as const),
                                  contentId: item.contentId,
                                })),
                            )
                          }
                        >
                          <BookmarkPlus className="h-3.5 w-3.5" />
                          Add all
                        </Button>
                      }
                    />
                    <ul className="divide-y divide-border pt-1">
                      {marks.map((surface) => (
                        <li key={surface} className="flex items-center gap-2 py-1.5">
                          <button
                            type="button"
                            lang="ja"
                            className="min-w-0 flex-1 truncate text-left text-[13.5px] text-foreground hover:text-primary"
                            onClick={() => {
                              setSelected(surface);
                            }}
                          >
                            {surface}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMark(surface)}
                            aria-label={`Remove ${surface} from highlights`}
                            className="text-muted hover:text-danger"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}

            {pane === 'notebook' ? (
              <div className="space-y-4 pt-3">
                <section>
                  <SectionHeading title="Reading note" hint="saved to the notebook" />
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    rows={5}
                    placeholder="What made this passage hard? Which sentence decided an answer?"
                    className="mt-2 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-[13px] leading-relaxed text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none"
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={!ready || noteDraft.trim().length === 0}
                      onClick={() => {
                        actions.saveNote({
                          kind: 'reading',
                          title: passage.title,
                          body: noteDraft.trim(),
                          tags: ['reading', passage.level],
                          links: [`reading:${passage.id}`],
                        });
                        setNoteDraft('');
                      }}
                    >
                      <BookMarked className="h-3.5 w-3.5" />
                      Save note
                    </Button>
                    <Link href="/notebook" className="text-[11.5px] text-primary hover:underline">
                      Open notebook
                    </Link>
                  </div>
                </section>

                <section>
                  <SectionHeading title="Passage facts" />
                  <dl className="space-y-1.5 pt-3 text-[12.5px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Category</dt>
                      <dd className="text-foreground">{passage.category.replace(/-/g, ' ')}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Level</dt>
                      <dd className="text-foreground">{passage.level}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Difficulty</dt>
                      <dd className="font-mono tabular-nums text-foreground">{passage.difficulty}/10</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Characters</dt>
                      <dd className="font-mono tabular-nums text-foreground">{passage.characterCount}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Verification</dt>
                      <dd className="text-foreground">{passage.verificationStatus}</dd>
                    </div>
                  </dl>
                </section>

                {state.mistakes.filter((mistake) => mistake.passageId === passage.id).length > 0 ? (
                  <section>
                    <SectionHeading title="Mistakes from this passage" />
                    <ul className="divide-y divide-border pt-1">
                      {state.mistakes
                        .filter((mistake) => mistake.passageId === passage.id)
                        .slice(-6)
                        .reverse()
                        .map((mistake) => (
                          <li key={mistake.id} className="flex items-start gap-2 py-1.5">
                            <Badge tone="warning" className="mt-0.5 shrink-0">
                              {MISTAKE_LABELS[mistake.category].en}
                            </Badge>
                            <span className="min-w-0 flex-1 text-[12px] leading-relaxed text-muted-foreground">{mistake.note}</span>
                          </li>
                        ))}
                    </ul>
                  </section>
                ) : null}
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      {!submitted ? (
        <div className="flex items-center gap-2 border-t border-border pt-3 text-[11.5px] text-muted">
          <TriangleAlert className="h-3.5 w-3.5" />
          Answers are saved as you choose them. Leaving this page will not lose your progress.
        </div>
      ) : null}
    </div>
  );
}
