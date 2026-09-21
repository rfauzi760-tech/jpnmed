import type { Metadata } from 'next';
import { MEDICAL_TERMS } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { TermBrowser, type TermRow } from '@/components/medical/term-browser';
import { SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Medical dictionary',
  description: 'Medical terminology in Japanese with English and Indonesian glosses and patient-friendly wording.',
};

export default async function MedicalTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;

  const rows: TermRow[] = MEDICAL_TERMS.map((term) => ({
    id: term.id,
    japanese: term.japanese,
    kana: term.kana,
    romaji: term.romaji,
    english: term.english,
    indonesian: term.indonesian,
    patientFriendly: term.patientFriendly,
    patientExpression: term.patientExpression,
    patientFriendlySupport: term.patientFriendlySupport,
    patientExpressionSupport: term.patientExpressionSupport,
    category: term.category,
    specialties: term.specialties,
    tags: term.tags,
    alternativeNames: term.alternativeNames,
    definitionJa: term.definitionJa,
    verificationStatus: term.verificationStatus,
    related: term.relatedIds.length,
  }));

  return (
    <PageBody wide>
      <TermBrowser rows={rows} initialCategory={params.category} initialQuery={params.q} />
      <div className="mt-6">
        <SafetyNote />
      </div>
    </PageBody>
  );
}
