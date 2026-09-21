import { PROFILE_STORAGE_KEY, PROFILE_VERSION, createEmptyProfile, type ProfileState } from './types';

/* ------------------------------------------------------------------
   Local persistence.

   A single JSON document in localStorage. Writes are debounced by the
   provider, and any malformed or future-versioned document is discarded
   rather than partially applied, so progress data is never corrupted by
   a bad parse.
------------------------------------------------------------------ */

export function loadProfile(): { state: ProfileState; recovered: boolean } {
  if (typeof window === 'undefined') return { state: createEmptyProfile(), recovered: false };

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return { state: createEmptyProfile(), recovered: false };

    const parsed = JSON.parse(raw) as Partial<ProfileState>;
    if (!parsed || typeof parsed !== 'object') return { state: createEmptyProfile(), recovered: true };
    if (parsed.version !== PROFILE_VERSION) {
      // Versions are intentionally not auto-migrated: a clean start is
      // safer than guessing at a learner's spaced-repetition history.
      return { state: createEmptyProfile(), recovered: true };
    }

    const base = createEmptyProfile();
    return {
      state: {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings ?? {}), medicalDisplay: { ...base.settings.medicalDisplay, ...(parsed.settings?.medicalDisplay ?? {}) } },
        reviews: parsed.reviews ?? {},
        logs: parsed.logs ?? [],
        mistakes: parsed.mistakes ?? [],
        notes: parsed.notes ?? [],
        attempts: parsed.attempts ?? [],
        caseAttempts: parsed.caseAttempts ?? [],
        readingProgress: parsed.readingProgress ?? {},
        readingMarks: parsed.readingMarks ?? {},
        bookmarks: parsed.bookmarks ?? [],
        dayStats: parsed.dayStats ?? {},
      },
      recovered: false,
    };
  } catch {
    return { state: createEmptyProfile(), recovered: true };
  }
}

export function saveProfile(state: ProfileState): { ok: boolean; error?: string } {
  if (typeof window === 'undefined') return { ok: false, error: 'no window' };
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state));
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'storage error' };
  }
}

export function clearProfile() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PROFILE_STORAGE_KEY);
}

export function exportProfile(state: ProfileState) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

export function parseImportedProfile(json: string): { state?: ProfileState; error?: string } {
  try {
    const parsed = JSON.parse(json) as Partial<ProfileState>;
    if (!parsed || typeof parsed !== 'object') return { error: 'The file does not contain a profile object.' };
    if (!parsed.reviews || typeof parsed.reviews !== 'object') {
      return { error: 'The file is missing a review history, so it is probably not a J-Med Mastery export.' };
    }
    const base = createEmptyProfile();
    return {
      state: {
        ...base,
        ...parsed,
        version: PROFILE_VERSION,
        settings: { ...base.settings, ...(parsed.settings ?? {}), medicalDisplay: { ...base.settings.medicalDisplay, ...(parsed.settings?.medicalDisplay ?? {}) } },
      },
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'The file could not be parsed as JSON.' };
  }
}
