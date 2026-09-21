import { describe, expect, it } from 'vitest';
import type { ReviewItem } from '@/lib/content/schema';
import { buildCard } from '@/lib/content/study';
import {
  intervalFromStability,
  initDifficulty,
  initStability,
  isDue,
  previewIntervals,
  retrievability,
  schedule,
} from '@/lib/srs/fsrs';
import { buildSessionQueue, masteryOf, queueSummary } from '@/lib/srs/queue';
import { createEmptyProfile } from '@/lib/store/types';

const NOW = new Date('2026-09-21T09:00:00.000Z');

function newItem(id = 'vocabulary:voc-haaku'): ReviewItem {
  return {
    id,
    contentId: 'voc-haaku',
    contentType: 'vocabulary',
    due: NOW.toISOString(),
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: 'new',
    createdAt: NOW.toISOString(),
  };
}

function reviewItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    ...newItem(),
    state: 'review',
    stability: 10,
    difficulty: 5,
    reps: 3,
    lastReviewedAt: new Date(NOW.getTime() - 10 * 86_400_000).toISOString(),
    due: NOW.toISOString(),
    ...overrides,
  };
}

describe('retrievability', () => {
  it('is 90% at the scheduled interval for the target retention', () => {
    const stability = 10;
    const interval = intervalFromStability(stability);
    expect(retrievability(interval, stability)).toBeCloseTo(0.9, 1);
  });

  it('decays as time passes', () => {
    expect(retrievability(0, 10)).toBeGreaterThan(retrievability(30, 10));
  });
});

describe('initialisation', () => {
  it('gives easier ratings longer initial stability', () => {
    expect(initStability(1)).toBeLessThan(initStability(2));
    expect(initStability(2)).toBeLessThan(initStability(3));
    expect(initStability(3)).toBeLessThan(initStability(4));
  });

  it('gives harder ratings higher initial difficulty', () => {
    expect(initDifficulty(1)).toBeGreaterThan(initDifficulty(4));
  });
});

describe('scheduling a new card', () => {
  it('keeps "again" inside the learning steps', () => {
    const result = schedule(newItem(), 'again', NOW);
    expect(result.state).toBe('learning');
    expect(new Date(result.due).getTime() - NOW.getTime()).toBeLessThanOrEqual(60_000 * 60);
    expect(result.intervalDays).toBe(0);
  });

  it('graduates "good" after the learning steps', () => {
    const first = schedule(newItem(), 'good', NOW);
    expect(first.state).toBe('learning');
    const second = schedule({ ...newItem(), state: first.state, reps: first.reps }, 'good', NOW);
    expect(second.state).toBe('review');
    expect(second.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('graduates "easy" immediately with a longer interval than "good"', () => {
    const easy = schedule(newItem(), 'easy', NOW);
    expect(easy.state).toBe('review');
    expect(easy.intervalDays).toBeGreaterThan(3);
  });
});

describe('scheduling a review card', () => {
  it('extends the interval on recall', () => {
    const result = schedule(reviewItem(), 'good', NOW);
    expect(result.state).toBe('review');
    expect(result.stability).toBeGreaterThan(10);
    expect(result.intervalDays).toBeGreaterThan(10);
  });

  it('treats a lapse as relearning and never increases stability', () => {
    const result = schedule(reviewItem(), 'again', NOW);
    expect(result.state).toBe('relearning');
    expect(result.lapses).toBe(1);
    expect(result.intervalDays).toBe(0);
    expect(new Date(result.due).getTime() - NOW.getTime()).toBeLessThan(3600_000);
  });

  it('orders the preview intervals again < hard < good < easy', () => {
    const preview = previewIntervals(reviewItem(), NOW);
    const due = (key: keyof typeof preview) => new Date(preview[key].due).getTime();
    expect(due('again')).toBeLessThan(due('hard'));
    expect(due('hard')).toBeLessThan(due('good'));
    expect(due('good')).toBeLessThan(due('easy'));
  });

  it('is due only once the due date has passed and the item is not new or suspended', () => {
    expect(isDue(reviewItem({ due: new Date(NOW.getTime() - 1000).toISOString() }), NOW)).toBe(true);
    expect(isDue(reviewItem({ due: new Date(NOW.getTime() + 86_400_000).toISOString() }), NOW)).toBe(false);
    expect(isDue(newItem(), NOW)).toBe(false);
    expect(isDue(reviewItem({ suspended: true }), NOW)).toBe(false);
  });
});

describe('mastery levels', () => {
  it('maps scheduler state to a level', () => {
    expect(masteryOf(undefined)).toBe('new');
    expect(masteryOf(newItem())).toBe('new');
    expect(masteryOf(reviewItem({ state: 'learning' }))).toBe('learning');
    expect(masteryOf(reviewItem({ stability: 10 }))).toBe('familiar');
    expect(masteryOf(reviewItem({ stability: 40 }))).toBe('strong');
    expect(masteryOf(reviewItem({ stability: 200, reps: 6 }))).toBe('mastered');
  });
});

describe('session queue', () => {
  const cards = ['vocabulary:voc-haaku', 'vocabulary:voc-keikou', 'vocabulary:voc-eikyou']
    .map((key) => {
      const [type, id] = key.split(':');
      return buildCard(type as 'vocabulary', id);
    })
    .filter((card): card is NonNullable<typeof card> => Boolean(card));

  it('puts overdue reviews first and respects the session limit', () => {
    const profile = createEmptyProfile(NOW);
    profile.settings.sessionLimit = 2;
    profile.reviews['vocabulary:voc-haaku'] = reviewItem({
      id: 'vocabulary:voc-haaku',
      contentId: 'voc-haaku',
      due: new Date(NOW.getTime() - 3 * 86_400_000).toISOString(),
    });
    profile.reviews['vocabulary:voc-keikou'] = reviewItem({
      id: 'vocabulary:voc-keikou',
      contentId: 'voc-keikou',
      due: new Date(NOW.getTime() - 86_400_000).toISOString(),
    });

    const queue = buildSessionQueue(profile, cards, { now: NOW, limit: 2, newAllowance: 0 });
    expect(queue).toHaveLength(2);
    expect(queue[0]?.review.id).toBe('vocabulary:voc-haaku');
    expect(queue.every((item) => item.kind === 'review')).toBe(true);
  });

  it('introduces at most the daily allowance of new cards', () => {
    const profile = createEmptyProfile(NOW);
    const queue = buildSessionQueue(profile, cards, { now: NOW, newAllowance: 1, limit: 10 });
    expect(queue.filter((item) => item.kind === 'new')).toHaveLength(1);
  });

  it('never duplicates an item that is already tracked', () => {
    const profile = createEmptyProfile(NOW);
    profile.reviews['vocabulary:voc-haaku'] = reviewItem({ due: new Date(NOW.getTime() + 86_400_000).toISOString() });
    const queue = buildSessionQueue(profile, cards, { now: NOW, newAllowance: 10, limit: 10 });
    expect(queue.map((item) => item.review.id)).not.toContain('vocabulary:voc-haaku');
  });

  it('summarises the workload for the dashboard', () => {
    const profile = createEmptyProfile(NOW);
    profile.reviews['vocabulary:voc-haaku'] = reviewItem({ due: new Date(NOW.getTime() - 1000).toISOString() });
    const summary = queueSummary(profile, cards, NOW);
    expect(summary.due).toBe(1);
    expect(summary.tracked).toBe(1);
    expect(summary.newAvailable).toBeGreaterThan(0);
  });
});
