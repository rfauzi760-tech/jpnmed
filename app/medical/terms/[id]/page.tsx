import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { DISEASES, MEDICAL_TERMS, getTerm, phrasesForTerm, relatedForTerm } from '@/lib/content';
import { SPECIALTIES, categoryLabel, stageLabel } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import {
  Badge,
  Divider,
  FactGrid,
  LinkButton,
  PageHeader,
  SafetyNote,
  SectionHeading,
  VerificationBadge,
} from '@/components/ui/primitives';
import { RegisterBlock } from '@/components/japanese';
import { RegisterDisplay } from '@/components/medical/register-display';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';
import { CopyButton } from '@/components/ui/interactive';
import { makeReviewKey } from '@/lib/store/types';

export function generateStaticParams() {
  return MEDICAL_TERMS.map((term) => ({ id: term.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) return { title: 'Medical terminology' };
  return { title: `${term.japanese} — ${term.english}`, description: term.patientFriendly ?? term.definitionJa };
}

export default async function MedicalTermPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const term = getTerm(id);
  if (!term) notFound();

  const peers = MEDICAL_TERMS.filter((item) => item.category === term.category);
  const index = peers.findIndex((item) => item.id === term.id);
  const previous = peers[index - 1];
  const next = peers[index + 1];

  const related = relatedForTerm(term);
  const phrases = phrasesForTerm(term).slice(0, 12);
  const relatedDiseases = DISEASES.filter(
    (disease) =>
      disease.relatedTerms.includes(term.japanese) ||
      disease.keySymptoms.includes(term.japanese) ||
      disease.investigations.includes(term.japanese) ||
      (term.alternativeNames.length > 0 && term.alternativeNames.some((name) => disease.relatedTerms.includes(name))),
  );

  return (
    <PageBody>
      <div className="mb-4 flex items-center justify-between gap-3 text-[11.5px] text-muted">
        <Link href="/medical/terms" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Dictionary · {categoryLabel(term.category)}
        </Link>
        <div className="flex items-center gap-3">
          {previous ? (
            <Link href={`/medical/terms/${encodeURIComponent(previous.id)}`} lang="ja" className="hover:text-foreground">
              {previous.japanese}
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/medical/terms/${encodeURIComponent(next.id)}`}
              lang="ja"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              {next.japanese}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <PageHeader
        eyebrow={`Medical term · ${categoryLabel(term.category)}`}
        title={<span lang="ja">{term.japanese}</span>}
        description={`${term.indonesian} · ${term.english}`}
        meta={
          <>
            {term.kana ? (
              <span lang="ja" className="text-muted-foreground">
                {term.kana}
              </span>
            ) : null}
            <span className="text-info">{term.romaji}</span>
            {term.specialties.map((specialty) => (
              <Badge key={specialty} tone="neutral">
                {SPECIALTIES.find((item) => item.id === specialty)?.label.en ?? specialty}
              </Badge>
            ))}
            <VerificationBadge status={term.verificationStatus} />
            <ReviewStateLine contentType="medical-term" contentId={term.id} />
          </>
        }
        actions={
          <>
            <AddToReviewButton contentType="medical-term" contentId={term.id} size="md" />
            <NoteButton contentType="medical-term" contentId={term.id} defaultTitle={term.japanese} />
            <BookmarkButton contentKey={makeReviewKey('medical-term', term.id)} />
          </>
        }
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-7">
          <section>
            <SectionHeading title="Registers" hint="do not substitute one for another" />
            <div className="pt-3">
              <RegisterDisplay
                japanese={term.japanese}
                kana={term.kana}
                romaji={term.romaji}
                patientFriendly={term.patientFriendly}
                patientExpression={term.patientExpression}
              />
            </div>
            {!term.patientFriendly && !term.patientExpression ? (
              <p className="mt-3 text-[12px] leading-relaxed text-muted">
                No patient-facing wording has been recorded for this term yet. That is a content gap, not a claim that the technical
                form is appropriate to use with a patient.
              </p>
            ) : null}
          </section>

          {term.definitionJa ? (
            <section>
              <SectionHeading title="Definition in Japanese" />
              <p lang="ja" className="pt-2 text-[15px] leading-loose text-foreground">
                {term.definitionJa}
              </p>
            </section>
          ) : null}

          <section>
            <SectionHeading title="Summary" />
            <div className="pt-3">
              <FactGrid
                items={[
                  { label: 'English', value: term.english },
                  { label: 'Indonesian', value: term.indonesian },
                  { label: 'Japanese', value: <span lang="ja">{term.japanese}</span> },
                  { label: 'Reading', value: <span lang="ja">{term.kana ?? '—'}</span> },
                  { label: 'Category', value: categoryLabel(term.category) },
                  {
                    label: 'Also called',
                    value: term.alternativeNames.length ? <span lang="ja">{term.alternativeNames.join('、')}</span> : '—',
                  },
                ]}
              />
            </div>
          </section>

          {phrases.length > 0 ? (
            <section>
              <SectionHeading
                title="Phrases that use it"
                hint={`${phrases.length} shown`}
                action={
                  <Link href="/medical/phrases" className="text-[12px] text-primary hover:underline">
                    Phrasebook
                  </Link>
                }
              />
              <ul className="divide-y divide-border pt-1">
                {phrases.map((phrase) => (
                  <li key={phrase.id} className="flex items-start gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span lang="ja" className="block text-[14.5px] leading-relaxed text-foreground">
                        {phrase.japanese}
                      </span>
                      <span className="block text-[12px] text-muted-foreground">{phrase.english}</span>
                      <span className="mt-0.5 block text-[10.5px] text-muted">
                        {stageLabel(phrase.stage)} · {phrase.register}
                      </span>
                    </span>
                    <CopyButton text={phrase.japanese} />
                    <AddToReviewButton contentType="clinical-phrase" contentId={phrase.id} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {relatedDiseases.length > 0 ? (
            <section>
              <SectionHeading title="Appears in these diseases" />
              <ul className="divide-y divide-border pt-1">
                {relatedDiseases.map((disease) => (
                  <li key={disease.id}>
                    <Link
                      href={`/medical/diseases/${encodeURIComponent(disease.id)}`}
                      className="group flex items-baseline justify-between gap-4 py-2"
                    >
                      <span className="min-w-0">
                        <span lang="ja" className="text-[14.5px] text-foreground group-hover:text-primary">
                          {disease.japanese}
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{disease.english}</span>
                      </span>
                      <Badge tone={disease.severity === 'emergency' ? 'danger' : disease.severity === 'urgent' ? 'warning' : 'outline'}>
                        {disease.severity}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Related terms" />
            {related.length === 0 ? (
              <p className="pt-3 text-[12.5px] text-muted">No related terminology recorded.</p>
            ) : (
              <ul className="pt-2">
                {related.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/medical/terms/${encodeURIComponent(item.id)}`}
                      className="group flex items-baseline justify-between gap-3 py-1.5 text-[13px] hover:text-primary"
                    >
                      <span lang="ja" className="min-w-0 truncate">
                        {item.japanese}
                      </span>
                      <span className="shrink-0 text-[10.5px] text-muted">{item.english}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {term.tags.length > 0 ? (
            <section>
              <SectionHeading title="Tags" />
              <div className="flex flex-wrap gap-1.5 pt-3">
                {term.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionHeading title="Say it" />
            <div className="space-y-3 pt-3">
              <RegisterBlock label="Medical term" text={term.japanese} tone="primary" />
              {term.patientFriendly ? <RegisterBlock label="Patient-friendly" text={term.patientFriendly} tone="info" /> : null}
              <div className="flex gap-2">
                <CopyButton text={term.japanese} label="Copy term" />
                {term.patientFriendly ? <CopyButton text={term.patientFriendly} label="Copy explanation" /> : null}
              </div>
            </div>
          </section>

          <Divider />

          <section>
            <SectionHeading title="Source" />
            <p className="pt-3 text-[12px] leading-relaxed text-muted">
              {term.source?.title ?? 'Curated for this curriculum.'} {term.source?.url ? <span className="block break-all">{term.source.url}</span> : null}
            </p>
            {term.notes ? <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{term.notes}</p> : null}
          </section>

          <section>
            <LinkButton href="/medical/quick" size="sm" variant="secondary">
              Quick clinical mode
            </LinkButton>
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
