import type { ReviewItem, ReviewRating } from '@/lib/content/schema';

/* ------------------------------------------------------------------
   Spaced repetition scheduling.

   FSRS-4.5 with the published default weights, wrapped in explicit
   learning steps for brand-new and lapsed items. This module is pure:
   it takes a review item and a rating, and returns the next state. The
   UI never computes intervals itself (AGENTS §7).

   Ratings map to the FSRS grades 1..4:
     again = 1, hard = 2, good = 3, easy = 4
------------------------------------------------------------------ */

export const FSRS_WEIGHTS = [
  0.4072, 1.1829, 3.1262, 15.4722, 7.2102, 0.5316, 1.0651, 0.0234, 1.616, 0.1544, 1.0824, 1.9813, 0.0953,
  0.2975, 2.2042, 0.2407, 2.9466,
] as const;

/** Forgetting-curve parameters used by FSRS. */
const DECAY = -0.5;
const FACTOR = 19 / 81;

/** Target probability of recall at the moment an item becomes due. */
export const TARGET_RETENTION = 0.9;

/** Learning steps, in minutes, before an item graduates to review. */
export const LEARNING_STEPS_MINUTES = [1, 10];

const MIN_STABILITY = 0.1;
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MAX_INTERVAL_DAYS = 365 * 5;

export const RATING_GRADE: Record<ReviewRating, 1 | 2 | 3 | 4> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

export const RATINGS: ReviewRating[] = ['again', 'hard', 'good', 'easy'];

const DAY_MS = 86_400_000;
const MINUTE_MS = 60_000;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function initStability(grade: 1 | 2 | 3 | 4) {
  return Math.max(FSRS_WEIGHTS[grade - 1], MIN_STABILITY);
}

export function initDifficulty(grade: 1 | 2 | 3 | 4) {
  return clamp(FSRS_WEIGHTS[4] - Math.exp(FSRS_WEIGHTS[5] * (grade - 1)) + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/** Probability that the learner still recalls an item after `elapsedDays`. */
export function retrievability(elapsedDays: number, stability: number) {
  if (stability <= 0) return 0;
  const elapsed = Math.max(0, elapsedDays);
  return Math.pow(1 + (FACTOR * elapsed) / stability, DECAY);
}

/** Interval, in days, that brings retrievability down to the target. */
export function intervalFromStability(stability: number) {
  const raw = (stability / FACTOR) * (Math.pow(TARGET_RETENTION, 1 / DECAY) - 1);
  return clamp(Math.round(raw), 1, MAX_INTERVAL_DAYS);
}

function nextDifficulty(difficulty: number, grade: 1 | 2 | 3 | 4) {
  const delta = difficulty - FSRS_WEIGHTS[6] * (grade - 3);
  const reverted = FSRS_WEIGHTS[7] * initDifficulty(4) + (1 - FSRS_WEIGHTS[7]) * delta;
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

function stabilityAfterRecall(difficulty: number, stability: number, recall: number, grade: 1 | 2 | 3 | 4) {
  const hardPenalty = grade === 2 ? FSRS_WEIGHTS[15] : 1;
  const easyBonus = grade === 4 ? FSRS_WEIGHTS[16] : 1;
  const growth =
    Math.exp(FSRS_WEIGHTS[8]) *
    (11 - difficulty) *
    Math.pow(stability, -FSRS_WEIGHTS[9]) *
    (Math.exp(FSRS_WEIGHTS[10] * (1 - recall)) - 1) *
    hardPenalty *
    easyBonus;
  return stability * (1 + growth);
}

function stabilityAfterLapse(difficulty: number, stability: number, recall: number) {
  const next =
    FSRS_WEIGHTS[11] *
    Math.pow(difficulty, -FSRS_WEIGHTS[12]) *
    (Math.pow(stability + 1, FSRS_WEIGHTS[13]) - 1) *
    Math.exp(FSRS_WEIGHTS[14] * (1 - recall));
  // A lapse should never increase stability.
  return clamp(Math.min(next, stability), MIN_STABILITY, MAX_INTERVAL_DAYS);
}

export type ScheduleResult = {
  due: string;
  stability: number;
  difficulty: number;
  state: ReviewItem['state'];
  reps: number;
  lapses: number;
  /** Scheduled interval in days; 0 while the item is still in learning. */
  intervalDays: number;
  lastRating: ReviewRating;
  lastReviewedAt: string;
  /** Human-readable explanation shown briefly after rating. */
  explanation: string;
};

function inMinutes(now: Date, minutes: number) {
  return new Date(now.getTime() + minutes * MINUTE_MS).toISOString();
}

function inDays(now: Date, days: number) {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

function formatInterval(days: number) {
  if (days <= 0) return 'later today';
  if (days === 1) return 'tomorrow';
  if (days < 30) return `in ${days} days`;
  if (days < 365) return `in ${Math.round(days / 30)} months`;
  return `in ${(days / 365).toFixed(1)} years`;
}

/**
 * Applies a rating to a review item and returns its next state.
 * The input item is not mutated.
 */
export function schedule(item: ReviewItem, rating: ReviewRating, now: Date = new Date()): ScheduleResult {
  const grade = RATING_GRADE[rating];
  const nowIso = now.toISOString();
  const isNew = item.state === 'new';
  const isLearning = isNew || item.state === 'learning' || item.state === 'relearning';

  if (isLearning) {
    const step = item.reps; // learning step index is tracked in reps for learning items
    if (rating === 'again') {
      return {
        due: inMinutes(now, LEARNING_STEPS_MINUTES[0]),
        stability: 0,
        difficulty: initDifficulty(1),
        state: 'learning',
        reps: 0,
        lapses: item.lapses + (isNew ? 0 : 1),
        intervalDays: 0,
        lastRating: rating,
        lastReviewedAt: nowIso,
        explanation: 'Back to the start of today’s learning steps.',
      };
    }

    // 'good' advances one step and graduates once the steps are exhausted;
    // 'easy' graduates immediately.
    const graduated = rating === 'easy' || step + 1 >= LEARNING_STEPS_MINUTES.length;

    if (rating === 'hard') {
      return {
        due: inMinutes(now, LEARNING_STEPS_MINUTES[Math.min(step, LEARNING_STEPS_MINUTES.length - 1)]),
        stability: initStability(2),
        difficulty: initDifficulty(2),
        state: 'learning',
        reps: step,
        lapses: item.lapses,
        intervalDays: 0,
        lastRating: rating,
        lastReviewedAt: nowIso,
        explanation: 'Repeating the current learning step.',
      };
    }

    const stability = initStability(grade);
    const difficulty = initDifficulty(grade);
    if (!graduated) {
      return {
        due: inMinutes(now, LEARNING_STEPS_MINUTES[step + 1] ?? LEARNING_STEPS_MINUTES.at(-1) ?? 10),
        stability,
        difficulty,
        state: 'learning',
        reps: step + 1,
        lapses: item.lapses,
        intervalDays: 0,
        lastRating: rating,
        lastReviewedAt: nowIso,
        explanation: 'Next learning step.',
      };
    }

    const intervalDays = intervalFromStability(stability);
    return {
      due: inDays(now, intervalDays),
      stability,
      difficulty,
      state: 'review',
      reps: step + 1,
      lapses: item.lapses,
      intervalDays,
      lastRating: rating,
      lastReviewedAt: nowIso,
      explanation: `Graduated to review — next in ${formatInterval(intervalDays)}.`,
    };
  }

  const lastReviewed = item.lastReviewedAt ? new Date(item.lastReviewedAt) : now;
  const elapsedDays = Math.max(0, (now.getTime() - lastReviewed.getTime()) / DAY_MS);
  const stability = item.stability > 0 ? item.stability : initStability(grade);
  const difficulty = item.difficulty > 0 ? item.difficulty : initDifficulty(grade);
  const recall = retrievability(elapsedDays, stability);

  if (rating === 'again') {
    const lapsedStability = stabilityAfterLapse(difficulty, stability, recall);
    const lapsedDifficulty = nextDifficulty(difficulty, 1);
    return {
      due: inMinutes(now, LEARNING_STEPS_MINUTES[0]),
      stability: lapsedStability,
      difficulty: lapsedDifficulty,
      state: 'relearning',
      reps: item.reps + 1,
      lapses: item.lapses + 1,
      intervalDays: 0,
      lastRating: rating,
      lastReviewedAt: nowIso,
      explanation: `Lapsed — retrievability was ${(recall * 100).toFixed(0)}%. Relearning from today.`,
    };
  }

  const nextStability = stabilityAfterRecall(difficulty, stability, recall, grade);
  const nextDifficultyValue = nextDifficulty(difficulty, grade);
  const intervalDays = intervalFromStability(nextStability);

  return {
    due: inDays(now, intervalDays),
    stability: nextStability,
    difficulty: nextDifficultyValue,
    state: 'review',
    reps: item.reps + 1,
    lapses: item.lapses,
    intervalDays,
    lastRating: rating,
    lastReviewedAt: nowIso,
    explanation: `Retention was estimated at ${(recall * 100).toFixed(0)}% — next in ${formatInterval(intervalDays)}.`,
  };
}

/** Read-only preview used to label the rating buttons with their interval. */
export function previewIntervals(item: ReviewItem, now: Date = new Date()) {
  return {
    again: schedule(item, 'again', now),
    hard: schedule(item, 'hard', now),
    good: schedule(item, 'good', now),
    easy: schedule(item, 'easy', now),
  };
}

export function isDue(item: ReviewItem, now: Date = new Date()) {
  if (item.suspended) return false;
  if (item.state === 'new') return false;
  return new Date(item.due).getTime() <= now.getTime();
}

export function overdueDays(item: ReviewItem, now: Date = new Date()) {
  const diff = now.getTime() - new Date(item.due).getTime();
  return diff <= 0 ? 0 : diff / DAY_MS;
}

export const RETENTION_LABELS: Record<ReviewRating, string> = {
  again: 'Again',
  hard: 'Hard',
  good: 'Good',
  easy: 'Easy',
};

export const RETENTION_KEYS: Record<ReviewRating, string> = {
  again: '1',
  hard: '2',
  good: '3',
  easy: '4',
};
