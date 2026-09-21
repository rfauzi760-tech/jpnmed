import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PHRASES, SYMPTOMS, getSymptom, resolveTermRefs } from '@/lib/content';
import type { Symptom } from '@/lib/content';
import { categoryLabel, stageLabel } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import {
  Badge,
  Callout,
  Divider,
  PageHeader,
  SafetyNote,
  SectionHeading,
  VerificationBadge,
} from '@/components/ui/primitives';
import { CopyButton } from '@/components/ui/interactive';
import { RegisterBlock } from '@/components/japanese';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';
import { makeReviewKey } from '@/lib/store/types';

export function generateStaticParams() {
  return SYMPTOMS.map((symptom) => ({ id: symptom.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const symptom = getSymptom(id);
  if (!symptom) return { title: 'Symptoms' };
  return {
    title: `${symptom.japanese} — ${symptom.english}`,
    description: symptom.patientFriendlyExplanation ?? symptom.patientExpressions[0],
  };
}

function ExchangeList({ exchanges }: { exchanges: Symptom['exchanges'] }) {
  if (exchanges.length === 0) return null;
  return (
    <section>
      <SectionHeading title="Patient says → you respond" hint="paired drills for the consultation" />
      <div className="mt-3 space-y-3">
        {exchanges.map((exchange, index) => (
          <div key={index} className="border-l-2 border-l-border-strong pl-4">
            <div className="flex items-start gap-3">
              <span className="meta-label w-14 shrink-0 pt-1 text-danger">Patient</span>
              <span lang="ja" className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-foreground">
                {exchange.patient}
              </span>
              <CopyButton text={exchange.patient} />
            </div>
            <div className="mt-2 flex items-start gap-3">
              <span className="meta-label w-14 shrink-0 pt-1 text-primary">You</span>
              <span className="min-w-0 flex-1">
                <span lang="ja" className="block text-[14.5px] leading-relaxed text-foreground">
                  {exchange.doctor}
                </span>
                {exchange.doctorEn ? (
                  <span className="mt-0.5 block text-[11.5px] text-muted-foreground">{exchange.doctorEn}</span>
                ) : null}
              </span>
              <CopyButton text={exchange.doctor} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PhraseList({ title, items, hint }: { title: string; items: string[]; hint?: string }) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} hint={hint} />
      <ul className="divide-y divide-border pt-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 py-2">
            <span lang="ja" className="min-w-0 flex-1 text-[14.5px] leading-relaxed text-foreground">
              {item}
            </span>
            <CopyButton text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function SymptomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const symptom = getSymptom(id);
  if (!symptom) notFound();

  const relatedTerms = resolveTermRefs(symptom.relatedTermIds);
  const relatedSymptoms = SYMPTOMS.filter((item) => symptom.relatedSymptomIds.includes(item.id));
  const relatedPhrases = PHRASES.filter(
    (phrase) =>
      phrase.japanese.includes(symptom.japanese) ||
      symptom.patientExpressions.some((expression) => phrase.japanese.includes(expression)) ||
      (symptom.termId ? phrase.relatedTermIds.includes(symptom.termId) : false),
  ).slice(0, 10);

  return (
    <PageBody>
      <div className="mb-4">
        <Link href="/medical/symptoms" className="inline-flex items-center gap-1 text-[11.5px] text-muted hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          All symptoms
        </Link>
      </div>

      <PageHeader
        eyebrow="Symptom · 症状"
        title={<span lang="ja">{symptom.japanese}</span>}
        description={`${symptom.english} · ${symptom.indonesian}`}
        meta={
          <>
            <span lang="ja" className="text-muted-foreground">
              {symptom.kana}
            </span>
            <Badge tone="neutral">{symptom.doctorQuestions.length} questions</Badge>
            {symptom.redFlags.length > 0 ? <Badge tone="danger">{symptom.redFlags.length} red flags</Badge> : null}
            <VerificationBadge status={symptom.verificationStatus} />
            <ReviewStateLine contentType="symptom" contentId={symptom.id} />
          </>
        }
        actions={
          <>
            <AddToReviewButton contentType="symptom" contentId={symptom.id} size="md" />
            <NoteButton contentType="symptom" contentId={symptom.id} defaultTitle={symptom.japanese} />
            <BookmarkButton contentKey={makeReviewKey('symptom', symptom.id)} />
          </>
        }
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-7">
          {symptom.patientFriendlyExplanation ? (
            <section>
              <SectionHeading title="Explain it to the patient" hint="register B" />
              <div className="pt-3">
                <RegisterBlock
                  label="Patient-friendly · やさしい表現"
                  text={symptom.patientFriendlyExplanation}
                  tone="info"
                />
              </div>
            </section>
          ) : null}

          <ExchangeList exchanges={symptom.exchanges} />

          <PhraseList
            title="How the patient says it"
            hint="register C — this is what you must be able to parse"
            items={symptom.patientExpressions}
          />

          <PhraseList title="Questions to ask" hint="in the order a Japanese consultation tends to run" items={symptom.doctorQuestions} />

          <div className="grid gap-6 sm:grid-cols-2">
            <PhraseList title="Descriptors" hint="character of the symptom" items={symptom.descriptors} />
            <PhraseList title="Severity" items={symptom.severityPhrases} />
            <PhraseList title="Timing" items={symptom.timingPhrases} />
            <PhraseList title="Associated questions" items={symptom.associatedQuestions} />
          </div>

          {symptom.redFlags.length > 0 ? (
            <section>
              <SectionHeading title="Red flags" hint="never leave the room without these" />
              <div className="space-y-2 pt-3">
                {symptom.redFlags.map((flag) => (
                  <Callout key={flag} tone="danger">
                    <span lang="ja">{flag}</span>
                  </Callout>
                ))}
              </div>
            </section>
          ) : null}

          {relatedPhrases.length > 0 ? (
            <section>
              <SectionHeading title="Phrases that cover this symptom" />
              <ul className="divide-y divide-border pt-1">
                {relatedPhrases.map((phrase) => (
                  <li key={phrase.id} className="flex items-start gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span lang="ja" className="block text-[14px] leading-relaxed text-foreground">
                        {phrase.japanese}
                      </span>
                      <span className="block text-[11.5px] text-muted-foreground">{phrase.english}</span>
                      <span className="mt-0.5 block text-[10.5px] text-muted">{stageLabel(phrase.stage)}</span>
                    </span>
                    <CopyButton text={phrase.japanese} />
                    <AddToReviewButton contentType="clinical-phrase" contentId={phrase.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Related terminology" />
            {relatedTerms.length === 0 ? (
              <p className="pt-3 text-[12.5px] text-muted">No related terms recorded.</p>
            ) : (
              <ul className="pt-2">
                {relatedTerms.map((term) => (
                  <li key={term.id}>
                    <Link
                      href={`/medical/terms/${encodeURIComponent(term.id)}`}
                      className="group flex items-baseline justify-between gap-3 py-1.5"
                    >
                      <span lang="ja" className="min-w-0 truncate text-[13.5px] group-hover:text-primary">
                        {term.japanese}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-muted">{categoryLabel(term.category)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {relatedSymptoms.length > 0 ? (
            <section>
              <SectionHeading title="Symptoms that travel with it" />
              <ul className="pt-2">
                {relatedSymptoms.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/medical/symptoms/${encodeURIComponent(item.id)}`}
                      className="flex items-baseline justify-between gap-3 py-1.5 text-[13.5px] hover:text-primary"
                    >
                      <span lang="ja" className="min-w-0 truncate">
                        {item.japanese}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-muted">{item.english}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Divider />

          <section>
            <SectionHeading title="Practise this" />
            <p className="pt-3 text-[12px] leading-relaxed text-muted-foreground">
              Ask the questions aloud once, then run the clinical case that presents with this symptom.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href="/cases"
                className="inline-flex h-7 items-center rounded-md border border-border px-2.5 text-xs text-foreground hover:bg-surface-secondary"
              >
                Clinical cases
              </Link>
              <Link
                href="/medical/quick"
                className="inline-flex h-7 items-center rounded-md px-2.5 text-xs text-muted-foreground hover:text-foreground"
              >
                Quick mode
              </Link>
            </div>
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
