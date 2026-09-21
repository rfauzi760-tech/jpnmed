import {
  DISEASES,
  MEDICAL_TERMS,
  PHRASES,
  SYMPTOMS,
  resolveTermRefs,
} from './index';
import { PHRASE_STAGES, REGISTER_LABELS } from './taxonomy';
import type { MedicalRegisterSupport } from './schema';

/* ------------------------------------------------------------------
   Quick Clinical Mode index (PRD §9, UX_UI §9).

   One flat, pre-computed array: every symptom, disease, term and
   encounter stage reduced to the handful of lines a clinician needs
   mid-consultation. Everything is computed on the server so the client
   only scores strings — the panel appears on the first keystroke.
------------------------------------------------------------------ */

export type QuickRef = { ja: string; en: string; url?: string };

export type QuickEntry = {
  id: string;
  kind: 'symptom' | 'disease' | 'term' | 'stage';
  ja: string;
  kana?: string;
  en: string;
  idn: string;
  url: string;
  severity?: 'routine' | 'urgent' | 'emergency';
  /** Pre-lowered haystack so ranking never touches the display strings. */
  search: string;
  panel: {
    patientFriendly?: string;
    patientFriendlySupport?: MedicalRegisterSupport;
    keyQuestions: string[];
    patientWording: string[];
    patientWordingSupport?: MedicalRegisterSupport[];
    relatedSymptoms: QuickRef[];
    terms: QuickRef[];
    examination: string[];
    investigations: string[];
    redFlags: string[];
    /** Paired drills: what the patient says → your response. */
    exchanges: { patient: string; doctor: string }[];
  };
};

const EXAMINATION_PHRASES = PHRASES.filter((phrase) => phrase.stage === 'examination');
const INVESTIGATION_PHRASES = PHRASES.filter((phrase) => phrase.stage === 'investigation');

function termRefs(ids: readonly string[]): QuickRef[] {
  return resolveTermRefs(ids).map((term) => ({
    ja: term.japanese,
    en: term.english,
    url: `/medical/terms/${encodeURIComponent(term.id)}`,
  }));
}

function symptomRefs(ids: readonly string[]): QuickRef[] {
  return SYMPTOMS.filter((symptom) => ids.includes(symptom.id)).map((symptom) => ({
    ja: symptom.japanese,
    en: symptom.english,
    url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
  }));
}

function haversack(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(' ').toLowerCase();
}

export function buildQuickIndex(): QuickEntry[] {
  const entries: QuickEntry[] = [];

  for (const symptom of SYMPTOMS) {
    const related = resolveTermRefs(symptom.relatedTermIds);
    const specialties = related.flatMap((term) => term.specialties);
    entries.push({
      id: `symptom:${symptom.id}`,
      kind: 'symptom',
      ja: symptom.japanese,
      kana: symptom.kana,
      en: symptom.english,
      idn: symptom.indonesian,
      url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
      search: haversack(
        symptom.japanese,
        symptom.kana,
        symptom.english,
        symptom.indonesian,
        ...symptom.patientExpressions,
        ...symptom.redFlags,
      ),
      panel: {
        patientFriendly: symptom.patientFriendlyExplanation,
        keyQuestions: [...symptom.doctorQuestions.slice(0, 6), ...symptom.associatedQuestions.slice(0, 2)],
        patientWording: symptom.patientExpressions.slice(0, 2),
        exchanges: symptom.exchanges.slice(0, 3),
        relatedSymptoms: symptomRefs(symptom.relatedSymptomIds),
        terms: termRefs(symptom.relatedTermIds).slice(0, 8),
        examination: EXAMINATION_PHRASES.filter((phrase) =>
          specialties.some((specialty) => phrase.specialtyTags.includes(specialty)),
        )
          .slice(0, 5)
          .map((phrase) => phrase.japanese),
        investigations: INVESTIGATION_PHRASES.filter((phrase) =>
          specialties.some((specialty) => phrase.specialtyTags.includes(specialty)),
        )
          .slice(0, 5)
          .map((phrase) => phrase.japanese),
        redFlags: symptom.redFlags,
      },
    });
  }

  for (const disease of DISEASES) {
    const relatedSymptoms = SYMPTOMS.filter((symptom) =>
      disease.keySymptoms.some((key) => key.includes(symptom.japanese) || symptom.japanese.includes(key)),
    ).map((symptom) => ({
      ja: symptom.japanese,
      en: symptom.english,
      url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
    }));

    entries.push({
      id: `disease:${disease.id}`,
      kind: 'disease',
      ja: disease.japanese,
      kana: disease.kana,
      en: disease.english,
      idn: disease.indonesian,
      url: `/medical/diseases/${encodeURIComponent(disease.id)}`,
      severity: disease.severity,
      search: haversack(
        disease.japanese,
        disease.kana,
        disease.english,
        disease.indonesian,
        disease.layJapanese,
        ...disease.keySymptoms,
        ...disease.relatedTerms,
      ),
      panel: {
        patientFriendly: disease.patientExplanation,
        keyQuestions: disease.historyQuestions.slice(0, 6),
        patientWording: [
          ...disease.dialogue.filter((turn) => turn.speaker === 'patient').map((turn) => turn.japanese),
          ...disease.keySymptoms,
        ].slice(0, 4),
        relatedSymptoms,
        exchanges: disease.dialogue
          .reduce<{ patient: string; doctor: string }[]>((acc, turn) => {
            const last = acc[acc.length - 1];
            if (last && last.doctor === '' && turn.speaker === 'doctor') {
              last.doctor = turn.japanese;
            } else if (turn.speaker === 'patient') {
              acc.push({ patient: turn.japanese, doctor: '' });
            }
            return acc;
          }, [])
          .filter((pair) => pair.doctor !== '')
          .slice(0, 2),
        terms: termRefs([...disease.relatedTerms, ...disease.investigations]).slice(0, 8),
        examination: disease.examinationPhrases.slice(0, 5),
        investigations: [...disease.investigations, ...disease.investigationExplanations].slice(0, 6),
        redFlags: disease.redFlagPhrases,
      },
    });
  }

  for (const term of MEDICAL_TERMS) {
    const specialtyIds = term.specialties;
    entries.push({
      id: `term:${term.id}`,
      kind: 'term',
      ja: term.japanese,
      kana: term.kana,
      en: term.english,
      idn: term.indonesian,
      url: `/medical/terms/${encodeURIComponent(term.id)}`,
      search: haversack(
        term.japanese,
        term.kana,
        term.english,
        term.indonesian,
        term.patientFriendly,
        term.patientFriendlySupport?.kana,
        term.patientFriendlySupport?.romaji,
        term.patientFriendlySupport?.indonesian,
        term.patientFriendlySupport?.english,
        term.patientExpression,
        term.patientExpressionSupport?.kana,
        term.patientExpressionSupport?.romaji,
        term.patientExpressionSupport?.indonesian,
        term.patientExpressionSupport?.english,
        ...term.alternativeNames,
      ),
      panel: {
        patientFriendly: term.patientFriendlySupport?.japanese ?? term.patientFriendly,
        patientFriendlySupport: term.patientFriendlySupport,
        keyQuestions: PHRASES.filter(
          (phrase) => phrase.relatedTermIds.includes(term.id) && ['hpi', 'chief-complaint', 'diagnosis'].includes(phrase.stage),
        )
          .slice(0, 5)
          .map((phrase) => phrase.japanese),
        patientWording: [term.patientExpressionSupport?.japanese ?? term.patientExpression].filter((value): value is string => Boolean(value)),
        patientWordingSupport: [term.patientExpressionSupport].filter((value): value is MedicalRegisterSupport => Boolean(value)),
        exchanges: [],
        relatedSymptoms: [],
        terms: termRefs(term.relatedIds).slice(0, 8),
        examination: PHRASES.filter(
          (phrase) => phrase.stage === 'examination' && phrase.relatedTermIds.includes(term.id),
        )
          .slice(0, 4)
          .map((phrase) => phrase.japanese),
        investigations:
          ['test', 'imaging', 'lab', 'procedure'].includes(term.category)
            ? INVESTIGATION_PHRASES.filter((phrase) => phrase.relatedTermIds.includes(term.id))
                .slice(0, 4)
                .map((phrase) => phrase.japanese)
            : INVESTIGATION_PHRASES.filter((phrase) => specialtyIds.some((id) => phrase.specialtyTags.includes(id)))
                .slice(0, 3)
                .map((phrase) => phrase.japanese),
        redFlags: [],
      },
    });
  }

  // Encounter stages, so a query like "how to ask about allergy" lands somewhere useful.
  for (const stage of PHRASE_STAGES) {
    const stagePhrases = PHRASES.filter((phrase) => phrase.stage === stage.id);
    if (stagePhrases.length === 0) continue;
    entries.push({
      id: `stage:${stage.id}`,
      kind: 'stage',
      ja: stage.label.ja ?? stage.label.en,
      en: `${stage.label.en} — how to ask`,
      idn: '',
      url: `/medical/phrases?stage=${stage.id}`,
      search: haversack(stage.label.en, stage.label.ja, stage.id, ...stagePhrases.map((phrase) => phrase.intent)),
      panel: {
        keyQuestions: stagePhrases.slice(0, 6).map((phrase) => phrase.japanese),
        patientWording: stagePhrases
          .filter((phrase) => phrase.register === 'patient-friendly')
          .slice(0, 4)
          .map((phrase) => phrase.japanese),
        relatedSymptoms: [],
        terms: [],
        examination: [],
        investigations: [],
        redFlags: [],
        exchanges: [],
      },
    });
  }

  return entries;
}

/**
 * Fast in-memory ranking.
 *
 * Whole-query signals (exact surface, prefix, substring) dominate. A
 * multi-word query — "how to ask about allergy", "nyeri dada hebat" —
 * is additionally scored token by token, and an entry has to match at
 * least half of the tokens to stay in the list.
 */
export function searchQuickIndex(entries: readonly QuickEntry[], rawQuery: string, limit = 8): QuickEntry[] {
  const trimmed = rawQuery.trim();
  const query = trimmed.toLowerCase();
  if (query.length === 0) return [];

  const tokens = [...new Set(query.split(/\s+/).filter((token) => token.length >= 2))];
  const requiredTokens = Math.max(1, Math.ceil(tokens.length / 2));
  const scored: { entry: QuickEntry; score: number }[] = [];

  for (const entry of entries) {
    let score = 0;
    const ja = entry.ja;
    if (ja === trimmed) score = 1000;
    else if (ja.startsWith(trimmed)) score = 820;
    else if (ja.includes(trimmed)) score = 700;
    else if (entry.kana && entry.kana.startsWith(trimmed)) score = 640;
    else if (entry.en.toLowerCase() === query) score = 900;
    else if (entry.en.toLowerCase().startsWith(query)) score = 600;
    else if (entry.search.includes(query)) score = 420;

    let tokenMatches = 0;
    if (tokens.length > 1) {
      for (const token of tokens) {
        if (!entry.search.includes(token) && !entry.en.toLowerCase().includes(token)) continue;
        tokenMatches += 1;
        score += token.length >= 5 ? 130 : token.length >= 3 ? 90 : 60;
      }
    }

    if (score === 0) continue;
    if (tokens.length > 1 && tokenMatches < requiredTokens) continue;
    if (entry.kind === 'symptom') score += 40;
    if (entry.kind === 'disease') score += 30;
    if (entry.severity === 'emergency') score += 25;
    if (ja.length <= 4) score += 15;
    scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.ja.length - b.entry.ja.length);
  return scored.slice(0, limit).map((item) => item.entry);
}

export const QUICK_STARTERS = ['胸痛', '発熱', '頭痛', '腹痛', '息切れ', '動悸', 'めまい', '咳', '吐き気', '下痢', 'アレルギー', '同意'];

export const QUICK_KIND_LABELS: Record<QuickEntry['kind'], string> = {
  symptom: 'Symptom',
  disease: 'Disease',
  term: 'Term',
  stage: 'Encounter stage',
};

export const REGISTER_LABELS_FOR_QUICK = REGISTER_LABELS;
