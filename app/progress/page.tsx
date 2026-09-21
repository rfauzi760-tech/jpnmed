import type { Metadata } from 'next';
import { CONTENT_STATS, GRAMMAR, MEDICAL_TERMS, PHRASES, VOCABULARY } from '@/lib/content';
import { PHRASE_STAGES } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import { ProgressAnalytics, type ProgressTotals } from '@/components/progress/analytics';

export const metadata: Metadata = {
  title: 'Progress',
  description: 'Reading accuracy, review retention, mistake patterns and clinical coverage — every figure traceable to a study event.',
};

export default function ProgressPage() {
  // Denominators (library sizes) come from the server; the learner's own
  // numbers are computed on the client from their profile.
  const specialtiesOf: Record<string, string[]> = {};
  for (const term of MEDICAL_TERMS) specialtiesOf[term.id] = term.specialties;

  const totals: ProgressTotals = {
    library: {
      vocabulary: CONTENT_STATS.vocabulary,
      grammar: GRAMMAR.length,
      terms: MEDICAL_TERMS.length,
      phrases: PHRASES.length,
      symptoms: CONTENT_STATS.symptoms,
      diseases: CONTENT_STATS.diseases,
    },
    stages: PHRASE_STAGES.map((stage) => ({
      id: stage.id,
      label: stage.label.short ?? stage.label.en,
      total: PHRASES.filter((phrase) => phrase.stage === stage.id).length,
    })),
    specialtiesOf,
  };

  return (
    <PageBody>
      <ProgressAnalytics totals={totals} />
      <p className="mt-4 text-[11.5px] text-muted">
        Library: {VOCABULARY.length} vocabulary entries · {GRAMMAR.length} grammar patterns · {MEDICAL_TERMS.length} terms ·{' '}
        {PHRASES.length} phrases.
      </p>
    </PageBody>
  );
}
