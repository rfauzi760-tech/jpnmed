import type { MistakeCategory, ReviewItem, StudyLogEntry } from '@/lib/content/schema';
import { MISTAKE_LABELS, SKILL_LABELS } from '@/lib/content/taxonomy';
import { masteryOf, type MasteryLevel } from '@/lib/srs/queue';
import { EMPTY_DAY, type DayStats, type ProfileState } from './types';

/* ------------------------------------------------------------------
   Derived analytics.

   Pure functions over the profile. The progress page shows only what
   these produce, and every number is traceable to logged study events,
   so there are no vanity metrics.
------------------------------------------------------------------ */

export function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dayStats(state: ProfileState, key: string): DayStats {
  return state.dayStats[key] ?? EMPTY_DAY;
}

export function todayStats(state: ProfileState, now = new Date()) {
  return dayStats(state, dateKey(now));
}

export type DaySeries = { key: string; date: Date; stats: DayStats; isToday: boolean };

export function daySeries(state: ProfileState, days: number, now = new Date()): DaySeries[] {
  const out: DaySeries[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = dateKey(date);
    out.push({ key, date, stats: dayStats(state, key), isToday: i === 0 });
  }
  return out;
}

export function streak(state: ProfileState, now = new Date()) {
  let count = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  const today = dayStats(state, dateKey(cursor));
  const active = (stats: DayStats) => stats.reviews + stats.newItems + stats.notes + stats.cases > 0;

  // Today only counts once something has been done; otherwise start from yesterday.
  if (!active(today)) cursor.setDate(cursor.getDate() - 1);
  while (active(dayStats(state, dateKey(cursor)))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function retention(state: ProfileState, days = 30, now = new Date()) {
  const since = now.getTime() - days * 86_400_000;
  const relevant = Object.values(state.reviews).filter(
    (item) => item.lastReviewedAt && new Date(item.lastReviewedAt).getTime() >= since,
  );
  const recalled = relevant.filter((item) => item.lastRating !== 'again').length;
  const totalRatings = state.logs.filter((log) => log.kind === 'review' && new Date(log.at).getTime() >= since);
  return {
    reviewed: relevant.length,
    recalled,
    // Review log entries hold the rating in `area`, so no extra field is needed.
    rate: totalRatings.length > 0 ? recalled / Math.max(1, relevant.length) : 0,
    sessions: totalRatings.length,
  };
}

export function reviewForecast(state: ProfileState, days = 14, now = new Date()) {
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i += 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + i);
    buckets.set(dateKey(date), 0);
  }
  let overdue = 0;
  for (const item of Object.values(state.reviews)) {
    if (item.suspended || item.state === 'new') continue;
    const due = new Date(item.due);
    const key = dateKey(due);
    if (due.getTime() <= now.getTime()) {
      overdue += 1;
      continue;
    }
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return {
    overdue,
    days: [...buckets.entries()].map(([key, count]) => ({ key, count })),
    max: Math.max(1, ...[...buckets.values()]),
  };
}

export function masteryCounts(state: ProfileState) {
  const counts: Record<MasteryLevel, number> = { new: 0, learning: 0, familiar: 0, strong: 0, mastered: 0 };
  let total = 0;
  for (const item of Object.values(state.reviews)) {
    counts[masteryOf(item)] += 1;
    total += 1;
  }
  return { counts, total, mastered: counts.mastered + counts.strong };
}

export type MistakeSummary = {
  category: MistakeCategory;
  label: string;
  count: number;
  share: number;
};

export function mistakeBreakdown(state: ProfileState, days = 90, now = new Date()): MistakeSummary[] {
  const since = now.getTime() - days * 86_400_000;
  const recent = state.mistakes.filter((m) => new Date(m.createdAt).getTime() >= since);
  const total = recent.length || 1;
  const counts = new Map<MistakeCategory, number>();
  for (const mistake of recent) counts.set(mistake.category, (counts.get(mistake.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({
      category,
      label: MISTAKE_LABELS[category].en,
      count,
      share: count / total,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Pattern sentences shown on the dashboard and progress pages
 * (PRD §7.6, prompt: "38% of your recent mistakes involve inference").
 */
export function mistakeInsights(state: ProfileState, now = new Date()): string[] {
  const insights: string[] = [];
  const breakdown = mistakeBreakdown(state, 60, now);
  if (breakdown.length === 0) return insights;

  const top = breakdown[0];
  if (top.count >= 3 && top.share >= 0.25) {
    insights.push(`${Math.round(top.share * 100)}% of your recent mistakes involve ${top.label.toLowerCase()}.`);
  }

  const second = breakdown[1];
  if (second && second.count >= 3) {
    insights.push(`${second.label} accounts for ${Math.round(second.share * 100)}% of the same period.`);
  }

  const contrast = state.mistakes.filter((m) => m.category === 'contrast').length;
  if (contrast >= 3) {
    insights.push('You frequently miss questions where the conclusion follows a contrast marker.');
  }
  const rushed = state.mistakes.filter((m) => m.category === 'rushed').length;
  if (rushed >= 3) {
    insights.push('Several misses were answered faster than the passage warranted — try slowing slightly.');
  }
  const negation = state.mistakes.filter((m) => m.category === 'negation').length;
  if (negation >= 2) {
    insights.push('Partial negation (わけではない / とは限らない) is a repeating weak point.');
  }
  return insights.slice(0, 4);
}

export function readingStats(state: ProfileState, days = 90, now = new Date()) {
  const since = now.getTime() - days * 86_400_000;
  const attempts = state.attempts.filter((a) => new Date(a.finishedAt).getTime() >= since);
  const answered = attempts.flatMap((a) => a.answers);
  const correct = answered.filter((a) => a.correct).length;
  const seconds = attempts.reduce((sum, a) => sum + a.secondsSpent, 0);
  const totalQuestions = answered.length;

  const bySkill = new Map<string, { correct: number; total: number }>();
  for (const answer of answered) {
    const entry = bySkill.get(answer.skill) ?? { correct: 0, total: 0 };
    entry.total += 1;
    if (answer.correct) entry.correct += 1;
    bySkill.set(answer.skill, entry);
  }

  return {
    attempts: attempts.length,
    questions: totalQuestions,
    accuracy: totalQuestions > 0 ? correct / totalQuestions : 0,
    averageSecondsPerQuestion: totalQuestions > 0 ? seconds / totalQuestions : 0,
    totalMinutes: Math.round(seconds / 60),
    bySkill: [...bySkill.entries()]
      .map(([skill, value]) => ({
        skill,
        label: SKILL_LABELS[skill as keyof typeof SKILL_LABELS]?.en ?? skill,
        accuracy: value.total > 0 ? value.correct / value.total : 0,
        total: value.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy),
  };
}

export function medicalCoverage(state: ProfileState) {
  let terms = 0;
  let phrases = 0;
  let mastered = 0;
  for (const item of Object.values(state.reviews)) {
    if (item.contentType === 'medical-term') terms += 1;
    if (item.contentType === 'clinical-phrase') phrases += 1;
    if ((item.contentType === 'medical-term' || item.contentType === 'clinical-phrase') && item.stability >= 30) {
      mastered += 1;
    }
  }
  const stages = new Set<string>();
  for (const item of Object.values(state.reviews)) {
    if (item.contentType === 'clinical-phrase') stages.add(item.contentId.split('-')[1] ?? '');
  }
  return {
    termsTracked: terms,
    phrasesTracked: phrases,
    mastered,
    stagesCovered: stages.size,
    cases: state.caseAttempts.length,
    caseAccuracy: state.caseAttempts.length
      ? state.caseAttempts.reduce((sum, a) => sum + a.score / Math.max(1, a.maxScore), 0) / state.caseAttempts.length
      : 0,
  };
}

export function weakCategories(state: ProfileState, now = new Date()) {
  return mistakeBreakdown(state, 60, now).slice(0, 4);
}

export function recentMistakes(state: ProfileState, limit = 6) {
  return [...state.mistakes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function recentLogs(state: ProfileState, limit = 12) {
  return [...state.logs].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

export function logLabel(log: StudyLogEntry) {
  switch (log.kind) {
    case 'review':
      return `Reviewed ${log.amount} card${log.amount === 1 ? '' : 's'} (${log.area})`;
    case 'reading':
      return `Reading drill · ${log.area}`;
    case 'case':
      return `Clinical case · ${log.area}`;
    case 'term':
      return `Medical study · ${log.area}`;
    case 'note':
      return `Note added`;
    default:
      return log.area;
  }
}

export function reviewItemsByType(reviews: Record<string, ReviewItem>) {
  const counts = new Map<string, { tracked: number; mastered: number }>();
  for (const item of Object.values(reviews)) {
    const entry = counts.get(item.contentType) ?? { tracked: 0, mastered: 0 };
    entry.tracked += 1;
    if (item.stability >= 30) entry.mastered += 1;
    counts.set(item.contentType, entry);
  }
  return counts;
}

export function accuracyTone(value: number) {
  if (value >= 0.85) return 'success' as const;
  if (value >= 0.7) return 'warning' as const;
  return 'danger' as const;
}
