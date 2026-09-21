'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CaseAttempt, MistakeRecord, Note, ReadingAttempt, ReviewItem, ReviewRating } from '@/lib/content/schema';
import { schedule } from '@/lib/srs/fsrs';
import { clearProfile, exportProfile, loadProfile, parseImportedProfile, saveProfile } from './storage';
import {
  EMPTY_ACTIONS,
  createEmptyProfile,
  makeReviewKey,
  type ProfileState,
  type ReadingProgress,
  type Settings,
  type StudyActions,
} from './types';

/* ------------------------------------------------------------------
   Study store.

   A single reducer-shaped state object with an explicit action surface.
   Persistence is debounced and best-effort: if storage is unavailable
   the app keeps working for the session and exposes the failure.
------------------------------------------------------------------ */

type StudyContextValue = {
  state: ProfileState;
  ready: boolean;
  storageError?: string;
  actions: StudyActions;
};

const StudyContext = createContext<StudyContextValue>({
  state: createEmptyProfile(),
  ready: false,
  actions: EMPTY_ACTIONS,
});

const LOG_LIMIT = 6000;
const MISTAKE_LIMIT = 2000;

function trim<T>(items: T[], limit: number) {
  return items.length > limit ? items.slice(items.length - limit) : items;
}

/** Day buckets are local-calendar days, matching how a learner thinks about a streak. */
function localDayKey(now: Date) {
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}-${`${now.getDate()}`.padStart(2, '0')}`;
}

function touchDay(state: ProfileState, now: Date, patch: Partial<ProfileState['dayStats'][string]>) {
  const local = localDayKey(now);
  const current = state.dayStats[local] ?? {
    reviews: 0,
    newItems: 0,
    readingSeconds: 0,
    cases: 0,
    notes: 0,
    medical: 0,
  };
  return {
    ...state.dayStats,
    [local]: {
      reviews: current.reviews + (patch.reviews ?? 0),
      newItems: current.newItems + (patch.newItems ?? 0),
      readingSeconds: current.readingSeconds + (patch.readingSeconds ?? 0),
      cases: current.cases + (patch.cases ?? 0),
      notes: current.notes + (patch.notes ?? 0),
      medical: current.medical + (patch.medical ?? 0),
    },
  };
}

export function StudyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProfileState>(() => createEmptyProfile());
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState<string | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load once on mount. Server rendering always uses the empty profile,
  // so components must gate on `ready` before showing personal numbers.
  useEffect(() => {
    const { state: loaded, recovered } = loadProfile();
    setState(loaded);
    setReady(true);
    if (recovered) setStorageError('Stored progress could not be read, so a fresh profile was started.');
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const result = saveProfile(state);
      setStorageError(result.ok ? undefined : 'Progress could not be saved in this browser.');
    }, 350);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, ready]);

  const actions = useMemo<StudyActions>(() => {
    return {
      rate: (key, rating, card) => {
        let updated: ReviewItem | undefined;
        const now = new Date();
        setState((current) => {
          const existing = current.reviews[key];
          const base: ReviewItem =
            existing ??
            ({
              id: key,
              contentId: card?.contentId ?? key.split(':').slice(1).join(':'),
              contentType: card?.contentType ?? 'vocabulary',
              due: now.toISOString(),
              stability: 0,
              difficulty: 0,
              reps: 0,
              lapses: 0,
              state: 'new',
              createdAt: now.toISOString(),
            } satisfies ReviewItem);

          const result = schedule(base, rating, now);
          updated = {
            ...base,
            due: result.due,
            stability: result.stability,
            difficulty: result.difficulty,
            state: result.state,
            reps: result.reps,
            lapses: result.lapses,
            lastRating: result.lastRating,
            lastReviewedAt: result.lastReviewedAt,
          };

          const wasNew = base.state === 'new';
          const medical = ['medical-term', 'clinical-phrase', 'disease', 'symptom'].includes(base.contentType);
          const nextDayStats = touchDay(current, now, {
            reviews: 1,
            newItems: wasNew ? 1 : 0,
            medical: medical ? 1 : 0,
          });

          return {
            ...current,
            reviews: { ...current.reviews, [key]: updated },
            logs: trim(
              [
                ...current.logs,
                {
                  id: `${key}-${now.getTime()}`,
                  at: now.toISOString(),
                  kind: 'review' as const,
                  area: `${base.contentType}:${rating}`,
                  amount: 1,
                },
              ],
              LOG_LIMIT,
            ),
            dayStats: nextDayStats,
          };
        });
        return updated;
      },

      addToReview: ({ contentType, contentId, now = new Date() }) => {
        const key = makeReviewKey(contentType, contentId);
        setState((current) => {
          if (current.reviews[key]) return current;
          const item: ReviewItem = {
            id: key,
            contentId,
            contentType,
            due: now.toISOString(),
            stability: 0,
            difficulty: 0,
            reps: 0,
            lapses: 0,
            state: 'new',
            createdAt: now.toISOString(),
          };
          return { ...current, reviews: { ...current.reviews, [key]: item } };
        });
      },

      addManyToReview: (inputs) => {
        const now = new Date();
        setState((current) => {
          const next = { ...current.reviews };
          for (const input of inputs) {
            const key = makeReviewKey(input.contentType, input.contentId);
            if (next[key]) continue;
            next[key] = {
              id: key,
              contentId: input.contentId,
              contentType: input.contentType,
              due: (input.now ?? now).toISOString(),
              stability: 0,
              difficulty: 0,
              reps: 0,
              lapses: 0,
              state: 'new',
              createdAt: (input.now ?? now).toISOString(),
            };
          }
          return { ...current, reviews: next };
        });
      },

      removeFromReview: (key) =>
        setState((current) => {
          const next = { ...current.reviews };
          delete next[key];
          return { ...current, reviews: next };
        }),

      suspend: (key, suspended) =>
        setState((current) => {
          const item = current.reviews[key];
          if (!item) return current;
          return { ...current, reviews: { ...current.reviews, [key]: { ...item, suspended } } };
        }),

      toggleBookmark: (key) =>
        setState((current) => ({
          ...current,
          bookmarks: current.bookmarks.includes(key)
            ? current.bookmarks.filter((b) => b !== key)
            : [key, ...current.bookmarks],
        })),

      saveNote: (note) => {
        const now = new Date().toISOString();
        const saved: Note = {
          id: note.id ?? `note-${Date.now().toString(36)}`,
          kind: note.kind ?? 'custom',
          title: note.title,
          body: note.body ?? '',
          tags: note.tags ?? [],
          links: note.links ?? [],
          favorite: note.favorite ?? false,
          createdAt: note.createdAt ?? now,
          updatedAt: now,
        };
        setState((current) => {
          const exists = current.notes.some((n) => n.id === saved.id);
          const notes = exists ? current.notes.map((n) => (n.id === saved.id ? saved : n)) : [saved, ...current.notes];
          return {
            ...current,
            notes,
            dayStats: exists ? current.dayStats : touchDay(current, new Date(), { notes: 1 }),
          };
        });
        return saved;
      },

      deleteNote: (id) =>
        setState((current) => ({ ...current, notes: current.notes.filter((n) => n.id !== id) })),

      recordMistake: (mistake) => {
        const now = new Date();
        setState((current) => {
          const record: MistakeRecord = {
            id: mistake.id ?? `mis-${now.getTime().toString(36)}-${Math.floor(Math.random() * 1e4).toString(36)}`,
            contentId: mistake.contentId,
            contentType: mistake.contentType,
            category: mistake.category,
            note: mistake.note,
            questionId: mistake.questionId,
            passageId: mistake.passageId,
            createdAt: mistake.createdAt ?? now.toISOString(),
            resolved: false,
          };
          return { ...current, mistakes: trim([...current.mistakes, record], MISTAKE_LIMIT) };
        });
      },

      resolveMistake: (id) =>
        setState((current) => ({
          ...current,
          mistakes: current.mistakes.map((m) => (m.id === id ? { ...m, resolved: true } : m)),
        })),

      clearMistakes: () => setState((current) => ({ ...current, mistakes: [] })),

      recordReadingAttempt: (attempt: ReadingAttempt) => {
        const now = new Date();
        setState((current) => ({
          ...current,
          attempts: trim([...current.attempts, attempt], 500),
          logs: trim(
            [
              ...current.logs,
              {
                id: `reading-${attempt.id}`,
                at: now.toISOString(),
                kind: 'reading' as const,
                area: attempt.passageId,
                amount: attempt.total,
              },
            ],
            LOG_LIMIT,
          ),
          dayStats: touchDay(current, now, { readingSeconds: attempt.secondsSpent }),
        }));
      },

      recordCaseAttempt: (attempt: CaseAttempt) => {
        const now = new Date();
        setState((current) => ({
          ...current,
          caseAttempts: trim([...current.caseAttempts, attempt], 500),
          logs: trim(
            [
              ...current.logs,
              { id: `case-${attempt.id}`, at: now.toISOString(), kind: 'case' as const, area: attempt.caseId, amount: 1 },
            ],
            LOG_LIMIT,
          ),
          dayStats: touchDay(current, now, { cases: 1, medical: 1 }),
        }));
      },

      setReadingProgress: (progress: ReadingProgress) =>
        setState((current) => ({
          ...current,
          readingProgress: { ...current.readingProgress, [progress.passageId]: progress },
        })),

      clearReadingProgress: (passageId) =>
        setState((current) => {
          const next = { ...current.readingProgress };
          delete next[passageId];
          return { ...current, readingProgress: next };
        }),

      setReadingMarks: (passageId, marks) =>
        setState((current) => ({
          ...current,
          readingMarks: { ...current.readingMarks, [passageId]: marks },
        })),

      updateSettings: (patch: Partial<Settings>) =>
        setState((current) => ({ ...current, settings: { ...current.settings, ...patch } })),

      importProfile: (json) => {
        const { state: imported, error } = parseImportedProfile(json);
        if (!imported) return { ok: false, error };
        setState(imported);
        return { ok: true };
      },

      resetProfile: () => {
        clearProfile();
        setState(createEmptyProfile());
      },
    };
  }, []);

  const value = useMemo<StudyContextValue>(() => ({ state, ready, storageError, actions }), [state, ready, storageError, actions]);

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}

export function useStudy() {
  return useContext(StudyContext);
}

/** Persisted profile as a formatted JSON string, for the export button. */
export function useExportProfile() {
  const { state } = useStudy();
  return useCallback(() => exportProfile(state), [state]);
}
