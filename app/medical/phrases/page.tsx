import type { Metadata } from 'next';
import { PHRASES } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { Phrasebook, type PhraseRow } from '@/components/medical/phrasebook';
import { SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Clinical phrasebook',
  description: 'Eighteen stages of a Japanese clinical encounter, with polite, patient-friendly and formal registers.',
};

export default async function PhrasebookPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; p?: string }>;
}) {
  const params = await searchParams;

  const rows: PhraseRow[] = PHRASES.map((phrase) => ({
    id: phrase.id,
    intent: phrase.intent,
    japanese: phrase.japanese,
    kana: phrase.kana,
    romaji: phrase.romaji,
    english: phrase.english,
    indonesian: phrase.indonesian,
    register: phrase.register,
    speaker: phrase.speaker,
    stage: phrase.stage,
    clinicalContext: phrase.clinicalContext,
    nuance: phrase.nuance,
    specialtyTags: phrase.specialtyTags,
    variants: phrase.variants,
    alternativeExpressions: phrase.alternativeExpressions,
    relatedTermIds: phrase.relatedTermIds,
    relatedDiseaseIds: phrase.relatedDiseaseIds,
    notes: phrase.notes,
  }));

  return (
    <PageBody wide>
      <Phrasebook rows={rows} initialStage={params.stage} highlight={params.p} />
      <div className="mt-6">
        <SafetyNote />
      </div>
    </PageBody>
  );
}
