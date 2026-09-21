import { DISEASES, GRAMMAR, MEDICAL_TERMS, PHRASES, SYMPTOMS, VOCABULARY } from './index';
import { buildFuriganaDictionary } from './furigana';

/* ------------------------------------------------------------------
   Reading aids.

   The reading workspace needs, for one passage only: a furigana
   dictionary, a click-to-look-up glossary, and the list of logical
   connectors worth underlining. All three are derived from the content
   database and trimmed to the passage, so the payload stays small.
------------------------------------------------------------------ */

export type GlossaryEntry = {
  surface: string;
  kana?: string;
  en: string;
  idn?: string;
  type: 'vocabulary' | 'medical-term' | 'grammar';
  /** Content id, so the word can be added to the review queue from the passage. */
  contentId: string;
  url: string;
  tags: string[];
};

export type ReadingAids = {
  furigana: Record<string, string>;
  glossary: Record<string, GlossaryEntry>;
  /** Discourse markers found in this passage, for connector highlighting. */
  connectors: string[];
};

const CONNECTOR_TAGS = new Set(['connective', 'stance', 'trap-word']);

export function buildGlossary(): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  const seen = new Set<string>();

  for (const word of VOCABULARY) {
    if (!word.kana) continue;
    seen.add(word.japanese);
    entries.push({
      surface: word.japanese,
      kana: word.kana,
      en: word.meaningsEn.join('; '),
      idn: word.meaningsId.join('; '),
      type: 'vocabulary',
      contentId: word.id,
      url: `/vocabulary/${encodeURIComponent(word.id)}`,
      tags: word.tags,
    });
  }
  for (const term of MEDICAL_TERMS) {
    if (seen.has(term.japanese)) continue;
    seen.add(term.japanese);
    entries.push({
      surface: term.japanese,
      kana: term.kana,
      en: term.english,
      idn: term.indonesian,
      type: 'medical-term',
      contentId: term.id,
      url: `/medical/terms/${encodeURIComponent(term.id)}`,
      tags: term.tags,
    });
  }
  for (const symptom of SYMPTOMS) {
    if (seen.has(symptom.japanese)) continue;
    seen.add(symptom.japanese);
    entries.push({
      surface: symptom.japanese,
      kana: symptom.kana,
      en: symptom.english,
      idn: symptom.indonesian,
      type: 'medical-term',
      contentId: symptom.id,
      url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
      tags: [],
    });
  }
  for (const disease of DISEASES) {
    if (seen.has(disease.japanese)) continue;
    seen.add(disease.japanese);
    entries.push({
      surface: disease.japanese,
      kana: disease.kana,
      en: disease.english,
      idn: disease.indonesian,
      type: 'medical-term',
      contentId: disease.id,
      url: `/medical/diseases/${encodeURIComponent(disease.id)}`,
      tags: [],
    });
  }
  for (const entry of GRAMMAR) {
    if (seen.has(entry.pattern)) continue;
    seen.add(entry.pattern);
    entries.push({
      surface: entry.pattern,
      kana: entry.kana,
      en: entry.meaning,
      idn: entry.meaningsId,
      type: 'grammar',
      contentId: entry.id,
      url: `/grammar/${entry.id}`,
      tags: [],
    });
  }
  for (const phrase of PHRASES) {
    if (phrase.japanese.length > 24 || seen.has(phrase.japanese)) continue;
    seen.add(phrase.japanese);
    entries.push({
      surface: phrase.japanese,
      kana: phrase.kana,
      en: phrase.english,
      idn: phrase.indonesian,
      type: 'medical-term',
      contentId: phrase.id,
      url: `/medical/phrases?p=${phrase.id}`,
      tags: phrase.specialtyTags,
    });
  }

  return entries;
}

let cachedGlossary: GlossaryEntry[] | null = null;

function glossarySource() {
  if (!cachedGlossary) cachedGlossary = buildGlossary();
  return cachedGlossary;
}

/** Trims the dictionary and glossary to the surfaces actually in the text. */
export function aidsForText(text: string): ReadingAids {
  const furigana: Record<string, string> = {};
  const glossary: Record<string, GlossaryEntry> = {};
  const connectors: string[] = [];

  for (const [surface, reading] of Object.entries(buildFuriganaDictionary())) {
    if (text.includes(surface)) furigana[surface] = reading;
  }

  for (const entry of glossarySource()) {
    if (!text.includes(entry.surface)) continue;
    glossary[entry.surface] = entry;
    if (entry.tags.some((tag) => CONNECTOR_TAGS.has(tag)) && entry.surface.length <= 6) {
      connectors.push(entry.surface);
    }
  }

  return { furigana, glossary, connectors };
}
