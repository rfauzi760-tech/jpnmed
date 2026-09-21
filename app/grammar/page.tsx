import type { Metadata } from 'next';
import { FEATURED_COMPARISONS, GRAMMAR } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { GrammarLibrary, type GrammarRow } from '@/components/grammar/library';

export const metadata: Metadata = {
  title: 'Grammar',
  description: 'N2 and N1 grammar patterns grouped by function, with the contrasts that decide exam answers.',
};

export default function GrammarPage() {
  const rows: GrammarRow[] = GRAMMAR.map((entry) => ({
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
    example: entry.examples[0]?.ja,
    exampleCount: entry.examples.length,
    contrastNote: entry.contrastNote,
    similarIds: entry.similarIds,
    commonMistakeCount: entry.commonMistakes.length,
  }));

  const byId = new Map(GRAMMAR.map((entry) => [entry.id, entry]));
  const featured = FEATURED_COMPARISONS.map(([a, b]) => ({
    id: `${a}-${b}`,
    a,
    b,
    aPattern: byId.get(a)?.pattern ?? a,
    bPattern: byId.get(b)?.pattern ?? b,
    note: byId.get(a)?.contrastNote,
  }));

  return (
    <PageBody>
      <GrammarLibrary rows={rows} featured={featured} />
    </PageBody>
  );
}
