import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CASES, MEDICAL_TERMS, getCase } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { CaseSimulator, type CaseView } from '@/components/cases/simulator';

export function generateStaticParams() {
  return CASES.map((item) => ({ id: item.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const item = getCase(id);
  if (!item) return { title: 'Clinical cases' };
  return { title: item.title, description: item.chiefComplaint };
}

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = getCase(id);
  if (!item) notFound();

  // Drill terms are authored as Japanese surface forms; resolve them to entries.
  const drillTerms = item.drillTerms
    .map((surface) =>
      MEDICAL_TERMS.find(
        (term) =>
          term.japanese === surface || term.alternativeNames.includes(surface) || (surface.length > 1 && term.japanese.includes(surface)),
      ),
    )
    .filter((term): term is (typeof MEDICAL_TERMS)[number] => Boolean(term))
    .map((term) => ({ id: term.id, japanese: term.japanese, english: term.english }));

  const view: CaseView = {
    id: item.id,
    title: item.title,
    titleJa: item.titleJa,
    specialty: item.specialty,
    difficulty: item.difficulty,
    setting: item.setting,
    patientProfile: item.patientProfile,
    chiefComplaint: item.chiefComplaint,
    hiddenDiagnosis: item.hiddenDiagnosis,
    openingPhrase: item.openingPhrase,
    questions: item.requiredQuestions.map((question) => ({
      id: question.id,
      topic: question.topic,
      acceptedPhrases: question.acceptedPhrases,
      why: question.why,
      weight: question.weight,
      redFlag: question.redFlag,
    })),
    patientLines: item.patientLines.map((line) => ({
      id: line.id,
      topic: line.topic,
      japanese: line.japanese,
      english: line.english,
      indonesian: line.indonesian,
    })),
    examinationFindings: item.examinationFindings,
    expectedInvestigations: item.expectedInvestigations,
    teachingPoints: item.teachingPoints,
    drillTerms,
    voiceNote: item.voiceNote,
  };

  return (
    <PageBody wide>
      <CaseSimulator item={view} />
    </PageBody>
  );
}
