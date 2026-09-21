import type { Metadata } from 'next';
import { buildAllCards } from '@/lib/content/study';
import { PageBody } from '@/components/shell/app-shell';
import { ReviewSession, type DeckKey } from '@/components/review/session';

export const metadata: Metadata = {
  title: 'Review',
  description: 'Spaced repetition over vocabulary, grammar, medical terminology and clinical phrases.',
};

const DECKS: DeckKey[] = ['all', 'vocabulary', 'grammar', 'medical', 'phrases', 'symptoms', 'diseases'];

export default async function ReviewPage({ searchParams }: { searchParams: Promise<{ deck?: string }> }) {
  const params = await searchParams;
  const deck = (DECKS as string[]).includes(params.deck ?? '') ? (params.deck as DeckKey) : 'all';
  const cards = buildAllCards();

  return (
    <PageBody>
      <ReviewSession cards={cards} initialDeck={deck} />
    </PageBody>
  );
}
