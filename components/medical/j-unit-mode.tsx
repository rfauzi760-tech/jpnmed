'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Stethoscope } from 'lucide-react';
import { phrasesForJUnitStage, JUNIT_STAGES, type JUnitStageId } from '@/lib/content/junit';
import { useStudy } from '@/lib/store/provider';
import { AddToReviewButton } from '@/components/study/review-controls';
import { Badge, Button, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/utils/cn';

function Line({ phrase }: { phrase: ReturnType<typeof phrasesForJUnitStage>[number] }) {
  const { state } = useStudy();
  const display = state.settings.medicalDisplay;
  const showKana = display.furigana === 'always' || (display.furigana === 'difficult' && /[\u3400-\u9fff]/.test(phrase.japanese));
  const showRomaji = display.romaji === 'always';
  return (
    <article className="group rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted">{phrase.intent} · {phrase.speaker}</div>
          <p lang="ja" className="mt-2 text-[20px] leading-relaxed text-foreground">{phrase.japanese}</p>
          {showKana ? <p lang="ja" className="mt-1 text-[13px] text-muted">{phrase.kana}</p> : null}
          {showRomaji ? <p className="mt-1 text-[13px] text-info">{phrase.romaji}</p> : display.romaji === 'hover' ? <p className="mt-1 text-[13px] text-info opacity-0 transition-opacity group-hover:opacity-100">{phrase.romaji}</p> : null}
        </div>
        <AddToReviewButton contentType="clinical-phrase" contentId={phrase.id} />
      </div>
      {display.indonesian ? <p className="mt-3 border-t border-border pt-3 text-[14px] leading-relaxed text-foreground">{phrase.indonesian}</p> : null}
      {display.english ? <p className="mt-1 text-[12px] leading-relaxed text-muted">{phrase.english}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="outline">{phrase.register}</Badge>
        {phrase.specialtyTags.slice(0, 3).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
        {phrase.verificationStatus === 'draft' ? <Badge tone="warning">unverified</Badge> : <Badge tone="success">{phrase.verificationStatus}</Badge>}
      </div>
    </article>
  );
}

export function JUnitMode() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const stage = JUNIT_STAGES[index];
  const phrases = useMemo(() => phrasesForJUnitStage(stage[0]), [stage]);
  const markDone = () => setDone((current) => new Set(current).add(stage[0]));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="J-Unit Mode · 実戦モード" title="One consultation, one screen at a time" description="Ready-to-say Japanese for a rapid bedside encounter. Bahasa Indonesia is the primary explanation layer." meta={<><span>{index + 1} / {JUNIT_STAGES.length} stages</span><span>{done.size} completed</span></>} actions={<BookOpen className="h-5 w-5 text-primary" />} />
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {JUNIT_STAGES.map(([id, label], position) => <button key={id} type="button" onClick={() => setIndex(position)} className={cn('shrink-0 rounded-md border px-2.5 py-2 text-left text-[11px]', position === index ? 'border-primary bg-primary-muted text-primary' : 'border-border text-muted hover:text-foreground')}><span className="block">{position + 1}. {label}</span>{done.has(id) ? <span className="mt-0.5 flex items-center gap-1 text-[10px] text-success"><Check className="h-3 w-3" />done</span> : null}</button>)}
      </div>
      <section className="rounded-xl border border-border bg-surface-secondary/40 p-4 sm:p-5">
        <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /><div><div className="text-[12px] text-muted">Stage {index + 1}</div><h2 className="text-xl tracking-tight text-foreground">{stage[1]} <span lang="ja" className="text-muted">{stage[2]}</span></h2></div></div>
        <div className="mt-4 space-y-3">{phrases.length > 0 ? phrases.map((phrase) => <Line key={phrase.id} phrase={phrase} />) : <p className="text-sm text-muted">Phrase coverage is being expanded for this stage.</p>}</div>
      </section>
      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" size="sm" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft className="h-3.5 w-3.5" />Previous</Button>
        <Button variant="primary" size="sm" onClick={() => { markDone(); setIndex((value) => Math.min(JUNIT_STAGES.length - 1, value + 1)); }}>{index === JUNIT_STAGES.length - 1 ? 'Finish stage' : 'Mark ready & next'}<ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
