import type { CaseAttempt, MistakeRecord, Note, ReadingAttempt, ReviewItem, ReviewRating, StudyLogEntry } from '@/lib/content/schema';

/* ------------------------------------------------------------------
   Personal study state.

   The app is a single-user, local-first tool: progress lives in the
   browser, keyed by content id, and is exportable as JSON. No account,
   no server copy of the learner's history.
------------------------------------------------------------------ */

export const PROFILE_VERSION = 3;
export const PROFILE_STORAGE_KEY = 'jmed.profile.v3';

export type ThemePreference = 'light' | 'dark' | 'system';
export type AccentPreference = 'teal' | 'ai' | 'shu' | 'sumi';
export type FuriganaMode = 'hidden' | 'hover' | 'always';
export type MedicalFuriganaMode = 'always' | 'difficult' | 'off';
export type MedicalRomajiMode = 'always' | 'hover' | 'off';
export type ReadingFont = 'sans' | 'serif';

export type Settings = {
  theme: ThemePreference;
  accent: AccentPreference;
  furigana: FuriganaMode;
  /** Reading surface, adjustable without touching the design system. */
  readingSize: number;
  readingLeading: number;
  readingWidthRem: number;
  readingFont: ReadingFont;
  /** Romaji is off by default: the learner reads kana directly. */
  showRomaji: boolean;
  medicalDisplay: {
    furigana: MedicalFuriganaMode;
    romaji: MedicalRomajiMode;
    english: boolean;
    indonesian: boolean;
  };
  /** New cards introduced per day, in addition to due reviews. */
  newPerDay: number;
  /** Reviews the learner considers a complete day. */
  dailyReviewGoal: number;
  /** Target study minutes per day, used by the dashboard ring. */
  dailyMinutesGoal: number;
  /** Cards per session before the summary screen appears. */
  sessionLimit: number;
  /** Show patient-friendly wording before the technical term. */
  patientFriendlyFirst: boolean;
  timerEnabled: boolean;
  /** Hide the sidebar labels and shrink the rail. */
  compactSidebar: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  accent: 'teal',
  furigana: 'hover',
  readingSize: 18,
  readingLeading: 1.95,
  readingWidthRem: 34,
  readingFont: 'sans',
  showRomaji: false,
  medicalDisplay: { furigana: 'always', romaji: 'always', english: false, indonesian: true },
  newPerDay: 12,
  dailyReviewGoal: 60,
  dailyMinutesGoal: 40,
  sessionLimit: 40,
  patientFriendlyFirst: false,
  timerEnabled: true,
  compactSidebar: false,
};

export type DayStats = {
  reviews: number;
  newItems: number;
  readingSeconds: number;
  cases: number;
  notes: number;
  medical: number;
};

export const EMPTY_DAY: DayStats = {
  reviews: 0,
  newItems: 0,
  readingSeconds: 0,
  cases: 0,
  notes: 0,
  medical: 0,
};

export type ReadingProgress = {
  passageId: string;
  answers: Record<string, number>;
  secondsSpent: number;
  updatedAt: string;
};

export type ProfileState = {
  version: number;
  /** ISO date (YYYY-MM-DD) the profile was created, used for streaks. */
  startedAt: string;
  settings: Settings;
  /** Keyed by `${contentType}:${contentId}` so duplicates are impossible. */
  reviews: Record<string, ReviewItem>;
  logs: StudyLogEntry[];
  mistakes: MistakeRecord[];
  notes: Note[];
  attempts: ReadingAttempt[];
  caseAttempts: CaseAttempt[];
  /** In-progress reading answers, preserved when navigating away. */
  readingProgress: Record<string, ReadingProgress>;
  /** Highlighted passages words / jotted vocabulary, by passage id. */
  readingMarks: Record<string, string[]>;
  bookmarks: string[];
  dayStats: Record<string, DayStats>;
};

export function makeReviewKey(contentType: string, contentId: string) {
  return `${contentType}:${contentId}`;
}

export function createEmptyProfile(now: Date = new Date()): ProfileState {
  return {
    version: PROFILE_VERSION,
    startedAt: now.toISOString().slice(0, 10),
    settings: { ...DEFAULT_SETTINGS },
    reviews: {},
    logs: [],
    mistakes: [],
    notes: [],
    attempts: [],
    caseAttempts: [],
    readingProgress: {},
    readingMarks: {},
    bookmarks: [],
    dayStats: {},
  };
}

export type NewReviewInput = {
  contentType: ReviewItem['contentType'];
  contentId: string;
  now?: Date;
  dueImmediately?: boolean;
};

export type StudyActions = {
  /**
   * Applies a rating. `card` is supplied when the item may not be tracked
   * yet (a new card shown for the first time), so the item is created and
   * rated in one step rather than left dangling in the queue.
   */
  rate: (
    key: string,
    rating: ReviewRating,
    card?: { contentType: ReviewItem['contentType']; contentId: string },
  ) => ReviewItem | undefined;
  addToReview: (input: NewReviewInput) => void;
  addManyToReview: (inputs: NewReviewInput[]) => void;
  removeFromReview: (key: string) => void;
  suspend: (key: string, suspended: boolean) => void;
  toggleBookmark: (key: string) => void;
  saveNote: (note: Partial<Note> & { title: string }) => Note;
  deleteNote: (id: string) => void;
  recordMistake: (mistake: Omit<MistakeRecord, 'id' | 'createdAt'> & { createdAt?: string; id?: string }) => void;
  resolveMistake: (id: string) => void;
  clearMistakes: () => void;
  recordReadingAttempt: (attempt: ReadingAttempt) => void;
  recordCaseAttempt: (attempt: CaseAttempt) => void;
  setReadingProgress: (progress: ReadingProgress) => void;
  clearReadingProgress: (passageId: string) => void;
  setReadingMarks: (passageId: string, marks: string[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  importProfile: (json: string) => { ok: boolean; error?: string };
  resetProfile: () => void;
};

export const EMPTY_ACTIONS: StudyActions = {
  rate: () => undefined,
  addToReview: () => {},
  addManyToReview: () => {},
  removeFromReview: () => {},
  suspend: () => {},
  toggleBookmark: () => {},
  saveNote: () => ({ id: '', kind: 'custom', title: '', body: '', tags: [], links: [], favorite: false, createdAt: '', updatedAt: '' }),
  deleteNote: () => {},
  recordMistake: () => {},
  resolveMistake: () => {},
  clearMistakes: () => {},
  recordReadingAttempt: () => {},
  recordCaseAttempt: () => {},
  setReadingProgress: () => {},
  clearReadingProgress: () => {},
  setReadingMarks: () => {},
  updateSettings: () => {},
  importProfile: () => ({ ok: false, error: 'unavailable' }),
  resetProfile: () => {},
};
