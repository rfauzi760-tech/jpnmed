import { CASES, DISEASES, GRAMMAR, MEDICAL_TERMS, PHRASES, READINGS, SYMPTOMS, VOCABULARY } from './index';

/* ------------------------------------------------------------------
   Link index.

   Personal data (notes, bookmarks, highlights) references content by
   key (`vocabulary:voc-keikou`). This index is the only thing the client
   needs to turn those keys back into labels and URLs, so the notebook
   never has to import the content database.
------------------------------------------------------------------ */

export type LinkTarget = {
  label: string;
  sub?: string;
  url: string;
  contentType: 'vocabulary' | 'grammar' | 'medical-term' | 'clinical-phrase' | 'disease' | 'symptom' | 'reading' | 'case';
};

export function buildLinkIndex(): Record<string, LinkTarget> {
  const index: Record<string, LinkTarget> = {};

  for (const word of VOCABULARY) {
    index[`vocabulary:${word.id}`] = {
      label: word.japanese,
      sub: word.meaningsEn.join('; '),
      url: `/vocabulary/${encodeURIComponent(word.id)}`,
      contentType: 'vocabulary',
    };
  }
  for (const entry of GRAMMAR) {
    index[`grammar:${entry.id}`] = {
      label: entry.pattern,
      sub: entry.meaning,
      url: `/grammar/${entry.id}`,
      contentType: 'grammar',
    };
  }
  for (const term of MEDICAL_TERMS) {
    index[`medical-term:${term.id}`] = {
      label: term.japanese,
      sub: term.english,
      url: `/medical/terms/${encodeURIComponent(term.id)}`,
      contentType: 'medical-term',
    };
  }
  for (const phrase of PHRASES) {
    index[`clinical-phrase:${phrase.id}`] = {
      label: phrase.japanese,
      sub: phrase.english,
      url: `/medical/phrases?p=${phrase.id}`,
      contentType: 'clinical-phrase',
    };
  }
  for (const disease of DISEASES) {
    index[`disease:${disease.id}`] = {
      label: disease.japanese,
      sub: disease.english,
      url: `/medical/diseases/${encodeURIComponent(disease.id)}`,
      contentType: 'disease',
    };
  }
  for (const symptom of SYMPTOMS) {
    index[`symptom:${symptom.id}`] = {
      label: symptom.japanese,
      sub: symptom.english,
      url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
      contentType: 'symptom',
    };
  }
  for (const passage of READINGS) {
    index[`reading:${passage.id}`] = {
      label: passage.title,
      sub: passage.topic,
      url: `/reading/${passage.id}`,
      contentType: 'reading',
    };
  }
  for (const item of CASES) {
    index[`case:${item.id}`] = {
      label: item.titleJa,
      sub: item.title,
      url: `/cases/${item.id}`,
      contentType: 'case',
    };
  }

  return index;
}
