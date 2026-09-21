import {
  CASES,
  DISEASES,
  GRAMMAR,
  MEDICAL_TERMS,
  PHRASES,
  SYMPTOMS,
  VOCABULARY,
  getDisease,
  getGrammar,
  getPhrase,
  getSymptom,
  getTerm,
  getVocab,
} from '@/lib/content';
import { kanaToRomaji } from '@/lib/utils/romaji';
import type { ContentType } from './schema';

/* ------------------------------------------------------------------
   Study cards (PRD §7.2, UX_UI §6).

   One projection for everything that can enter the spaced repetition
   queue, so the review session has a single rendering path and does not
   need to know which module a card came from.
------------------------------------------------------------------ */

export type StudyCard = {
  key: string;
  contentType: ContentType;
  contentId: string;
  /** What is shown before the answer is revealed. */
  front: string;
  kana?: string;
  romaji?: string;
  /** Primary answer. */
  primary: string;
  /** Secondary translation. */
  secondary?: string;
  /** Deeper material revealed with the answer. */
  detail?: string;
  /** A sentence, dialogue line or clinical context. */
  example?: string;
  exampleLabel?: string;
  /** Small badge: level, category or register. */
  badge?: string;
  /** Extra facets shown as a definition list after reveal. */
  facets?: { label: string; value: string }[];
  /** Where to open the full entry. */
  url: string;
  /** Which surface deck this belongs to, used by collections. */
  deck: string;
};

export function cardKey(contentType: ContentType, contentId: string) {
  return `${contentType}:${contentId}`;
}

export function vocabularyCard(id: string): StudyCard | undefined {
  const word = getVocab(id);
  if (!word) return undefined;
  return {
    key: cardKey('vocabulary', word.id),
    contentType: 'vocabulary',
    contentId: word.id,
    front: word.japanese,
    kana: word.kana,
    romaji: word.kana ? kanaToRomaji(word.kana) : undefined,
    primary: word.meaningsEn.join('; '),
    secondary: word.meaningsId.join('; '),
    detail: word.definitionJa,
    example: word.examples[0]?.ja,
    exampleLabel: word.examples[0]?.en,
    badge: word.jlptLevel,
    facets: [
      ...(word.partOfSpeech?.length ? [{ label: 'Part of speech', value: word.partOfSpeech.join(', ') }] : []),
      ...(word.synonyms?.length ? [{ label: 'Synonyms', value: word.synonyms.join('、') }] : []),
      ...(word.antonyms?.length ? [{ label: 'Antonyms', value: word.antonyms.join('、') }] : []),
      ...(word.collocations?.length ? [{ label: 'Collocations', value: word.collocations.join(' / ') }] : []),
      ...(word.notes ? [{ label: 'Note', value: word.notes }] : []),
    ],
    url: `/vocabulary/${encodeURIComponent(word.id)}`,
    deck: 'Vocabulary',
  };
}

export function grammarCard(id: string): StudyCard | undefined {
  const entry = getGrammar(id);
  if (!entry) return undefined;
  return {
    key: cardKey('grammar', entry.id),
    contentType: 'grammar',
    contentId: entry.id,
    front: entry.pattern,
    kana: entry.kana,
    primary: entry.meaning,
    secondary: entry.meaningsId,
    detail: entry.nuance,
    example: entry.examples[0]?.ja,
    exampleLabel: entry.examples[0]?.en,
    badge: entry.jlptLevel,
    facets: [
      { label: 'Formation', value: entry.formation },
      { label: 'Register', value: entry.register.join(', ') || 'neutral' },
      ...(entry.contrastNote ? [{ label: 'Contrast', value: entry.contrastNote }] : []),
    ],
    url: `/grammar/${entry.id}`,
    deck: 'Grammar',
  };
}

export function termCard(id: string): StudyCard | undefined {
  const term = getTerm(id);
  if (!term) return undefined;
  return {
    key: cardKey('medical-term', term.id),
    contentType: 'medical-term',
    contentId: term.id,
    front: term.japanese,
    kana: term.kana,
    romaji: term.kana ? kanaToRomaji(term.kana) : undefined,
    primary: term.english,
    secondary: term.indonesian,
    detail: term.patientFriendly ?? term.definitionJa,
    example: term.patientExpression,
    exampleLabel: 'How a patient says it',
    badge: term.category,
    facets: [
      ...(term.patientFriendly ? [{ label: 'Patient-friendly', value: term.patientFriendly }] : []),
      ...(term.specialties.length ? [{ label: 'Specialty', value: term.specialties.join(', ') }] : []),
      ...(term.alternativeNames.length ? [{ label: 'Also called', value: term.alternativeNames.join('、') }] : []),
    ],
    url: `/medical/terms/${encodeURIComponent(term.id)}`,
    deck: 'Medical terminology',
  };
}

export function phraseCard(id: string): StudyCard | undefined {
  const phrase = getPhrase(id);
  if (!phrase) return undefined;
  return {
    key: cardKey('clinical-phrase', phrase.id),
    contentType: 'clinical-phrase',
    contentId: phrase.id,
    front: phrase.english,
    kana: phrase.kana,
    primary: phrase.japanese,
    secondary: phrase.indonesian,
    detail: phrase.variants.length ? `Alternative: ${phrase.variants.join(' / ')}` : undefined,
    example: phrase.notes,
    exampleLabel: phrase.notes ? 'Note' : undefined,
    badge: phrase.register,
    facets: [
      { label: 'Intent', value: phrase.intent },
      { label: 'Stage', value: phrase.stage },
    ],
    url: `/medical/phrases?stage=${phrase.stage}&p=${phrase.id}`,
    deck: 'Clinical phrases',
  };
}

export function diseaseCard(id: string): StudyCard | undefined {
  const disease = getDisease(id);
  if (!disease) return undefined;
  return {
    key: cardKey('disease', disease.id),
    contentType: 'disease',
    contentId: disease.id,
    front: disease.japanese,
    kana: disease.kana,
    primary: disease.english,
    secondary: disease.indonesian,
    detail: disease.patientExplanation,
    example: disease.historyQuestions[0],
    exampleLabel: 'First question to ask',
    badge: disease.specialties[0],
    facets: [{ label: 'Key symptoms', value: disease.keySymptoms.join('、') }],
    url: `/medical/diseases/${encodeURIComponent(disease.id)}`,
    deck: 'Disease pages',
  };
}

export function symptomCard(id: string): StudyCard | undefined {
  const symptom = getSymptom(id);
  if (!symptom) return undefined;
  return {
    key: cardKey('symptom', symptom.id),
    contentType: 'symptom',
    contentId: symptom.id,
    front: symptom.japanese,
    kana: symptom.kana,
    primary: symptom.english,
    secondary: symptom.indonesian,
    detail: symptom.patientFriendlyExplanation,
    example: symptom.patientExpressions[0],
    exampleLabel: 'How a patient says it',
    badge: 'symptom',
    facets: [{ label: 'Ask', value: symptom.doctorQuestions.slice(0, 3).join(' / ') }],
    url: `/medical/symptoms/${encodeURIComponent(symptom.id)}`,
    deck: 'Symptoms',
  };
}

export function buildCard(contentType: ContentType, contentId: string): StudyCard | undefined {
  switch (contentType) {
    case 'vocabulary':
      return vocabularyCard(contentId);
    case 'grammar':
      return grammarCard(contentId);
    case 'medical-term':
      return termCard(contentId);
    case 'clinical-phrase':
      return phraseCard(contentId);
    case 'disease':
      return diseaseCard(contentId);
    case 'symptom':
      return symptomCard(contentId);
    default:
      return undefined;
  }
}

/**
 * Minimal card projection.
 *
 * The dashboard only composes a queue, so it ships these stubs instead of
 * the full card payload — a third of the bytes of the full deck.
 */
export type CardStub = {
  key: string;
  contentType: ContentType;
  contentId: string;
  deck: string;
  front: string;
  badge?: string;
};

export function buildCardStubs(): CardStub[] {
  return [
    ...VOCABULARY.map((word) => ({ key: cardKey('vocabulary', word.id), contentType: 'vocabulary' as const, contentId: word.id, deck: 'Vocabulary', front: word.japanese, badge: word.jlptLevel })),
    ...GRAMMAR.map((entry) => ({ key: cardKey('grammar', entry.id), contentType: 'grammar' as const, contentId: entry.id, deck: 'Grammar', front: entry.pattern, badge: entry.jlptLevel })),
    ...MEDICAL_TERMS.map((term) => ({ key: cardKey('medical-term', term.id), contentType: 'medical-term' as const, contentId: term.id, deck: 'Medical terminology', front: term.japanese, badge: term.category })),
    ...PHRASES.map((phrase) => ({ key: cardKey('clinical-phrase', phrase.id), contentType: 'clinical-phrase' as const, contentId: phrase.id, deck: 'Clinical phrases', front: phrase.english, badge: phrase.stage })),
    ...SYMPTOMS.map((symptom) => ({ key: cardKey('symptom', symptom.id), contentType: 'symptom' as const, contentId: symptom.id, deck: 'Symptoms', front: symptom.japanese, badge: 'symptom' })),
    ...DISEASES.map((disease) => ({ key: cardKey('disease', disease.id), contentType: 'disease' as const, contentId: disease.id, deck: 'Disease pages', front: disease.japanese, badge: disease.specialties[0] })),
  ];
}

/**
 * The full deck available to the SRS queue, in curriculum order:
 * core vocabulary first, then grammar, then clinical material. The order
 * matters because it decides which new cards are introduced first.
 */
export function buildAllCards(): StudyCard[] {
  const cards: StudyCard[] = [];
  for (const word of VOCABULARY) {
    const card = vocabularyCard(word.id);
    if (card) cards.push(card);
  }
  for (const entry of GRAMMAR) {
    const card = grammarCard(entry.id);
    if (card) cards.push(card);
  }
  for (const term of MEDICAL_TERMS) {
    const card = termCard(term.id);
    if (card) cards.push(card);
  }
  for (const phrase of PHRASES) {
    const card = phraseCard(phrase.id);
    if (card) cards.push(card);
  }
  for (const symptom of SYMPTOMS) {
    const card = symptomCard(symptom.id);
    if (card) cards.push(card);
  }
  for (const disease of DISEASES) {
    const card = diseaseCard(disease.id);
    if (card) cards.push(card);
  }
  return cards;
}

/** Compact index used by the dashboard, which only needs labels and counts. */
export function buildCardIndex() {
  return [
    ...VOCABULARY.map((v) => ({ key: cardKey('vocabulary', v.id), label: v.japanese, badge: v.jlptLevel ?? '' })),
    ...GRAMMAR.map((g) => ({ key: cardKey('grammar', g.id), label: g.pattern, badge: g.jlptLevel })),
    ...MEDICAL_TERMS.map((t) => ({ key: cardKey('medical-term', t.id), label: t.japanese, badge: t.category })),
    ...PHRASES.map((p) => ({ key: cardKey('clinical-phrase', p.id), label: p.japanese, badge: p.stage })),
    ...SYMPTOMS.map((s) => ({ key: cardKey('symptom', s.id), label: s.japanese, badge: 'symptom' })),
    ...DISEASES.map((d) => ({ key: cardKey('disease', d.id), label: d.japanese, badge: d.specialties[0] ?? '' })),
  ];
}

export const CASE_COUNT = CASES.length;
