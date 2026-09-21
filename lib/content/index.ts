import { CASES } from './data/cases';
import { DISEASES } from './data/diseases';
import { FEATURED_COMPARISONS, GRAMMAR as GRAMMAR_RAW } from './data/grammar';
import { MEDICAL_TERMS } from './data/medicalTerms';
import { MEDICATIONS } from './data/medications';
import { INVESTIGATIONS } from './data/investigations';
import { PHRASES } from './data/phrases';
import { READINGS_A } from './data/readings-a';
import { READINGS_B } from './data/readings-b';
import { SYMPTOMS } from './data/symptoms';
import { VOCABULARY } from './data/vocabulary';
import { RFSMED_INVENTORY } from './rfsmed';
import type {
  ClinicalCase,
  ClinicalPhrase,
  Disease,
  GrammarEntry,
  MedicalTerm,
  ReadingPassage,
  Symptom,
  Vocabulary,
  Investigation,
  Medication,
} from './schema';
import {
  clinicalCaseSchema,
  clinicalPhraseSchema,
  diseaseSchema,
  grammarSchema,
  medicalTermSchema,
  medicationSchema,
  investigationSchema,
  readingPassageSchema,
  symptomSchema,
  vocabularySchema,
} from './schema';

/* ------------------------------------------------------------------
   Content loading.

   Everything here is pure data plus indexes. No React, no storage.
   Relationships are authored as Japanese surface forms and resolved
   here, so content files never contain generated ids.
------------------------------------------------------------------ */

export const READINGS: ReadingPassage[] = [...READINGS_A, ...READINGS_B];

/**
 * Grammar is authored as object literals, so it is parsed once at load to
 * apply schema defaults. The result is fully typed, and any malformed entry
 * is caught by the integrity check rather than at render time.
 */
export const GRAMMAR: GrammarEntry[] = GRAMMAR_RAW.map((entry) => grammarSchema.parse(entry));

// Raw collections are re-exported so other modules can import a single path.
export { CASES, DISEASES, MEDICAL_TERMS, MEDICATIONS, INVESTIGATIONS, PHRASES, SYMPTOMS, VOCABULARY };
export { FEATURED_COMPARISONS };
export { RFSMED_INVENTORY, RFSMED_SPECIALTIES } from './rfsmed';

export const CONTENT = {
  vocabulary: VOCABULARY,
  grammar: GRAMMAR,
  readings: READINGS,
  terms: MEDICAL_TERMS,
  symptoms: SYMPTOMS,
  diseases: DISEASES,
  phrases: PHRASES,
  medications: MEDICATIONS,
  investigations: INVESTIGATIONS,
  cases: CASES,
} as const;

function indexById<T extends { id: string }>(items: readonly T[]) {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return map;
}

export const vocabById = indexById(VOCABULARY);
export const grammarById = indexById(GRAMMAR);
export const readingById = indexById(READINGS);
export const termById = indexById(MEDICAL_TERMS);
export const symptomById = indexById(SYMPTOMS);
export const diseaseById = indexById(DISEASES);
export const phraseById = indexById(PHRASES);
export const caseById = indexById(CASES);
export const medicationById = indexById(MEDICATIONS);
export const investigationById = indexById(INVESTIGATIONS);

/** Japanese surface form → term, including lay synonyms patients use. */
const termByJapanese = new Map<string, MedicalTerm>();
const symptomByJapanese = new Map<string, Symptom>();
const diseaseByJapanese = new Map<string, Disease>();
const vocabByJapanese = new Map<string, Vocabulary>();
const diseaseByEnglish = new Map<string, Disease>();

for (const term of MEDICAL_TERMS) {
  termByJapanese.set(term.japanese, term);
  for (const alt of term.alternativeNames) {
    if (!termByJapanese.has(alt)) termByJapanese.set(alt, term);
  }
}
for (const symptom of SYMPTOMS) symptomByJapanese.set(symptom.japanese, symptom);
for (const disease of DISEASES) {
  diseaseByJapanese.set(disease.japanese, disease);
  diseaseByEnglish.set(disease.english.toLowerCase(), disease);
}
for (const word of VOCABULARY) vocabByJapanese.set(word.japanese, word);

/* ------------------------------ Lookups ----------------------------------- */

export const getVocab = (id: string) => vocabById.get(id);
export const getGrammar = (id: string) => grammarById.get(id);
export const getReading = (id: string) => readingById.get(id);
export const getTerm = (id: string) => termById.get(id);
export const getSymptom = (id: string) => symptomById.get(id);
export const getDisease = (id: string) => diseaseById.get(id);
export const getPhrase = (id: string) => phraseById.get(id);
export const getCase = (id: string) => caseById.get(id);
export const getMedication = (id: string) => medicationById.get(id);
export const getInvestigation = (id: string) => investigationById.get(id);

export function findTermByJapanese(text: string) {
  return termByJapanese.get(text);
}
export function findDiseaseByJapanese(text: string) {
  return diseaseByJapanese.get(text);
}
export function findSymptomByJapanese(text: string) {
  return symptomByJapanese.get(text);
}
export function findDiseaseByEnglish(text: string) {
  return diseaseByEnglish.get(text.toLowerCase());
}

/**
 * Resolves a list of Japanese surface forms to domain entities.
 * Unresolved names are ignored rather than throwing: relationships are
 * advisory metadata, and the integrity report lists what is missing.
 */
export function resolveTermRefs(names: readonly string[]): MedicalTerm[] {
  const out: MedicalTerm[] = [];
  const seen = new Set<string>();
  for (const name of names) {
    const term = termByJapanese.get(name);
    if (term && !seen.has(term.id)) {
      seen.add(term.id);
      out.push(term);
    }
  }
  return out;
}

export function resolveDiseaseRefs(names: readonly string[]): Disease[] {
  const out: Disease[] = [];
  for (const name of names) {
    const disease = diseaseByJapanese.get(name) ?? diseaseByEnglish.get(name.toLowerCase());
    if (disease && !out.includes(disease)) out.push(disease);
  }
  return out;
}

export function resolveVocabRefs(names: readonly string[]): Vocabulary[] {
  const out: Vocabulary[] = [];
  for (const name of names) {
    const word = vocabByJapanese.get(name);
    if (word && !out.includes(word)) out.push(word);
  }
  return out;
}

export function resolveGrammarRefs(patterns: readonly string[]): GrammarEntry[] {
  const out: GrammarEntry[] = [];
  for (const pattern of patterns) {
    const entry = GRAMMAR.find((g) => g.pattern === pattern || g.id === pattern);
    if (entry && !out.includes(entry)) out.push(entry);
  }
  return out;
}

/** Everything the interface may want to surface around one medical term. */
export function relatedForTerm(term: MedicalTerm) {
  const explicit = resolveTermRefs(term.relatedIds);
  if (explicit.length > 0) return explicit;
  // Fall back to same-specialty neighbours so no page is ever a dead end.
  return MEDICAL_TERMS.filter(
    (t) =>
      t.id !== term.id &&
      t.category === term.category &&
      t.specialties.some((s) => term.specialties.includes(s)),
  ).slice(0, 6);
}

export function relatedForDisease(disease: Disease) {
  return {
    terms: resolveTermRefs([...disease.relatedTerms, ...disease.keySymptoms, ...disease.investigations]),
    diseases: resolveDiseaseRefs(disease.relatedDiseases),
    medications: MEDICATIONS.filter((medication) => medication.relatedDiseases.some((name) => [disease.japanese, disease.english, disease.indonesian, ...disease.keySymptoms].includes(name))),
    investigations: INVESTIGATIONS.filter((investigation) => investigation.relatedDiseases.some((name) => [disease.japanese, disease.english, disease.indonesian].includes(name)) || investigation.relatedTerms.some((name) => disease.relatedTerms.includes(name))),
    cases: CASES.filter((item) => [item.hiddenDiagnosis, ...item.drillTerms].some((name) => [disease.japanese, disease.english, disease.indonesian].includes(name))),
    // Phrasebook lines that answer this disease's question list directly.
    phrases: PHRASES.filter((phrase) => disease.historyQuestions.includes(phrase.japanese)),
    // Patient wording: patient-friendly lines that mention this disease's terminology.
    patients: PHRASES.filter(
      (phrase) =>
        phrase.register === 'patient-friendly' && disease.relatedTerms.some((term) => phrase.japanese.includes(term)),
    ).slice(0, 4),
  };
}

export function relatedForSymptom(symptom: Symptom) {
  return {
    diseases: DISEASES.filter((disease) => disease.keySymptoms.some((name) => name.includes(symptom.japanese) || symptom.japanese.includes(name) || name.includes(symptom.indonesian))),
    terms: resolveTermRefs(symptom.relatedTermIds),
    phrases: PHRASES.filter((phrase) => phrase.relatedTermIds.some((id) => symptom.relatedTermIds.includes(id))),
  };
}

/** Phrases that mention a term, used to link the dictionary back to dialogue. */
export function phrasesForTerm(term: MedicalTerm) {
  const needles = [term.japanese, ...term.alternativeNames];
  return PHRASES.filter((p) => needles.some((n) => n.length > 0 && p.japanese.includes(n)));
}

export function termsByCategory(category: MedicalTerm['category']) {
  return MEDICAL_TERMS.filter((t) => t.category === category);
}

export function diseasesBySpecialty(specialty: string) {
  return DISEASES.filter((d) => d.specialties.includes(specialty));
}

export function phrasesByStage(stage: ClinicalPhrase['stage']) {
  return PHRASES.filter((p) => p.stage === stage);
}

export function phrasesForSpecialty(specialty: string) {
  return PHRASES.filter((p) => p.specialtyTags.includes(specialty));
}

/* --------------------------- Collections / decks --------------------------- */

export type Collection = {
  id: string;
  name: string;
  description: string;
  /** Content ids, resolved at build time. */
  itemIds: string[];
  groups: { label: string; count: number }[];
};

function countBy<T>(items: readonly T[], key: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) ?? 0) + 1);
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export const COLLECTIONS: Collection[] = [
  {
    id: 'col-n2-core',
    name: 'N2 core vocabulary',
    description: 'The abstract nouns, formal verbs and stance expressions that carry N2 reading passages.',
    itemIds: VOCABULARY.filter((v) => v.tags.includes('core')).map((v) => v.id),
    groups: countBy(VOCABULARY.filter((v) => v.tags.includes('core')), (v) => v.jlptLevel ?? 'unrated'),
  },
  {
    id: 'col-n1-bridge',
    name: 'N1 bridge vocabulary',
    description: 'Items that separate comfortable N2 from confident N1 reading.',
    itemIds: VOCABULARY.filter((v) => v.tags.includes('n1-bridge')).map((v) => v.id),
    groups: countBy(VOCABULARY.filter((v) => v.tags.includes('n1-bridge')), (v) => v.jlptLevel ?? 'unrated'),
  },
  {
    id: 'col-connectors',
    name: 'Logical connectors and trap words',
    description: 'Discourse markers that decide where an argument turns, plus the items most often misread.',
    itemIds: VOCABULARY.filter((v) => v.tags.includes('connective') || v.tags.includes('trap-word')).map((v) => v.id),
    groups: [],
  },
  {
    id: 'col-reading-trap',
    name: 'Reading trap words',
    description: 'Words with a polarity or scope trap: double negatives, 必ずしも, 一概に, かえって.',
    itemIds: VOCABULARY.filter((v) => v.tags.includes('trap-word')).map((v) => v.id),
    groups: [],
  },
  {
    id: 'col-grammar-n2',
    name: 'N2 grammar patterns',
    description: 'Function-grouped patterns with contrast notes for the Compare workspace.',
    itemIds: GRAMMAR.filter((g) => g.jlptLevel === 'N2').map((g) => g.id),
    groups: countBy(GRAMMAR.filter((g) => g.jlptLevel === 'N2'), (g) => g.family),
  },
  {
    id: 'col-grammar-n1',
    name: 'N1 grammar patterns',
    description: 'Lower-frequency, higher-register patterns used in essays and formal writing.',
    itemIds: GRAMMAR.filter((g) => g.jlptLevel === 'N1').map((g) => g.id),
    groups: countBy(GRAMMAR.filter((g) => g.jlptLevel === 'N1'), (g) => g.family),
  },
  {
    id: 'col-hospital-core',
    name: 'Core hospital Japanese',
    description: 'The terms and phrases that cover an ordinary outpatient encounter end to end.',
    itemIds: [
      ...MEDICAL_TERMS.filter((t) => t.tags.includes('core')).map((t) => t.id),
      ...PHRASES.filter((p) => ['greeting', 'chief-complaint', 'hpi'].includes(p.stage)).map((p) => p.id),
    ],
    groups: countBy(MEDICAL_TERMS.filter((t) => t.tags.includes('core')), (t) => t.category),
  },
  {
    id: 'col-emergency',
    name: 'Emergency Japanese',
    description: 'Terms and phrases needed in the first minutes of an emergency presentation.',
    itemIds: [
      ...MEDICAL_TERMS.filter((t) => t.category === 'emergency' || t.tags.includes('emergency')).map((t) => t.id),
      ...PHRASES.filter((p) => p.stage === 'emergency').map((p) => p.id),
    ],
    groups: [],
  },
  {
    id: 'col-exam-commands',
    name: 'Examination commands',
    description: 'Bedside instructions, from positioning to nerve examination.',
    itemIds: PHRASES.filter((p) => p.stage === 'examination').map((p) => p.id),
    groups: [],
  },
  {
    id: 'col-investigations',
    name: 'Investigations and explanations',
    description: 'Test names with the wording used to explain each one to a patient.',
    itemIds: [
      ...MEDICAL_TERMS.filter((t) => ['test', 'imaging', 'lab', 'procedure'].includes(t.category)).map((t) => t.id),
      ...PHRASES.filter((p) => p.stage === 'investigation').map((p) => p.id),
    ],
    groups: [],
  },
  {
    id: 'col-patient-friendly',
    name: 'Patient-friendly explanations',
    description: 'Register B wording: how to say a technical concept in language a patient follows.',
    itemIds: MEDICAL_TERMS.filter((t) => Boolean(t.patientFriendly)).map((t) => t.id),
    groups: [],
  },
  {
    id: 'col-symptoms',
    name: 'Symptoms and their questions',
    description: 'Every symptom page, with patient expressions and doctor questions.',
    itemIds: SYMPTOMS.map((s) => s.id),
    groups: [],
  },
  {
    id: 'col-phrasebook',
    name: 'Full phrasebook',
    description: 'All clinical phrases across the eighteen encounter stages.',
    itemIds: PHRASES.map((p) => p.id),
    groups: countBy(PHRASES, (p) => p.stage),
  },
];

export function collectionById(id: string) {
  return COLLECTIONS.find((c) => c.id === id);
}

/* ------------------------------- Statistics -------------------------------- */

export const CONTENT_STATS = {
  vocabulary: VOCABULARY.length,
  grammar: GRAMMAR.length,
  readings: READINGS.length,
  readingQuestions: READINGS.reduce((sum, r) => sum + r.questions.length, 0),
  terms: MEDICAL_TERMS.length,
  symptoms: SYMPTOMS.length,
  diseases: DISEASES.length,
  phrases: PHRASES.length,
  cases: CASES.length,
  medications: MEDICATIONS.length,
  investigations: INVESTIGATIONS.length,
  rfsmedInventory: RFSMED_INVENTORY.total,
  medicalRomajiComplete:
    MEDICAL_TERMS.filter((item) => Boolean(item.romaji)).length +
    SYMPTOMS.filter((item) => Boolean(item.romaji)).length +
    DISEASES.filter((item) => Boolean(item.romaji)).length +
    PHRASES.filter((item) => Boolean(item.romaji)).length +
    MEDICATIONS.filter((item) => Boolean(item.romaji)).length +
    INVESTIGATIONS.filter((item) => Boolean(item.romaji)).length,
  total:
    VOCABULARY.length +
    GRAMMAR.length +
    READINGS.length +
    MEDICAL_TERMS.length +
    SYMPTOMS.length +
    DISEASES.length +
    PHRASES.length +
    CASES.length +
    MEDICATIONS.length +
    INVESTIGATIONS.length,
};

/* -------------------------------- Integrity -------------------------------- */

export type IntegrityIssue = {
  level: 'error' | 'warning';
  message: string;
  where?: string;
};

/**
 * Content integrity checks (QA_ACCEPTANCE §13).
 *
 * Runs in tests and from /api/health. It is deliberately strict about
 * duplicate ids and broken grammar references, and only warns about
 * unresolved relationship names, because those are advisory.
 */
export function checkContentIntegrity(): IntegrityIssue[] {
  const issues: IntegrityIssue[] = [];

  const collections: [string, { id: string }[], unknown][] = [
    ['vocabulary', VOCABULARY, vocabularySchema],
    ['grammar', GRAMMAR, grammarSchema],
    ['reading', READINGS, readingPassageSchema],
    ['medical-term', MEDICAL_TERMS, medicalTermSchema],
    ['symptom', SYMPTOMS, symptomSchema],
    ['disease', DISEASES, diseaseSchema],
  ['clinical-phrase', PHRASES, clinicalPhraseSchema],
    ['medication', MEDICATIONS, medicationSchema],
    ['investigation', INVESTIGATIONS, investigationSchema],
    ['clinical-case', CASES, clinicalCaseSchema],
  ];

  const allIds = new Map<string, string>();
  for (const [name, items, schema] of collections) {
    for (const item of items) {
      const seen = allIds.get(item.id);
      if (seen) {
        issues.push({ level: 'error', message: `Duplicate id "${item.id}" in ${name} and ${seen}` });
      } else {
        allIds.set(item.id, name);
      }
      const parsed = (schema as { safeParse: (v: unknown) => { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } } }).safeParse(item);
      if (!parsed.success && parsed.error) {
        for (const err of parsed.error.issues.slice(0, 3)) {
          issues.push({
            level: 'error',
            message: `${name} ${item.id}: ${err.path.join('.')} ${err.message}`,
            where: item.id,
          });
        }
      }
    }
  }

  for (const entry of GRAMMAR) {
    for (const id of [...entry.similarIds, ...entry.relatedVocabularyIds]) {
      if (!grammarById.has(id) && !vocabById.has(id)) {
        issues.push({ level: 'warning', message: `grammar ${entry.id} references missing id ${id}`, where: entry.id });
      }
    }
    if (entry.examples.length < 3) {
      issues.push({ level: 'warning', message: `grammar ${entry.id} has fewer than 3 examples`, where: entry.id });
    }
  }

  for (const [a, b] of FEATURED_COMPARISONS) {
    if (!grammarById.has(a) || !grammarById.has(b)) {
      issues.push({ level: 'error', message: `featured comparison references a missing grammar id: ${a}, ${b}` });
    }
  }

  for (const passage of READINGS) {
    for (const question of passage.questions) {
      if (question.correctIndex >= question.options.length) {
        issues.push({ level: 'error', message: `${passage.id}/${question.id}: correctIndex out of range` });
      }
      if (question.options.filter((o) => o.why.startsWith('Correct')).length !== 1) {
        issues.push({ level: 'error', message: `${passage.id}/${question.id}: exactly one option must be marked correct` });
      }
      if (question.evidenceParagraph >= passage.paragraphs.length) {
        issues.push({ level: 'error', message: `${passage.id}/${question.id}: evidence paragraph out of range` });
      }
      const para = passage.paragraphs[question.evidenceParagraph];
      if (para && !para.text.includes(question.evidenceSentence.slice(0, 10))) {
        issues.push({
          level: 'warning',
          message: `${passage.id}/${question.id}: evidence sentence not found in paragraph ${question.evidenceParagraph}`,
        });
      }
      for (const [index, option] of question.options.entries()) {
        const isCorrect = option.why.startsWith('Correct');
        if (isCorrect !== (index === question.correctIndex)) {
          issues.push({ level: 'error', message: `${passage.id}/${question.id}: option ${index} rationale does not match correctIndex` });
        }
      }
    }
  }

  const linkable = new Set<string>([
    ...termByJapanese.keys(),
    ...diseaseByJapanese.keys(),
    ...vocabByJapanese.keys(),
  ]);
  // Only `relatedTerms` is a link target. `keySymptoms` is free clinical
  // wording, so it is intentionally not resolved against the dictionary.
  for (const disease of DISEASES) {
    for (const name of disease.relatedTerms) {
      if (!linkable.has(name)) {
        issues.push({ level: 'warning', message: `disease ${disease.id}: "${name}" does not resolve to a term`, where: disease.id });
      }
    }
  }
  for (const term of MEDICAL_TERMS) {
    for (const name of term.relatedIds) {
      if (!linkable.has(name)) {
        issues.push({ level: 'warning', message: `term ${term.id}: related "${name}" does not resolve`, where: term.id });
      }
    }
  }
  for (const entry of CASES) {
    for (const topic of entry.requiredQuestions.map((q) => q.topic)) {
      if (!entry.patientLines.some((line) => line.topic === topic)) {
        issues.push({
          level: 'warning',
          message: `case ${entry.id}: no patient line answers the "${topic}" question`,
          where: entry.id,
        });
      }
    }
  }

  for (const symptom of SYMPTOMS) {
    if (symptom.exchanges.length < 2) {
      issues.push({
        level: 'warning',
        message: `symptom ${symptom.id}: fewer than 2 patient→doctor exchanges`,
        where: symptom.id,
      });
    }
    for (const [index, exchange] of symptom.exchanges.entries()) {
      if (exchange.doctor === exchange.patient) {
        issues.push({
          level: 'error',
          message: `symptom ${symptom.id}: exchange ${index} repeats the patient line as the response`,
          where: symptom.id,
        });
      }
    }
  }

  return issues;
}

export type { ClinicalCase, ClinicalPhrase, Disease, GrammarEntry, MedicalTerm, ReadingPassage, Symptom, Vocabulary, Investigation, Medication };
