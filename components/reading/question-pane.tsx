'use client';

import Link from 'next/link';
import { Check, CircleAlert, X } from 'lucide-react';
import { MISTAKE_LABELS, SKILL_LABELS } from '@/lib/content/taxonomy';
import { cn } from '@/lib/utils/cn';
import { Badge, SectionHeading } from '@/components/ui/primitives';

/* ------------------------------------------------------------------
   Questions and result analysis.

   A wrong answer is not answered with the right one alone: the evidence
   sentence, the paragraph it sits in, why each distractor fails, the
   paraphrase the question expected, and the skill being tested are all
   shown. This is the part of the app that is supposed to raise scores.
------------------------------------------------------------------ */

export type QuestionView = {
  id: string;
  prompt: string;
  options: { text: string; why: string; trap?: string }[];
  correctIndex: number;
  explanation: string;
  skill: string;
  evidenceParagraph: number;
  evidenceSentence: string;
  howEvidenceWorks: string;
  paraphrase?: string;
  grammarRefs: { id: string; pattern: string; meaning: string }[];
  vocabRefs: { id: string; japanese: string; kana?: string; meaningsEn: string[] }[];
};

export function QuestionPane({
  questions,
  answers,
  submitted,
  onAnswer,
  active,
  onFocus,
}: {
  questions: QuestionView[];
  answers: Record<string, number>;
  submitted: boolean;
  onAnswer: (questionId: string, optionIndex: number) => void;
  active?: number;
  onFocus?: (index: number) => void;
}) {
  return (
    <ol className="divide-y divide-border">
      {questions.map((question, index) => {
        const chosen = answers[question.id];
        const answered = chosen !== undefined;
        const isCorrect = answered && chosen === question.correctIndex;
        return (
          <li key={question.id} className="py-3.5" onMouseEnter={() => onFocus?.(index)}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-[13.5px] leading-relaxed text-foreground">
                <span className="mr-1.5 font-mono text-[11.5px] text-muted">Q{index + 1}</span>
                {question.prompt}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <Badge tone="neutral">{SKILL_LABELS[question.skill as keyof typeof SKILL_LABELS]?.en ?? question.skill}</Badge>
                {submitted ? (
                  isCorrect ? (
                    <Badge tone="success">
                      <Check className="mr-0.5 h-3 w-3" />
                      correct
                    </Badge>
                  ) : (
                    <Badge tone="danger">
                      <X className="mr-0.5 h-3 w-3" />
                      wrong
                    </Badge>
                  )
                ) : answered ? (
                  <Badge tone="outline">answered</Badge>
                ) : null}
              </div>
            </div>

            <ul className="mt-2 space-y-1">
              {question.options.map((option, optionIndex) => {
                const isChosen = chosen === optionIndex;
                const isRight = optionIndex === question.correctIndex;
                return (
                  <li key={option.text}>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => onAnswer(question.id, optionIndex)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-md border px-2.5 py-1.5 text-left text-[13px] transition-colors',
                        submitted
                          ? isRight
                            ? 'border-success/40 bg-success-muted text-success'
                            : isChosen
                              ? 'border-danger/40 bg-danger-muted text-danger'
                              : 'border-border text-muted-foreground'
                          : isChosen
                            ? 'border-primary bg-primary-muted text-foreground'
                            : 'border-border text-foreground hover:bg-surface-secondary',
                      )}
                    >
                      <span className="mt-px w-4 shrink-0 font-mono text-[11px] text-muted">
                        {String.fromCharCode(97 + optionIndex)}
                      </span>
                      <span lang="ja" className="min-w-0 flex-1 leading-relaxed">
                        {option.text}
                      </span>
                      {submitted ? (
                        <span className="mt-px shrink-0">
                          {isRight ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : isChosen ? (
                            <X className="h-3.5 w-3.5" />
                          ) : null}
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>

            {submitted ? (
              <div className="mt-3 space-y-2.5 border-l-2 border-l-border-strong pl-3 animate-fade">
                <div>
                  <div className="meta-label">Evidence · paragraph {question.evidenceParagraph + 1}</div>
                  <p lang="ja" className="mt-0.5 text-[14px] leading-relaxed text-foreground">
                    {question.evidenceSentence}
                  </p>
                </div>

                <div>
                  <div className="meta-label">Why the correct answer works</div>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">{question.howEvidenceWorks}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{question.explanation}</p>
                </div>

                {question.paraphrase ? (
                  <div>
                    <div className="meta-label">Paraphrase used</div>
                    <p lang="ja" className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      {question.paraphrase}
                    </p>
                  </div>
                ) : null}

                <div>
                  <div className="meta-label">Why the others fail</div>
                  <ul className="mt-1 space-y-1.5">
                    {question.options.map((option, optionIndex) =>
                      optionIndex === question.correctIndex ? null : (
                        <li key={option.text} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
                          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                          <span>
                            <span lang="ja" className="text-foreground">
                              {option.text}
                            </span>
                            <span className="mx-1 text-muted">—</span>
                            {option.why}
                            {option.trap ? (
                              <span className="ml-1 text-muted">
                                ({MISTAKE_LABELS[option.trap as keyof typeof MISTAKE_LABELS]?.en ?? option.trap})
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ),
                    )}
                  </ul>
                </div>

                {question.grammarRefs.length > 0 || question.vocabRefs.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {question.grammarRefs.map((entry) => (
                      <Link key={entry.id} href={`/grammar/${entry.id}`}>
                        <Badge className="hover:border-primary hover:text-primary" lang="ja">
                          {entry.pattern}
                        </Badge>
                      </Link>
                    ))}
                    {question.vocabRefs.map((word) => (
                      <Link key={word.id} href={`/vocabulary/${encodeURIComponent(word.id)}`}>
                        <Badge className="hover:border-primary hover:text-primary" lang="ja">
                          {word.japanese}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
      {!submitted ? (
        <li className="pt-3">
          <SectionHeading title="Read before answering" />
          <p className="pt-2 text-[12px] leading-relaxed text-muted">
            Every question can be traced to one sentence. If two answers look plausible, find the sentence that makes one of them
            impossible before choosing.
          </p>
        </li>
      ) : null}
    </ol>
  );
}
