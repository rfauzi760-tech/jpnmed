'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, MessageSquare, RotateCcw, TriangleAlert, X } from 'lucide-react';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, Callout, EmptyState, LinkButton, PageHeader, SectionHeading } from '@/components/ui/primitives';
import { AddToReviewButton } from '@/components/study/review-controls';

/* ------------------------------------------------------------------
   Clinical case simulator (PRD §10).

   The consultation uses direct multiple-choice prompts so the learner can
   move quickly through a realistic history. Feedback lists what was asked,
   what was missed, why it mattered, and phrasing habits that would cost you
   in a real room.
------------------------------------------------------------------ */

export type CaseQuestion = {
  id: string;
  topic: string;
  acceptedPhrases: string[];
  acceptedPhraseReadings: { japanese: string; kana: string; romaji: string }[];
  why: string;
  weight: number;
  redFlag: boolean;
};

export type CaseView = {
  id: string;
  title: string;
  titleJa: string;
  specialty: string;
  difficulty: 'basic' | 'intermediate' | 'advanced' | 'emergency';
  setting: string;
  patientProfile: { age: number; sex: string; nationality?: string; occupation?: string; background?: string };
  chiefComplaint: string;
  hiddenDiagnosis: string;
  openingPhrase: string;
  openingPhraseKana: string;
  openingPhraseRomaji: string;
  openingPhraseIndonesian: string;
  questions: CaseQuestion[];
  patientLines: { id: string; topic: string; japanese: string; kana: string; romaji: string; english: string; indonesian: string }[];
  examinationFindings: string;
  expectedInvestigations: string[];
  teachingPoints: string[];
  drillTerms: { id: string; japanese: string; english: string }[];
  voiceNote?: string;
};

const POLITE_ENDINGS = ['です', 'ます', 'ください', 'でしょうか', 'いただけ', 'ましょう', 'ませんか'];
type Turn = {
  speaker: 'learner' | 'patient';
  japanese: string;
  kana?: string;
  romaji?: string;
  indonesian?: string;
  english?: string;
  note?: string;
};

export function CaseSimulator({ item }: { item: CaseView }) {
  const { state, actions, ready } = useStudy();
  const mode = 'multiple-choice' as const;
  const [stage, setStage] = useState<'brief' | 'consult' | 'results'>('brief');
  const [askedIds, setAskedIds] = useState<string[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [picked, setPicked] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const unasked = item.questions.filter((question) => !askedIds.includes(question.id));
  const asked = item.questions.filter((question) => askedIds.includes(question.id));

  const score = asked.reduce((sum, question) => sum + question.weight, 0);
  const maxScore = item.questions.reduce((sum, question) => sum + question.weight, 0);

  const missedRedFlags = item.questions.filter((question) => question.redFlag && !askedIds.includes(question.id));

  const phrasingNotes = useMemo(() => {
    const notes: string[] = [];
    const learnerTurns = turns.filter((turn) => turn.speaker === 'learner');
    if (learnerTurns.length === 0) return notes;
    const noEnding = learnerTurns.filter((turn) => !POLITE_ENDINGS.some((ending) => turn.japanese.includes(ending)));
    if (noEnding.length > 0) {
      notes.push(
        `${noEnding.length} of ${learnerTurns.length} questions had no polite ending. In a first encounter, です・ます or ください is expected: "${noEnding[0].japanese}"`,
      );
    }
    const longQuestions = learnerTurns.filter((turn) => turn.japanese.length > 40);
    if (longQuestions.length > 0) {
      notes.push(
        `${longQuestions.length} question(s) ran beyond about 40 characters. Patients lose the thread — split them: "${longQuestions[0].japanese.slice(0, 42)}…"`,
      );
    }
    const doubleBarrelled = learnerTurns.filter((turn) => (turn.japanese.match(/か。/g) ?? []).length > 1);
    if (doubleBarrelled.length > 0) {
      notes.push(`${doubleBarrelled.length} turn(s) asked two things at once ("…か。…か。"). Ask one question per sentence.`);
    }
    return notes;
  }, [turns]);

  const patientLineFor = (topic: string) => item.patientLines.find((line) => line.topic === topic);

  const askQuestion = (question: CaseQuestion, spoken: string) => {
    const line = patientLineFor(question.topic);
    setTurns((current) => [
      ...current,
      { speaker: 'learner', japanese: spoken },
      ...(line
        ? [{
            speaker: 'patient' as const,
            japanese: line.japanese,
            kana: line.kana,
            romaji: line.romaji,
            english: line.english,
            indonesian: line.indonesian,
          }]
        : []),
    ]);
    setAskedIds((current) => [...current, question.id]);
    setPicked(null);
    requestAnimationFrame(() => transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight }));
  };

  const pickMultipleChoice = (question: CaseQuestion) => {
    setPicked(question.id);
    if (askedIds.includes(question.id)) return;
    askQuestion(question, question.acceptedPhrases[0]);
  };

  const finish = () => {
    setStage('results');
    if (!ready) return;
    actions.recordCaseAttempt({
      id: `${item.id}-${Date.now()}`,
      caseId: item.id,
      finishedAt: new Date().toISOString(),
      mode,
      askedQuestionIds: askedIds,
      missedQuestionIds: unasked.map((question) => question.id),
      missedRedFlags: missedRedFlags.map((question) => question.id),
      score,
      maxScore,
      notes: phrasingNotes.join(' | ').slice(0, 900),
    });
  };

  const reset = () => {
    setStage('brief');
    setAskedIds([]);
    setTurns([]);
    setPicked(null);
    setSavedNote(false);
  };

  const saveTranscript = () => {
    const body = [
      '## Consultation',
      ...turns.map((turn) => `- **${turn.speaker === 'learner' ? 'Doctor' : 'Patient'}:** ${turn.japanese}`),
      '',
      '## Feedback',
      `Score: ${score}/${maxScore}`,
      ...phrasingNotes.map((note) => `- ${note}`),
    ].join('\n');
    actions.saveNote({
      kind: 'custom',
      title: `Case · ${item.titleJa}`,
      body,
      tags: ['case', item.specialty],
      links: [`case:${item.id}`],
    });
    setSavedNote(true);
  };

  /* ------------------------------- Brief --------------------------------- */
  if (stage === 'brief') {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Clinical case · 症例"
          title={<span lang="ja">{item.titleJa}</span>}
          description={`${item.title} · ${item.specialty} · ${item.setting}`}
          meta={
            <>
              <Badge tone={item.difficulty === 'emergency' ? 'danger' : item.difficulty === 'advanced' ? 'warning' : 'outline'}>
                {item.difficulty}
              </Badge>
              <span>
                {item.patientProfile.age}y {item.patientProfile.sex}
                {item.patientProfile.nationality ? ` · ${item.patientProfile.nationality}` : ''}
              </span>
              <span>{item.questions.length} questions to consider</span>
            </>
          }
          actions={
            <LinkButton href="/cases" size="sm" variant="ghost">
              All cases
            </LinkButton>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section>
              <SectionHeading title="The setting" />
              <dl className="grid gap-3 pt-3 sm:grid-cols-2">
                {item.patientProfile.occupation ? (
                  <div className="border-b border-border/70 pb-2">
                    <dt className="meta-label">Occupation</dt>
                    <dd className="text-[13px] text-foreground">{item.patientProfile.occupation}</dd>
                  </div>
                ) : null}
                {item.patientProfile.background ? (
                  <div className="border-b border-border/70 pb-2">
                    <dt className="meta-label">Background</dt>
                    <dd className="text-[13px] text-foreground">{item.patientProfile.background}</dd>
                  </div>
                ) : null}
                <div className="border-b border-border/70 pb-2">
                  <dt className="meta-label">Chief complaint</dt>
                  <dd lang="ja" className="text-[13.5px] text-foreground">
                    {item.chiefComplaint}
                  </dd>
                </div>
                <div className="border-b border-border/70 pb-2">
                  <dt className="meta-label">Department</dt>
                  <dd className="text-[13px] text-foreground">{item.specialty}</dd>
                </div>
              </dl>
            </section>

            <section>
              <SectionHeading title="The patient speaks" hint="this is your starting point" />
              <div className="mt-2 border-l-2 border-l-primary pl-3">
                <p lang="ja" className="text-[16px] leading-loose text-foreground">{item.openingPhrase}</p>
                <p lang="ja" className="text-[12px] text-muted-foreground">{item.openingPhraseKana}</p>
                <p className="font-mono text-[12px] tracking-wide text-info">{item.openingPhraseRomaji}</p>
                <p className="mt-1 text-[13px] text-foreground"><span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">ID</span>{item.openingPhraseIndonesian}</p>
                <p className="mt-1 text-[10.5px] text-warning">Reading support draft · verify before relying on it</p>
              </div>
            </section>

            <section>
              <SectionHeading title="Choose your next question" hint="multiple choice" />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="primary" size="md" onClick={() => setStage('consult')}>
                  Begin the consultation
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <span className="text-[11.5px] text-muted">
                  The diagnosis is hidden until you finish. {item.voiceNote ? item.voiceNote : ''}
                </span>
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:border-l lg:border-border lg:pl-6">
            <SectionHeading title="How this is scored" />
            <p className="pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
              Each clinically important question carries a weight. Questions that uncover a red flag weigh most. Asking an
              already-covered question costs nothing but does not move the score.
            </p>
            <ul className="space-y-1.5 pt-1 text-[12px] text-muted-foreground">
              <li className="flex items-center gap-2">
                <TriangleAlert className="h-3.5 w-3.5 text-danger" />
                {item.questions.filter((question) => question.redFlag).length} red-flag questions
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-success" />
                {item.questions.length} questions in the model consultation
              </li>
              <li className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-muted" />
                {item.patientLines.length} patient replies scripted
              </li>
            </ul>
          </aside>
        </div>
      </div>
    );
  }

  /* ------------------------------ Results -------------------------------- */
  if (stage === 'results') {
    const percent = maxScore > 0 ? score / maxScore : 0;
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow="Case feedback · 振り返り"
          title={percent >= 0.85 ? 'Complete consultation' : percent >= 0.6 ? 'Safe but incomplete' : 'Important gaps'}
          description={`${item.titleJa} · ${item.hiddenDiagnosis}`}
          meta={
            <>
              <span className="font-mono tabular-nums">
                {score}/{maxScore} weighted points
              </span>
              <span>{Math.round(percent * 100)}%</span>
              <span>
                {askedIds.length} questions asked · {unasked.length} missed
              </span>
              <Badge tone="neutral">{mode}</Badge>
            </>
          }
          actions={
            <>
              <Button variant="secondary" size="sm" onClick={reset}>
                <RotateCcw className="h-3.5 w-3.5" />
                Run again
              </Button>
              <Button variant="ghost" size="sm" onClick={saveTranscript} disabled={!ready || savedNote}>
                {savedNote ? 'Saved to notebook' : 'Save transcript'}
              </Button>
            </>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-6">
            {missedRedFlags.length > 0 ? (
              <section>
                <SectionHeading title="Red flags not uncovered" hint="these are the ones that matter" />
                <ul className="space-y-2 pt-3">
                  {missedRedFlags.map((question) => (
                    <li key={question.id}>
                      <Callout tone="danger" title={question.topic}>
                        <span lang="ja">{question.acceptedPhrases[0]}</span>
                        <span className="mt-1 block text-[12px]">{question.why}</span>
                      </Callout>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <Callout tone="success" title="Every red flag was uncovered">
                You asked the questions that close the dangerous differentials.
              </Callout>
            )}

            <section>
              <SectionHeading title="Question review" hint={`${item.questions.length} in the model consultation`} />
              <ul className="divide-y divide-border pt-1">
                {item.questions.map((question) => {
                  const wasAsked = askedIds.includes(question.id);
                  return (
                    <li key={question.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {wasAsked ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-danger" />}
                            <span className="text-[13.5px] text-foreground">{question.topic}</span>
                            {question.redFlag ? <Badge tone="danger">red flag</Badge> : null}
                            <Badge tone="outline">weight {question.weight}</Badge>
                          </div>
                          <p lang="ja" className="mt-1 text-[14px] leading-relaxed text-foreground">
                            {question.acceptedPhrases[0]}
                          </p>
                          {question.acceptedPhraseReadings[0] ? <p lang="ja" className="text-[11.5px] text-muted-foreground">{question.acceptedPhraseReadings[0].kana}</p> : null}
                          {question.acceptedPhraseReadings[0] ? <p className="font-mono text-[11.5px] text-info">{question.acceptedPhraseReadings[0].romaji}</p> : null}
                          <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{question.why}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <SectionHeading title="Japanese phrasing" hint="how it would have sounded in the room" />
              {phrasingNotes.length === 0 ? (
                <p className="pt-3 text-[12.5px] text-muted">
                  No phrasing problems were detected in what you asked. Polite endings were present and questions stayed short.
                </p>
              ) : (
                <ul className="space-y-2 pt-3">
                  {phrasingNotes.map((note) => (
                    <li key={note} className="text-[12.5px] leading-relaxed text-muted-foreground">
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionHeading title="Examination and investigations" />
              <dl className="space-y-3 pt-3">
                <div className="border-b border-border/70 pb-2">
                  <dt className="meta-label">What you would have found</dt>
                  <dd className="text-[13px] leading-relaxed text-foreground">{item.examinationFindings}</dd>
                </div>
                <div className="border-b border-border/70 pb-2">
                  <dt className="meta-label">Investigations to order</dt>
                  <dd lang="ja" className="text-[13px] leading-relaxed text-foreground">
                    {item.expectedInvestigations.join('、')}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <SectionHeading title="Teaching points" />
              <ol className="space-y-1.5 pt-3">
                {item.teachingPoints.map((point, index) => (
                  <li key={point} className="flex gap-2 text-[13px] leading-relaxed text-muted-foreground">
                    <span className="font-mono text-[11px] text-muted">{index + 1}</span>
                    {point}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
            <section>
              <SectionHeading title="Vocabulary to drill" hint="from this case" />
              {item.drillTerms.length === 0 ? (
                <p className="pt-3 text-[12.5px] text-muted">No specific terms were flagged.</p>
              ) : (
                <ul className="divide-y divide-border pt-1">
                  {item.drillTerms.map((term) => (
                    <li key={term.id} className="flex flex-col gap-1 py-2">
                      <span lang="ja" className="text-[14.5px] text-foreground">
                        {term.japanese}
                      </span>
                      <span className="text-[11.5px] text-muted">{term.english}</span>
                      <AddToReviewButton contentType="medical-term" contentId={term.id} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section>
              <SectionHeading title="Next" />
              <div className="flex flex-wrap gap-2 pt-3">
                <LinkButton href="/cases" size="sm" variant="secondary">
                  Another case
                </LinkButton>
                <LinkButton href="/medical/phrases?stage=hpi" size="sm" variant="ghost">
                  History phrases
                </LinkButton>
                <LinkButton href="/progress" size="sm" variant="ghost">
                  Case progress
                </LinkButton>
              </div>
            </section>
          </aside>
        </div>
      </div>
    );
  }

  /* ----------------------------- Consultation ----------------------------- */
  const mcOptions = (() => {
    const remaining = [...unasked];
    const alreadyAsked = [...asked].slice(-2);
    const pool = [...remaining.slice(0, 4), ...alreadyAsked.slice(0, 1)];
    return pool.sort((a, b) => b.weight - a.weight).slice(0, 4);
  })();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Consultation in progress"
        title={<span lang="ja">{item.titleJa}</span>}
        meta={
          <>
            <Badge tone="neutral">{mode}</Badge>
            <span>
              {askedIds.length}/{item.questions.length} questions asked
            </span>
            <span className="font-mono tabular-nums">
              {score}/{maxScore}
            </span>
            {missedRedFlags.length > 0 ? <Badge tone="warning">{missedRedFlags.length} red flags still open</Badge> : null}
          </>
        }
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Restart
            </Button>
            <Button variant="primary" size="sm" onClick={finish}>
              End consultation
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Transcript */}
        <div className="min-w-0 space-y-3">
          <div
            ref={transcriptRef}
            className="max-h-[52vh] space-y-3 overflow-y-auto rounded-lg border border-border bg-surface p-3.5 scroll-thin"
          >
            <div className="border-l-2 border-l-primary pl-3">
              <div className="meta-label">Patient · opening</div>
              <p lang="ja" className="text-[15.5px] leading-relaxed text-foreground">{item.openingPhrase}</p>
              <p lang="ja" className="text-[12px] text-muted-foreground">{item.openingPhraseKana}</p>
              <p className="font-mono text-[11.5px] text-info">{item.openingPhraseRomaji}</p>
              <p className="text-[12px] text-foreground"><span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">ID</span>{item.openingPhraseIndonesian}</p>
            </div>
            {turns.length === 0 ? (
              <p className="text-[12.5px] text-muted">Pick the question you would ask next.</p>
            ) : null}
            {turns.map((turn, index) => (
              <div
                key={`${turn.speaker}-${index}`}
                className={turn.speaker === 'learner' ? 'border-l-2 border-l-border-strong pl-3' : 'border-l-2 border-l-info pl-3'}
              >
                <div className="meta-label">{turn.speaker === 'learner' ? 'You · 医師' : 'Patient · 患者'}</div>
                <p lang="ja" className="text-[15px] leading-relaxed text-foreground">
                  {turn.japanese}
                </p>
                {turn.kana ? <p lang="ja" className="text-[11.5px] text-muted-foreground">{turn.kana}</p> : null}
                {turn.romaji ? <p className="font-mono text-[11.5px] text-info">{turn.romaji}</p> : null}
                {turn.indonesian ? <p className="text-[12px] text-foreground"><span className="mr-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">ID</span>{turn.indonesian}</p> : null}
                {turn.english ? <p className="text-[12px] text-muted-foreground">{turn.english}</p> : null}
                {turn.note ? <p className="text-[11.5px] text-warning">{turn.note}</p> : null}
              </div>
            ))}
          </div>

          {/* Input */}
          {mode === 'multiple-choice' ? (
            <div className="space-y-2">
              <div className="meta-label">Which question do you ask next?</div>
              <ul className="space-y-1.5">
                {mcOptions.map((question) => {
                  const wasAsked = askedIds.includes(question.id);
                  return (
                    <li key={question.id}>
                      <button
                        type="button"
                        disabled={wasAsked}
                        onClick={() => pickMultipleChoice(question)}
                        className={cn(
                          'w-full rounded-md border px-3 py-2 text-left transition-colors',
                          wasAsked
                            ? 'border-border text-muted'
                            : picked === question.id
                              ? 'border-primary bg-primary-muted/50'
                              : 'border-border hover:bg-surface-secondary',
                        )}
                      >
                        <span lang="ja" className="block text-[14.5px] text-foreground">{question.acceptedPhrases[0]}</span>
                        {question.acceptedPhraseReadings[0] ? <span lang="ja" className="mt-0.5 block text-[11.5px] text-muted-foreground">{question.acceptedPhraseReadings[0].kana}</span> : null}
                        {question.acceptedPhraseReadings[0] ? <span className="mt-0.5 block font-mono text-[11.5px] text-info">{question.acceptedPhraseReadings[0].romaji}</span> : null}
                        <span className="mt-0.5 block text-[11.5px] text-muted">
                          {question.topic}
                          {question.redFlag ? ' · red flag' : ''}
                          {wasAsked ? ' · already covered' : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>

        {/* Side panel */}
        <aside className="space-y-4 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Progress" />
            <div className="space-y-2 pt-3 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Questions asked</span>
                <span className="font-mono tabular-nums text-foreground">
                  {askedIds.length}/{item.questions.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Weighted score</span>
                <span className="font-mono tabular-nums text-foreground">
                  {score}/{maxScore}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Red flags open</span>
                <span className={cn('font-mono tabular-nums', missedRedFlags.length > 0 ? 'text-danger' : 'text-success')}>
                  {missedRedFlags.length}
                </span>
              </div>
            </div>
          </section>

          <section>
            <SectionHeading title="Chief complaint" />
            <p lang="ja" className="pt-3 text-[14px] leading-relaxed text-foreground">
              {item.chiefComplaint}
            </p>
            <p className="mt-1 text-[11.5px] text-muted">{item.setting}</p>
          </section>

          {state.caseAttempts.filter((attempt) => attempt.caseId === item.id).length > 0 ? (
            <section>
              <SectionHeading title="Previous attempts" />
              <ul className="space-y-1 pt-2 text-[12px] text-muted-foreground">
                {state.caseAttempts
                  .filter((attempt) => attempt.caseId === item.id)
                  .slice(-3)
                  .reverse()
                  .map((attempt) => (
                    <li key={attempt.id} className="flex items-center justify-between gap-2">
                      <span className="font-mono tabular-nums">
                        {attempt.score}/{attempt.maxScore}
                      </span>
                    </li>
                  ))}
              </ul>
            </section>
          ) : null}

          {askedIds.length === item.questions.length ? (
            <EmptyState
              compact
              title="All questions covered"
              description="End the consultation to see the diagnosis and the feedback, or keep exploring the case."
            />
          ) : null}
        </aside>
      </div>
    </div>
  );
}
