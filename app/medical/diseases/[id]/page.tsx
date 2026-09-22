import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { DISEASES, getDisease, relatedForDisease, resolveTermRefs } from '@/lib/content';
import { diseaseExaminationLines, diseaseExplanationLine, diseaseHistoryLines, diseaseInvestigationLines, diseaseTreatmentLines } from '@/lib/content/disease-language';
import { specialtyLabel } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import {
  Badge,
  Callout,
  Divider,
  FactGrid,
  LinkButton,
  PageHeader,
  SafetyNote,
  SectionHeading,
  VerificationBadge,
} from '@/components/ui/primitives';
import { CopyButton } from '@/components/ui/interactive';
import { RegisterBlock } from '@/components/japanese';
import { MedicalLine } from '@/components/medical/medical-line';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';
import { makeReviewKey } from '@/lib/store/types';

export function generateStaticParams() {
  return DISEASES.map((disease) => ({ id: disease.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const disease = getDisease(id);
  if (!disease) return { title: 'Diseases' };
  return { title: `${disease.japanese} — ${disease.english}`, description: disease.patientExplanation };
}

const SEVERITY_TONE = { routine: 'outline', urgent: 'warning', emergency: 'danger' } as const;

const SECTIONS = [
  { id: 'explain', label: 'Explaining it' },
  { id: 'history', label: 'History' },
  { id: 'examination', label: 'Examination' },
  { id: 'investigations', label: 'Investigations' },
  { id: 'treatment', label: 'Treatment' },
  { id: 'safety', label: 'Safety-netting' },
  { id: 'dialogue', label: 'Dialogue' },
];

function PhraseList({
  title,
  items,
  hint,
  tone,
}: {
  title: string;
  items: string[];
  hint?: string;
  tone?: 'danger';
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} hint={hint} />
      <ul className="divide-y divide-border pt-1">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3 py-2">
            <span lang="ja" className={tone === 'danger' ? 'min-w-0 flex-1 text-[14.5px] leading-relaxed text-danger' : 'min-w-0 flex-1 text-[14.5px] leading-relaxed text-foreground'}>
              {item}
            </span>
            <CopyButton text={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClinicalLineList({
  title,
  lines,
  hint,
}: {
  title: string;
  lines: import('@/lib/content/schema').ClinicalLine[];
  hint?: string;
}) {
  if (lines.length === 0) return null;
  return (
    <section>
      <SectionHeading title={title} hint={hint} />
      <div className="grid gap-3 pt-2">
        {lines.map((line, index) => <MedicalLine key={`${line.japanese}-${index}`} label="Japanese clinical line" line={line} />)}
      </div>
    </section>
  );
}

export default async function DiseasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const disease = getDisease(id);
  if (!disease) notFound();

  const related = relatedForDisease(disease);
  const relatedTerms = resolveTermRefs(disease.relatedTerms);
  const relatedDiseases = DISEASES.filter((item) => disease.relatedDiseases.includes(item.japanese) || disease.relatedDiseases.includes(item.english));
  const explanationLine = diseaseExplanationLine(disease);
  const historyLines = diseaseHistoryLines(disease);
  const examinationLines = diseaseExaminationLines(disease);
  const investigationLines = diseaseInvestigationLines(disease);
  const treatmentLines = diseaseTreatmentLines(disease);

  return (
    <PageBody>
      <div className="mb-4 flex items-center justify-between gap-3 text-[11.5px] text-muted">
        <Link href="/medical/diseases" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          All conditions
        </Link>
        <Link href="/medical/quick" className="hover:text-foreground">
          Quick clinical mode
        </Link>
      </div>

      <PageHeader
        eyebrow={`Disease · ${specialtyLabel(disease.specialties[0])}`}
        title={<span lang="ja">{disease.japanese}</span>}
        description={`${disease.indonesian} · ${disease.english}`}
        meta={
          <>
            <span lang="ja" className="text-muted-foreground">
              {disease.kana}
            </span>
            <span className="text-info">{disease.romaji}</span>
            <Badge tone={SEVERITY_TONE[disease.severity]}>{disease.severity}</Badge>
            {disease.specialties.map((specialty) => (
              <Badge key={specialty} tone="neutral">
                {specialtyLabel(specialty)}
              </Badge>
            ))}
            {disease.layJapanese ? (
              <span lang="ja" className="text-muted">
                patients may say {disease.layJapanese}
              </span>
            ) : null}
            <VerificationBadge status={disease.verificationStatus} />
            <ReviewStateLine contentType="disease" contentId={disease.id} />
          </>
        }
        actions={
          <>
            <AddToReviewButton contentType="disease" contentId={disease.id} size="md" />
            <NoteButton contentType="disease" contentId={disease.id} defaultTitle={disease.japanese} />
            <BookmarkButton contentKey={makeReviewKey('disease', disease.id)} />
          </>
        }
      />

      {/* Section navigation */}
      <nav className="sticky top-12 z-20 -mx-4 mt-3 overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur sm:-mx-6 sm:px-6">
        <ul className="flex items-center gap-4 py-2 text-[12px]">
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="whitespace-nowrap text-muted-foreground hover:text-foreground">
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-7">
          <section id="explain" className="scroll-mt-24">
            <SectionHeading title="Patient-friendly explanation" hint="say this, not the term" />
            <div className="space-y-3 pt-3">
              <MedicalLine label="How to explain it · やさしい説明" line={explanationLine} />
              <RegisterBlock label="Clinical detail · 医療者向け" text={disease.patientExplanation} tone="neutral" />
              {disease.causeExplanation ? (
                <RegisterBlock label="Why it happens · 原因" text={disease.causeExplanation} tone="neutral" />
              ) : null}
              <div className="flex gap-2">
                <CopyButton text={disease.patientExplanation} label="Copy explanation" />
              </div>
            </div>
            <div className="mt-4">
              <FactGrid
                items={[
                  { label: 'Key symptoms', value: <span lang="ja">{disease.keySymptoms.join('、')}</span> },
                  { label: 'Specialty', value: disease.specialties.map(specialtyLabel).join(', ') },
                ]}
              />
            </div>
          </section>

          <section id="history" className="scroll-mt-24">
            <SectionHeading title="History" hint="questions, in the order they matter" />
            <ClinicalLineList title="Questions to ask" lines={historyLines} />
            {related.patients.length > 0 ? (
              <PhraseList
                title="Wording the patient may use back"
                hint="from the phrasebook"
                items={related.patients.map((phrase) => phrase.japanese)}
              />
            ) : null}
          </section>

          <section id="examination" className="scroll-mt-24">
            <SectionHeading title="Physical examination" />
            <ClinicalLineList title="Examination phrasing" lines={examinationLines} />
          </section>

          <section id="investigations" className="scroll-mt-24">
            <SectionHeading title="Investigations" />
            <ClinicalLineList title="Tests and imaging to order" lines={investigationLines} />
            <ClinicalLineList title="Explaining each test" hint="what the patient actually needs to hear" lines={investigationLines.slice(0, 8)} />
          </section>

          <section id="treatment" className="scroll-mt-24">
            <SectionHeading title="Treatment" />
            <ClinicalLineList title="Treatment vocabulary" lines={treatmentLines} />
            <PhraseList title="Admission and discharge wording" items={disease.admissionWording} />
          </section>

          {disease.redFlagPhrases.length > 0 ? (
            <section id="safety" className="scroll-mt-24">
              <SectionHeading title="Safety-netting" hint="the sentence that prevents a missed diagnosis" />
              <div className="space-y-2 pt-3">
                {disease.redFlagPhrases.map((phrase) => (
                  <Callout key={phrase} tone="danger">
                    <span lang="ja">{phrase}</span>
                  </Callout>
                ))}
              </div>
            </section>
          ) : null}

          {disease.dialogue.length > 0 ? (
            <section id="dialogue" className="scroll-mt-24">
              <SectionHeading
                title="Example dialogue"
                hint={`${disease.dialogue.length} turns`}
                action={
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                    <MessageSquare className="h-3.5 w-3.5" />
                    patient / doctor
                  </span>
                }
              />
              <ol className="space-y-3 pt-3">
                {disease.dialogue.map((turn, index) => (
                  <li key={`${turn.speaker}-${index}`} className={turn.speaker === 'doctor' ? 'border-l-2 border-l-primary pl-3' : 'border-l-2 border-l-border-strong pl-3'}>
                    <div className="meta-label">{turn.speaker === 'doctor' ? 'Doctor · 医師' : 'Patient · 患者'}</div>
                    <p lang="ja" className="mt-0.5 text-[14.5px] leading-relaxed text-foreground">
                      {turn.japanese}
                    </p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{turn.english}</p>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="At a glance" />
            <div className="pt-3">
              <FactGrid
                columns={1}
                items={[
                  { label: 'Severity', value: disease.severity },
                  { label: 'Specialty', value: disease.specialties.map(specialtyLabel).join(', ') },
                  { label: 'Key symptoms', value: <span lang="ja">{disease.keySymptoms.join('、')}</span> },
                  { label: 'Investigations', value: <span lang="ja">{disease.investigations.join('、') || '—'}</span> },
                ]}
              />
            </div>
          </section>

          {relatedTerms.length > 0 ? (
            <section>
              <SectionHeading title="Related terminology" />
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
                      <span className="shrink-0 text-[10.5px] text-muted">{term.english}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {relatedDiseases.length > 0 ? (
            <section>
              <SectionHeading title="Related conditions" />
              <ul className="pt-2">
                {relatedDiseases.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/medical/diseases/${encodeURIComponent(item.id)}`}
                      className="group flex items-baseline justify-between gap-3 py-1.5 text-[13.5px] hover:text-primary"
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

          {related.medications.length > 0 || related.investigations.length > 0 || related.cases.length > 0 ? (
            <section>
              <SectionHeading title="Related content" />
              <ul className="pt-2 text-[13px]">
                {related.medications.map((item) => <li key={item.id}><Link className="block py-1.5 text-primary hover:underline" href={`/medical/medications/${encodeURIComponent(item.id)}`}>{item.japanese} · {item.indonesianGeneric}</Link></li>)}
                {related.investigations.map((item) => <li key={item.id}><Link className="block py-1.5 text-primary hover:underline" href={`/medical/investigations/${encodeURIComponent(item.id)}`}>{item.japanese} · {item.indonesian}</Link></li>)}
                {related.cases.map((item) => <li key={item.id}><Link className="block py-1.5 text-primary hover:underline" href={`/cases/${encodeURIComponent(item.id)}`}>{item.titleJa} · case</Link></li>)}
              </ul>
            </section>
          ) : null}

          {related.terms.length > 0 ? (
            <section>
              <SectionHeading title="Terms used on this page" />
              <div className="flex flex-wrap gap-1.5 pt-3">
                {related.terms.slice(0, 10).map((term) => (
                  <Link key={term.id} href={`/medical/terms/${encodeURIComponent(term.id)}`}>
                    <Badge lang="ja" className="hover:border-primary hover:text-primary">
                      {term.japanese}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {disease.notes ? (
            <section>
              <SectionHeading title="Notes" />
              <p className="pt-3 text-[12px] leading-relaxed text-muted-foreground">{disease.notes}</p>
            </section>
          ) : null}

          <Divider />

          <section className="flex flex-wrap gap-2">
            <LinkButton href="/cases" size="sm" variant="secondary">
              Run a case
            </LinkButton>
            {relatedTerms.length > 0 ? (
              <AddToReviewButton contentType="medical-term" contentId={relatedTerms[0].id} />
            ) : null}
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
