import type { Metadata } from 'next';
import { FEATURED_COMPARISONS, GRAMMAR } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { GrammarCompare, type CompareRow } from '@/components/grammar/compare';

export const metadata: Metadata = {
  title: 'Compare grammar',
  description: 'Side-by-side comparison of near-synonymous N2 and N1 grammar patterns.',
};

export default async function CompareGrammarPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const params = await searchParams;
  const byId = new Map(GRAMMAR.map((entry) => [entry.id, entry]));

  const rows: CompareRow[] = GRAMMAR.map((entry) => ({
    id: entry.id,
    pattern: entry.pattern,
    kana: entry.kana,
    meaning: entry.meaning,
    meaningsId: entry.meaningsId,
    family: entry.family,
    jlptLevel: entry.jlptLevel,
    formation: entry.formation,
    nuance: entry.nuance,
    register: entry.register,
    whenToUse: entry.whenToUse,
    whenNotToUse: entry.whenNotToUse,
    examples: entry.examples.map((example) => ({ ja: example.ja, en: example.en })),
    contrastNote: entry.contrastNote,
  }));

  const featured = FEATURED_COMPARISONS.map(([a, b]) => ({
    a,
    b,
    aPattern: byId.get(a)?.pattern ?? a,
    bPattern: byId.get(b)?.pattern ?? b,
  }));

  return (
    <PageBody wide>
      <GrammarCompare rows={rows} featured={featured} initialA={params.a} initialB={params.b} />
    </PageBody>
  );
}
