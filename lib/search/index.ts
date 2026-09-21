import {
  CASES,
  DISEASES,
  GRAMMAR,
  MEDICAL_TERMS,
  MEDICATIONS,
  INVESTIGATIONS,
  PHRASES,
  READINGS,
  SYMPTOMS,
  VOCABULARY,
} from '@/lib/content';
import { kanaToRomaji } from '@/lib/utils/romaji';

/* ------------------------------------------------------------------
   Global search (PRD §8, AGENTS §6).

   The index is built on the server and shipped once to the client the
   first time the command palette opens. Scoring runs entirely in memory,
   so results appear on the first keystroke with no request per query.
------------------------------------------------------------------ */

export type SearchType =
  | 'vocabulary'
  | 'grammar'
  | 'medical-term'
  | 'clinical-phrase'
  | 'disease'
  | 'symptom'
  | 'medication'
  | 'investigation'
  | 'reading'
  | 'case'
  | 'stage';

export type SearchDoc = {
  id: string;
  type: SearchType;
  /** Japanese surface form, or the English title when there is none. */
  ja: string;
  kana?: string;
  romaji?: string;
  en: string;
  idn?: string;
  /** Secondary context: a meaning, a register, an intent, a specialty. */
  context?: string;
  /** Register / category / level badge. */
  badge?: string;
  /** Extra searchable text that should not be displayed (notes, tags). */
  hidden?: string;
  url: string;
};

const KATAKANA_TO_HIRAGANA_OFFSET = 0x60;

/** Folds katakana to hiragana and normalises width so kana queries match. */
function foldKana(input: string) {
  const normalised = input.normalize('NFKC').toLowerCase();
  let out = '';
  for (const ch of normalised) {
    const code = ch.codePointAt(0) ?? 0;
    out += code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - KATAKANA_TO_HIRAGANA_OFFSET) : ch;
  }
  return out;
}

function trimmed(value: string | undefined, max = 160) {
  if (!value) return undefined;
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function buildSearchIndex(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const word of VOCABULARY) {
    docs.push({
      id: word.id,
      type: 'vocabulary',
      ja: word.japanese,
      kana: word.kana,
      romaji: word.kana ? kanaToRomaji(word.kana) : undefined,
      en: word.meaningsEn.join('; '),
      idn: word.meaningsId.join('; '),
      context: trimmed(word.definitionJa),
      badge: word.jlptLevel,
      hidden: [...word.tags, ...(word.synonyms ?? []), ...(word.antonyms ?? []), ...word.examples.map((e) => e.ja)].join(' '),
      url: `/vocabulary/${encodeURIComponent(word.id)}`,
    });
  }

  for (const entry of GRAMMAR) {
    docs.push({
      id: entry.id,
      type: 'grammar',
      ja: entry.pattern,
      kana: entry.kana,
      en: entry.meaning,
      idn: entry.meaningsId,
      context: trimmed(entry.nuance, 200),
      badge: entry.jlptLevel,
      hidden: [entry.formation, entry.family, ...entry.register, ...entry.examples.map((e) => e.ja)].join(' '),
      url: `/grammar/${entry.id}`,
    });
  }

  for (const term of MEDICAL_TERMS) {
    docs.push({
      id: term.id,
      type: 'medical-term',
      ja: term.japanese,
      kana: term.kana,
      romaji: term.romaji,
      en: term.english,
      idn: term.indonesian,
      context: trimmed(term.patientFriendlySupport?.indonesian ?? term.patientFriendly ?? term.definitionJa, 160),
      badge: term.category,
      hidden: [
        ...term.alternativeNames,
        ...term.specialties,
        ...term.tags,
        term.patientFriendly ?? '',
        term.patientFriendlySupport?.kana ?? '',
        term.patientFriendlySupport?.romaji ?? '',
        term.patientFriendlySupport?.indonesian ?? '',
        term.patientFriendlySupport?.english ?? '',
        term.patientExpression ?? '',
        term.patientExpressionSupport?.kana ?? '',
        term.patientExpressionSupport?.romaji ?? '',
        term.patientExpressionSupport?.indonesian ?? '',
        term.patientExpressionSupport?.english ?? '',
        term.example?.japanese ?? '',
        term.example?.kana ?? '',
        term.example?.romaji ?? '',
        term.example?.indonesian ?? '',
        term.example?.english ?? '',
        term.usageNote ?? '',
      ].join(' '),
      url: `/medical/terms/${encodeURIComponent(term.id)}`,
    });
  }

  for (const phrase of PHRASES) {
    docs.push({
      id: phrase.id,
      type: 'clinical-phrase',
      ja: phrase.japanese,
      kana: phrase.kana,
      romaji: phrase.romaji,
      en: phrase.english,
      idn: phrase.indonesian,
      context: trimmed(`${phrase.intent} · ${phrase.clinicalContext}`, 160),
      badge: phrase.stage,
      hidden: [phrase.register, phrase.speaker, phrase.nuance ?? '', ...phrase.variants, ...phrase.alternativeExpressions, ...phrase.specialtyTags, ...phrase.relatedDiseaseIds, phrase.intent].join(' '),
      url: `/medical/phrases?stage=${phrase.stage}&p=${phrase.id}`,
    });
  }

  for (const medication of MEDICATIONS) {
    docs.push({
      id: medication.id,
      type: 'medication',
      ja: medication.japanese,
      kana: medication.kana,
      romaji: medication.romaji,
      en: medication.english,
      idn: medication.indonesianGeneric,
      context: medication.drugClassJapanese,
      badge: 'drug',
      hidden: [medication.katakana, medication.drugClassJapanese, ...medication.aliases, ...medication.indicationTerms, ...medication.relatedDiseases].join(' '),
      url: `/medical/medications/${encodeURIComponent(medication.id)}`,
    });
  }

  for (const investigation of INVESTIGATIONS) {
    docs.push({
      id: investigation.id,
      type: 'investigation',
      ja: investigation.japanese,
      kana: investigation.kana,
      romaji: investigation.romaji,
      en: investigation.english,
      idn: investigation.indonesian,
      context: investigation.category,
      badge: investigation.category,
      hidden: [...investigation.specialties, ...investigation.relatedDiseases, ...investigation.relatedTerms].join(' '),
      url: `/medical/investigations/${encodeURIComponent(investigation.id)}`,
    });
  }

  for (const disease of DISEASES) {
    docs.push({
      id: disease.id,
      type: 'disease',
      ja: disease.japanese,
      kana: disease.kana,
      romaji: disease.romaji,
      en: disease.english,
      idn: disease.indonesian,
      context: trimmed(disease.patientExplanation, 200),
      badge: disease.specialties[0],
      hidden: [disease.layJapanese ?? '', ...disease.specialties, ...disease.keySymptoms].join(' '),
      url: `/medical/diseases/${encodeURIComponent(disease.id)}`,
    });
  }

  for (const symptom of SYMPTOMS) {
    docs.push({
      id: symptom.id,
      type: 'symptom',
      ja: symptom.japanese,
      kana: symptom.kana,
      romaji: symptom.romaji,
      en: symptom.english,
      idn: symptom.indonesian,
      context: trimmed(symptom.doctorQuestions[0], 120),
      badge: 'symptom',
      hidden: [...symptom.patientExpressions, ...symptom.descriptors].join(' '),
      url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
    });
  }

  for (const passage of READINGS) {
    docs.push({
      id: passage.id,
      type: 'reading',
      ja: passage.title,
      en: passage.titleEn ?? passage.topic,
      context: `${passage.characterCount}字 / ${passage.estimatedMinutes}分`,
      badge: passage.level,
      hidden: [passage.topic, passage.category].join(' '),
      url: `/reading/${passage.id}`,
    });
  }

  for (const item of CASES) {
    docs.push({
      id: item.id,
      type: 'case',
      ja: item.titleJa,
      en: item.title,
      context: item.chiefComplaint,
      badge: item.difficulty,
      hidden: [item.setting, item.specialty, ...item.teachingPoints].join(' '),
      url: `/cases/${item.id}`,
    });
  }

  return docs;
}

export type SearchHit = SearchDoc & { score: number; matched: 'ja' | 'kana' | 'romaji' | 'en' | 'idn' | 'intent' | 'body' };

function subsequence(haystack: string, needle: string) {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return false;
}

export function searchDocs(docs: readonly SearchDoc[], rawQuery: string, limit = 24): SearchHit[] {
  const query = rawQuery.trim();
  if (query.length === 0) return [];

  const folded = foldKana(query);
  const lower = query.toLowerCase();
  const romajiQuery = kanaToRomaji(query);
  const hits: SearchHit[] = [];

  for (const doc of docs) {
    const ja = foldKana(doc.ja);
    const kana = doc.kana ? foldKana(doc.kana) : '';
    const en = doc.en.toLowerCase();
    const idn = (doc.idn ?? '').toLowerCase();
    const context = (doc.context ?? '').toLowerCase();
    const hidden = (doc.hidden ?? '').toLowerCase();

    let score = 0;
    let matched: SearchHit['matched'] = 'body';

    if (doc.ja === query || ja === folded) {
      score = 1200;
      matched = 'ja';
    } else if (ja.startsWith(folded) && folded.length >= 1) {
      score = 900;
      matched = 'ja';
    } else if (ja.includes(folded)) {
      score = 720;
      matched = 'ja';
    } else if (kana.length > 0 && folded === kana) {
      score = 1100;
      matched = 'kana';
    } else if (kana.length > 0 && (kana.startsWith(folded) || kana.includes(folded))) {
      score = 640;
      matched = 'kana';
    } else if (romajiQuery.length >= 3 && doc.romaji === romajiQuery) {
      score = 800;
      matched = 'romaji';
    } else if (romajiQuery.length >= 3 && doc.romaji && doc.romaji.startsWith(romajiQuery)) {
      score = 560;
      matched = 'romaji';
    } else if (en === lower) {
      score = 1000;
      matched = 'en';
    } else if (en.startsWith(lower) || en.split(/[;,\s/]+/).some((word) => word === lower)) {
      score = 760;
      matched = 'en';
    } else if (lower.length >= 3 && en.includes(lower)) {
      score = 520;
      matched = 'en';
    } else if (lower.length >= 3 && idn.includes(lower)) {
      score = 500;
      matched = 'idn';
    } else if (lower.length >= 3 && idn.split(/\s+/).some((word) => word.startsWith(lower))) {
      score = 540;
      matched = 'idn';
    } else if (lower.length >= 4 && context.includes(lower)) {
      score = 300;
      matched = 'intent';
    } else if (lower.length >= 4 && hidden.includes(lower)) {
      score = 220;
      matched = 'body';
    } else if (lower.length >= 3 && subsequence(en, lower)) {
      score = 120;
      matched = 'en';
    } else {
      continue;
    }

    // Short items are more likely to be what the learner meant.
    if (doc.ja.length <= 4) score += 40;
    if (doc.type === 'disease' || doc.type === 'symptom') score += 20;
    hits.push({ ...doc, score, matched });
  }

  hits.sort((a, b) => b.score - a.score || a.ja.length - b.ja.length);
  return hits.slice(0, limit);
}

/** Grouped results for the command palette. */
export function groupHits(hits: readonly SearchHit[]) {
  const groups = new Map<SearchType, SearchHit[]>();
  for (const hit of hits) {
    const list = groups.get(hit.type) ?? [];
    list.push(hit);
    groups.set(hit.type, list);
  }
  return [...groups.entries()].map(([type, items]) => ({ type, items }));
}
