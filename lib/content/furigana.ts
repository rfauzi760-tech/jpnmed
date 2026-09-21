import { COMMON_FURIGANA } from './furigana-common';
import { DISEASES, GRAMMAR, MEDICAL_TERMS, PHRASES, SYMPTOMS, VOCABULARY } from './index';

/* ------------------------------------------------------------------
   Furigana dictionary.

   Readings come from the content database itself, so a passage gets
   ruby annotations without hand-marking every kanji. Longest-match wins
   (handled by autoFuriganaTokens), and a surface form is only eligible
   when it actually contains kanji.
------------------------------------------------------------------ */

const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff々]/;

type Dictionary = Record<string, string>;

let cached: Dictionary | null = null;

export function buildFuriganaDictionary(maxLength = 8): Dictionary {
  const dictionary: Dictionary = {};

  const add = (surface: string | undefined, reading: string | undefined) => {
    if (!surface || !reading) return;
    if (surface.length > maxLength) return;
    if (!KANJI.test(surface)) return;
    if (dictionary[surface]) return;
    dictionary[surface] = reading;
  };

  // Vocabulary and terminology first: they cover most running text.
  for (const word of VOCABULARY) add(word.japanese, word.kana);
  for (const term of MEDICAL_TERMS) add(term.japanese, term.kana);
  for (const symptom of SYMPTOMS) add(symptom.japanese, symptom.kana);
  for (const disease of DISEASES) add(disease.japanese, disease.kana);
  for (const entry of GRAMMAR) add(entry.pattern, entry.kana);
  // Short clinical phrases (挨拶, 主訴 wording) also resolve.
  for (const phrase of PHRASES) add(phrase.japanese, phrase.kana);
  // Curated common-word base layer goes in last: content-database entries
  // above always win because `add` keeps the first reading it sees.
  for (const [surface, reading] of Object.entries(COMMON_FURIGANA)) add(surface, reading);

  return dictionary;
}

export function furiganaDictionary(): Dictionary {
  if (!cached) cached = buildFuriganaDictionary();
  return cached;
}
