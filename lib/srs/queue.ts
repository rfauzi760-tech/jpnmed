import type { ReviewItem } from '@/lib/content/schema';
import type { StudyCard } from '@/lib/content/study';
import type { ProfileState } from '@/lib/store/types';
import { isDue, overdueDays } from './fsrs';

/* ------------------------------------------------------------------
   Queue composition.

   A session is due reviews first (most overdue first), then a bounded
   number of new cards so the learner always has something to do on an
   empty day without being buried. Ordering decisions live here, not in
   components.
------------------------------------------------------------------ */

/** Anything the queue needs from a card: identity, not content. */
export type QueueCard = Pick<StudyCard, 'key' | 'contentType' | 'contentId'>;

export type SessionItem<C extends QueueCard = StudyCard> = {
  card: C;
  review: ReviewItem;
  kind: 'review' | 'new' | 'relearning';
};

export type QueueOptions<C extends QueueCard = StudyCard> = {
  now?: Date;
  /** New cards to introduce today; already-introduced cards are subtracted. */
  newAllowance?: number;
  limit?: number;
  /** Restrict the queue to one content type or deck name. */
  filter?: (card: C) => boolean;
};

export function dueReviewItems(reviews: Record<string, ReviewItem>, now = new Date()) {
  return Object.values(reviews)
    .filter((item) => isDue(item, now))
    .sort((a, b) => overdueDays(b, now) - overdueDays(a, now));
}

export function introducedToday(reviews: Record<string, ReviewItem>, now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Object.values(reviews).filter(
    (item) => item.createdAt && new Date(item.createdAt).getTime() >= start.getTime(),
  ).length;
}

export function unseenCards<C extends QueueCard>(reviews: Record<string, ReviewItem>, cards: readonly C[]) {
  return cards.filter((card) => !reviews[card.key]);
}

export function buildSessionQueue<C extends QueueCard>(
  state: ProfileState,
  cards: readonly C[],
  options: QueueOptions<C> = {},
): SessionItem<C>[] {
  const now = options.now ?? new Date();
  const limit = options.limit ?? state.settings.sessionLimit;
  const filter = options.filter ?? (() => true);

  const cardByKey = new Map(cards.map((card) => [card.key, card]));

  const due: SessionItem<C>[] = [];
  for (const review of dueReviewItems(state.reviews, now)) {
    const card = cardByKey.get(review.id);
    if (!card || !filter(card)) continue;
    due.push({
      card,
      review,
      kind: review.state === 'relearning' ? 'relearning' : 'review',
    });
  }

  const allowance = Math.max(
    0,
    (options.newAllowance ?? state.settings.newPerDay) - introducedToday(state.reviews, now),
  );

  const fresh: SessionItem<C>[] = [];
  if (allowance > 0) {
    for (const card of cards) {
      if (fresh.length >= allowance) break;
      if (state.reviews[card.key] || !filter(card)) continue;
      fresh.push({
        card,
        review: {
          id: card.key,
          contentId: card.contentId,
          contentType: card.contentType,
          due: now.toISOString(),
          stability: 0,
          difficulty: 0,
          reps: 0,
          lapses: 0,
          state: 'new',
          createdAt: now.toISOString(),
        },
        kind: 'new',
      });
    }
  }

  // Interleave: two due reviews, then one new card, so a fresh card never
  // arrives in a block at the end of a session.
  const queue: SessionItem<C>[] = [];
  let dueIndex = 0;
  let newIndex = 0;
  while (queue.length < limit && (dueIndex < due.length || newIndex < fresh.length)) {
    for (let i = 0; i < 2 && dueIndex < due.length && queue.length < limit; i += 1) {
      queue.push(due[dueIndex]);
      dueIndex += 1;
    }
    if (newIndex < fresh.length && queue.length < limit) {
      queue.push(fresh[newIndex]);
      newIndex += 1;
    }
  }

  return queue;
}

export function queueSummary(state: ProfileState, cards: readonly QueueCard[], now = new Date()) {
  const due = dueReviewItems(state.reviews, now).length;
  const tracked = Object.keys(state.reviews).length;
  const unseen = unseenCards(state.reviews, cards).length;
  const allowance = Math.max(0, state.settings.newPerDay - introducedToday(state.reviews, now));
  return { due, tracked, unseen, newAvailable: Math.min(allowance, unseen) };
}

export type MasteryLevel = 'new' | 'learning' | 'familiar' | 'strong' | 'mastered';

export const MASTERY_ORDER: MasteryLevel[] = ['new', 'learning', 'familiar', 'strong', 'mastered'];

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  new: 'Not started',
  learning: 'Learning',
  familiar: 'Familiar',
  strong: 'Strong',
  mastered: 'Mastered',
};

/** Derives a mastery level from the scheduler state. Pure and testable. */
export function masteryOf(item: ReviewItem | undefined): MasteryLevel {
  if (!item) return 'new';
  if (item.state === 'new') return 'new';
  if (item.state === 'learning' || item.state === 'relearning') return 'learning';
  if (item.stability >= 120 && item.reps >= 5) return 'mastered';
  if (item.stability >= 30) return 'strong';
  return 'familiar';
}

export function masteryDistribution(reviews: Record<string, ReviewItem>) {
  const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, familiar: 0, strong: 0, mastered: 0 };
  for (const item of Object.values(reviews)) counts[masteryOf(item)] += 1;
  return counts;
}
