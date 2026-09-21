import type { Metadata } from 'next';
import { COLLECTIONS, VOCABULARY } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { VocabularyBrowser, type VocabRow } from '@/components/vocabulary/browser';

export const metadata: Metadata = {
  title: 'Vocabulary',
  description: 'Advanced Japanese vocabulary as a reference database: readings, glosses, examples and relations.',
};

export default async function VocabularyPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; q?: string; level?: string; state?: string; tag?: string }>;
}) {
  const params = await searchParams;

  // The full reference set is small enough to hand to the client once, so
  // filtering, sorting and keyboard navigation never touch the network.
  const rows: VocabRow[] = VOCABULARY.map((word) => ({
    id: word.id,
    japanese: word.japanese,
    kana: word.kana,
    meaningsEn: word.meaningsEn,
    meaningsId: word.meaningsId,
    definitionJa: word.definitionJa,
    partOfSpeech: word.partOfSpeech ?? [],
    jlptLevel: word.jlptLevel,
    tags: word.tags,
    medicalRelevance: Boolean(word.medicalRelevance),
    exampleCount: word.examples.length,
    example: word.examples[0] ? { ja: word.examples[0].ja, en: word.examples[0].en } : undefined,
    frequencyRank: word.frequencyRank,
    notes: word.notes,
    synonyms: word.synonyms ?? [],
  }));

  const collections = COLLECTIONS.filter((collection) => collection.id.startsWith('col-n') || collection.id === 'col-connectors' || collection.id === 'col-reading-trap').map(
    (collection) => ({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      count: collection.itemIds.length,
    }),
  );

  return (
    <PageBody wide>
      <VocabularyBrowser
        rows={rows}
        collections={collections}
        initialCollection={params.collection}
        initialQuery={params.q}
        initialLevel={params.level}
        initialState={params.state}
        initialTag={params.tag}
      />
    </PageBody>
  );
}
