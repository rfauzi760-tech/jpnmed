import { createIdFactory, kanaToRomaji, kanaToRomajiFull } from '@/lib/utils/romaji';
import type {
  ClinicalCase,
  ClinicalPhrase,
  Disease,
  ExampleSentence,
  ClinicalLine,
  Investigation,
  Medication,
  JlptLevel,
  MedicalTerm,
  MedicalRegisterSupport,
  ReadingPassage,
  ReadingQuestion,
  Symptom,
  VerificationStatus,
  Vocabulary,
} from './schema';
import { CASE_OPENING_INDONESIAN, japaneseReadingFor } from './language-support';
import { medicalRegisterReadingFor, MEDICAL_REGISTER_SUPPORT_STATUS } from './medical-register-support';
import { readingIndonesianFor } from './reading-translations';

/* ------------------------------------------------------------------
   Authoring helpers.

   Seed content is authored as compact rows and expanded into the full
   domain objects here. This keeps the data files readable and diffable
   while every entity that reaches the UI is fully typed.

   Fields ending in `_` accept either a single string or a list. Strings
   are split on '; ' so one line can carry several meanings.
------------------------------------------------------------------ */

const NOW = '2026-01-01T00:00:00.000Z';

function list(value?: string | string[]): string[] {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : value.split('; ');
  return arr.map((v) => v.trim()).filter(Boolean);
}

export function ex(ja: string, en: string, idn?: string): ExampleSentence {
  return { ja, en, ...(idn ? { id: idn } : {}) };
}

function normaliseExamples(input?: [string, string] | [string, string][]): ExampleSentence[] {
  if (!input) return [];
  const rows = Array.isArray(input[0]) ? (input as [string, string][]) : [input as [string, string]];
  return rows.map(([ja, en]) => ex(ja, en));
}

/* ------------------------------- Vocabulary -------------------------------- */

const vocabId = createIdFactory('voc');
const vocabIds = new Set<string>();

export type VocabRow = {
  ja: string;
  kana: string;
  /** English meanings, list or '; ' separated. */
  en: string | string[];
  /** Indonesian meanings. */
  idn: string | string[];
  jlpt?: JlptLevel;
  tags?: string[];
  ex?: [string, string] | [string, string][];
  defJa?: string;
  pos?: string[];
  syn?: string[];
  ant?: string[];
  coll?: string[];
  gr?: string[];
  freq?: number;
  med?: boolean;
  note?: string;
  v?: VerificationStatus;
};

export function V(row: VocabRow): Vocabulary {
  const id = vocabId(row.kana, row.ja);
  if (vocabIds.has(id)) throw new Error(`Duplicate vocabulary id: ${id} (${row.ja})`);
  vocabIds.add(id);
  return {
    id,
    japanese: row.ja,
    kana: row.kana,
    romaji: undefined,
    meaningsEn: list(row.en),
    meaningsId: list(row.idn),
    definitionJa: row.defJa,
    partOfSpeech: row.pos,
    jlptLevel: row.jlpt,
    frequencyRank: row.freq,
    tags: row.tags ?? [],
    examples: normaliseExamples(row.ex),
    synonyms: row.syn,
    antonyms: row.ant,
    collocations: row.coll,
    relatedGrammarIds: row.gr,
    medicalRelevance: row.med,
    notes: row.note,
    verificationStatus: row.v ?? 'reviewed',
    createdAt: NOW,
    updatedAt: NOW,
  };
}

/* ------------------------------ Medical terms ------------------------------ */

const termId = createIdFactory('med');
const termIds = new Set<string>();

export type TermRow = {
  ja: string;
  kana: string;
  en: string;
  idn: string;
  cat: MedicalTerm['category'];
  /** Register B: patient-friendly wording. */
  pf?: string;
  pfKana?: string;
  pfRomaji?: string;
  pfIdn?: string;
  pfEn?: string;
  pfV?: VerificationStatus;
  pfLanguageV?: VerificationStatus;
  /** Register C: typical patient expression. */
  pe?: string;
  peKana?: string;
  peRomaji?: string;
  peIdn?: string;
  peEn?: string;
  peV?: VerificationStatus;
  peLanguageV?: VerificationStatus;
  sp?: string[];
  tags?: string[];
  defJa?: string;
  alt?: string[];
  rel?: string[];
  note?: string;
  v?: VerificationStatus;
};

function medicalRegisterSupport(
  japanese: string,
  indonesian: string,
  english: string,
  overrides: {
    kana?: string;
    romaji?: string;
    indonesian?: string;
    english?: string;
    verificationStatus?: VerificationStatus;
    languageSupportStatus?: VerificationStatus;
  } = {},
): MedicalRegisterSupport {
  const generated = medicalRegisterReadingFor(japanese);
  return {
    japanese,
    kana: overrides.kana ?? generated.kana,
    romaji: overrides.romaji ?? generated.romaji,
    indonesian: overrides.indonesian ?? indonesian,
    english: overrides.english ?? english,
    verificationStatus: overrides.verificationStatus ?? 'reviewed',
    languageSupportStatus: overrides.languageSupportStatus ?? MEDICAL_REGISTER_SUPPORT_STATUS,
  };
}

export function T(row: TermRow): MedicalTerm {
  const id = termId(row.kana, row.ja);
  if (termIds.has(id)) throw new Error(`Duplicate medical term id: ${id} (${row.ja})`);
  termIds.add(id);
  return {
    id,
    japanese: row.ja,
    kana: row.kana,
    romaji: kanaToRomajiFull(row.kana),
    english: row.en,
    indonesian: row.idn,
    patientFriendly: row.pf,
    patientFriendlySupport: row.pf
      ? medicalRegisterSupport(row.pf, row.idn, row.en, {
          kana: row.pfKana,
          romaji: row.pfRomaji,
          indonesian: row.pfIdn,
          english: row.pfEn,
          verificationStatus: row.pfV,
          languageSupportStatus: row.pfLanguageV,
        })
      : undefined,
    patientExpression: row.pe,
    patientExpressionSupport: row.pe
      ? medicalRegisterSupport(row.pe, row.idn, row.en, {
          kana: row.peKana,
          romaji: row.peRomaji,
          indonesian: row.peIdn,
          english: row.peEn,
          verificationStatus: row.peV,
          languageSupportStatus: row.peLanguageV,
        })
      : undefined,
    register: 'technical',
    category: row.cat,
    specialties: row.sp ?? [],
    tags: row.tags ?? [],
    definitionJa: row.defJa,
    relatedIds: row.rel ?? [],
    alternativeNames: row.alt ?? [],
    verificationStatus: row.v ?? 'reviewed',
    junitPriority: 'common',
    notes: row.note,
  };
}

/** Look up a medical term id from its Japanese surface form. */
export function termIdFor(japanese: string): string | undefined {
  for (const id of termIds) {
    if (id.endsWith(kanaToRomaji(japanese))) return id;
  }
  return undefined;
}

/* ----------------------------- Clinical phrases ---------------------------- */

export type PhraseRow = {
  intent: string;
  ja: string;
  kana: string;
  en: string;
  idn: string;
  reg: ClinicalPhrase['register'];
  speaker?: ClinicalPhrase['speaker'];
  stage: ClinicalPhrase['stage'];
  spec?: string[];
  var_?: string[];
  rel?: string[];
  note?: string;
  v?: VerificationStatus;
  priority?: ClinicalPhrase['junitPriority'];
};

const phraseCounter = new Map<string, number>();

export function P(row: PhraseRow): ClinicalPhrase {
  const n = (phraseCounter.get(row.stage) ?? 0) + 1;
  phraseCounter.set(row.stage, n);
  return {
    id: `ph-${row.stage}-${String(n).padStart(2, '0')}`,
    intent: row.intent,
    japanese: row.ja,
    kana: row.kana,
    romaji: kanaToRomajiFull(row.kana),
    english: row.en,
    indonesian: row.idn,
    register: row.reg,
    speaker: row.speaker ?? (row.reg === 'staff' ? 'staff' : 'doctor'),
    stage: row.stage,
    specialtyTags: row.spec ?? [],
    variants: row.var_ ?? [],
    relatedTermIds: row.rel ?? [],
    notes: row.note,
    verificationStatus: row.v ?? 'reviewed',
    junitPriority: row.priority ?? 'common',
  };
}

export type ClinicalLineRow = Omit<ClinicalLine, 'romaji'> & { kana: string };

export function L(row: ClinicalLineRow): ClinicalLine {
  return { ...row, romaji: kanaToRomajiFull(row.kana) };
}

export type MedicationRow = Omit<Medication, 'romaji' | 'whyPrescribed' | 'frequencyInstruction' | 'mealInstruction' | 'prnInstruction' | 'durationInstruction' | 'adverseEffectVocabulary' | 'allergyQuestion' | 'pregnancyWording' | 'reconciliationQuestions'> & {
  whyPrescribed: ClinicalLineRow;
  frequencyInstruction: ClinicalLineRow;
  mealInstruction: ClinicalLineRow;
  prnInstruction: ClinicalLineRow;
  durationInstruction: ClinicalLineRow;
  adverseEffectVocabulary?: ClinicalLineRow[];
  allergyQuestion: ClinicalLineRow;
  pregnancyWording?: ClinicalLineRow;
  reconciliationQuestions?: ClinicalLineRow[];
};

export function M(row: MedicationRow): Medication {
  return {
    ...row,
    romaji: kanaToRomaji(row.kana),
    whyPrescribed: L(row.whyPrescribed),
    frequencyInstruction: L(row.frequencyInstruction),
    mealInstruction: L(row.mealInstruction),
    prnInstruction: L(row.prnInstruction),
    durationInstruction: L(row.durationInstruction),
    adverseEffectVocabulary: (row.adverseEffectVocabulary ?? []).map(L),
    allergyQuestion: L(row.allergyQuestion),
    pregnancyWording: row.pregnancyWording ? L(row.pregnancyWording) : undefined,
    reconciliationQuestions: (row.reconciliationQuestions ?? []).map(L),
  };
}

export type InvestigationRow = Omit<Investigation, 'romaji' | 'patientExplanation' | 'preparationInstruction' | 'resultDiscussion'> & {
  patientExplanation: ClinicalLineRow;
  preparationInstruction?: ClinicalLineRow;
  resultDiscussion: ClinicalLineRow;
};

export function I(row: InvestigationRow): Investigation {
  return {
    ...row,
    romaji: kanaToRomaji(row.kana),
    patientExplanation: L(row.patientExplanation),
    preparationInstruction: row.preparationInstruction ? L(row.preparationInstruction) : undefined,
    resultDiscussion: L(row.resultDiscussion),
  };
}

/* --------------------------------- Symptoms -------------------------------- */

const symptomId = createIdFactory('sym');
const symptomIds = new Set<string>();

export type SymptomRow = {
  ja: string;
  kana: string;
  en: string;
  idn: string;
  pe: string[];
  q: string[];
  desc?: string[];
  sev?: string[];
  tim?: string[];
  assoc?: string[];
  red?: string[];
  pf?: string;
  /** [patient utterance, your response, response in English?] */
  ex?: [string, string, string?][];
  terms?: string[];
  rel?: string[];
  v?: VerificationStatus;
};

export function S(row: SymptomRow): Symptom {
  const id = symptomId(row.kana, row.ja);
  if (symptomIds.has(id)) throw new Error(`Duplicate symptom id: ${id} (${row.ja})`);
  symptomIds.add(id);
  return {
    id,
    japanese: row.ja,
    kana: row.kana,
    romaji: kanaToRomaji(row.kana),
    english: row.en,
    indonesian: row.idn,
    patientExpressions: row.pe,
    doctorQuestions: row.q,
    descriptors: row.desc ?? [],
    severityPhrases: row.sev ?? [],
    timingPhrases: row.tim ?? [],
    associatedQuestions: row.assoc ?? [],
    redFlags: row.red ?? [],
    patientFriendlyExplanation: row.pf,
    exchanges: (row.ex ?? []).map(([patient, doctor, doctorEn]) => ({
      patient,
      doctor,
      ...(doctorEn ? { doctorEn } : {}),
    })),
    relatedTermIds: row.terms ?? [],
    relatedSymptomIds: row.rel ?? [],
    verificationStatus: row.v ?? 'reviewed',
  };
}

/* --------------------------------- Diseases -------------------------------- */

export type DiseaseRow = {
  ja: string;
  kana: string;
  en: string;
  idn: string;
  lay?: string;
  sp: string[];
  sev: Disease['severity'];
  sx: string[];
  rel?: string[];
  hx: string[];
  exam?: string[];
  tests?: string[];
  testExplain?: string[];
  explain: string;
  cause?: string;
  tx?: string[];
  red?: string[];
  admit?: string[];
  related?: string[];
  /** [speaker, Japanese, English] dialogue turns. */
  dlg?: [('p' | 'd'), string, string][];
  v?: VerificationStatus;
  note?: string;
};

export function D(row: DiseaseRow): Disease {
  return {
    id: `dis-${kanaToRomaji(row.kana)}`,
    japanese: row.ja,
    kana: row.kana,
    romaji: kanaToRomaji(row.kana),
    english: row.en,
    indonesian: row.idn,
    layJapanese: row.lay,
    specialties: row.sp,
    severity: row.sev,
    keySymptoms: row.sx,
    relatedTerms: row.rel ?? [],
    historyQuestions: row.hx,
    examinationPhrases: row.exam ?? [],
    investigations: row.tests ?? [],
    investigationExplanations: row.testExplain ?? [],
    patientExplanation: row.explain,
    causeExplanation: row.cause,
    treatmentPhrases: row.tx ?? [],
    redFlagPhrases: row.red ?? [],
    admissionWording: row.admit ?? [],
    relatedDiseases: row.related ?? [],
    dialogue: (row.dlg ?? []).map(([speaker, japanese, english]) => ({
      speaker: speaker === 'p' ? ('patient' as const) : ('doctor' as const),
      japanese,
      english,
    })),
    verificationStatus: row.v ?? 'reviewed',
    notes: row.note,
  };
}

/* ----------------------------- Reading passages ---------------------------- */

export type QuestionRow = {
  id: string;
  prompt: string;
  /** [option text, why it is right or where it goes wrong, trap category?] */
  options: [string, string, ReadingQuestion['options'][number]['trap']?][];
  correct: number;
  explanation: string;
  skill: ReadingQuestion['skill'];
  /** [zero-based paragraph index, the sentence that proves the answer] */
  evidence: [number, string];
  how: string;
  paraphrase?: string;
  vocabRefs?: string[];
  grammarRefs?: string[];
};

export type ReadingRow = {
  id: string;
  title: string;
  titleEn?: string;
  category: ReadingPassage['category'];
  level: ReadingPassage['level'];
  topic: string;
  difficulty: number;
  paragraphs: string[];
  roles: string[];
  questions: QuestionRow[];
  vocabRefs?: string[];
  grammarRefs?: string[];
  source?: ReadingPassage['source'];
  v?: VerificationStatus;
};

/** N2/N1 reading pace used to derive the timer target: ~380 characters a minute. */
const CHARS_PER_MINUTE = 380;

export function R(row: ReadingRow): ReadingPassage {
  const text = row.paragraphs.join('\n\n');
  const characterCount = text.replace(/[\s\u3000]/g, '').length;
  return {
    id: row.id,
    title: row.title,
    titleEn: row.titleEn,
    category: row.category,
    text,
    level: row.level,
    topic: row.topic,
    characterCount,
    estimatedMinutes: Math.max(2, Math.round(characterCount / CHARS_PER_MINUTE)),
    difficulty: row.difficulty,
    vocabularyIds: [],
    grammarIds: [],
    vocabRefs: row.vocabRefs ?? [],
    grammarRefs: row.grammarRefs ?? [],
    paragraphs: row.paragraphs.map((text, index) => ({
      index,
      text,
      kana: japaneseReadingFor(text).kana,
      romaji: japaneseReadingFor(text).romaji,
      indonesian: readingIndonesianFor(row.id, index),
      languageSupportStatus: 'draft' as const,
      role: row.roles[index] ?? 'supporting',
    })),
    questions: row.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options.map(([text, why, trap]) => ({ text, why, trap })),
      correctIndex: q.correct,
      explanation: q.explanation,
      skill: q.skill,
      evidenceParagraph: q.evidence[0],
      evidenceSentence: q.evidence[1],
      howEvidenceWorks: q.how,
      paraphrase: q.paraphrase,
      grammarIds: [],
      vocabularyIds: [],
      vocabRefs: q.vocabRefs ?? [],
      grammarRefs: q.grammarRefs ?? [],
    })),
    source: row.source,
    languageSupportStatus: 'draft',
    verificationStatus: row.v ?? 'reviewed',
  };
}

/* ------------------------------ Clinical cases ----------------------------- */

export type CaseRow = {
  id: string;
  title: string;
  titleJa: string;
  specialty: string;
  difficulty: ClinicalCase['difficulty'];
  setting: string;
  age: number;
  sex: string;
  nationality?: string;
  occupation?: string;
  background?: string;
  complaint: string;
  dx: string;
  opening: string;
  questions: {
    id: string;
    topic: string;
    ask: string[];
    why: string;
    weight?: number;
    redFlag?: boolean;
  }[];
  lines: { id: string; topic: string; ja: string; en: string; idn: string }[];
  findings: string;
  tests: string[];
  teach: string[];
  terms?: string[];
  voice?: string;
};

export function C(row: CaseRow): ClinicalCase {
  const openingReading = japaneseReadingFor(row.opening);
  return {
    id: row.id,
    title: row.title,
    titleJa: row.titleJa,
    specialty: row.specialty,
    difficulty: row.difficulty,
    setting: row.setting,
    patientProfile: {
      age: row.age,
      sex: row.sex,
      nationality: row.nationality,
      occupation: row.occupation,
      background: row.background,
    },
    chiefComplaint: row.complaint,
    hiddenDiagnosis: row.dx,
    openingPhrase: row.opening,
    openingPhraseKana: openingReading.kana,
    openingPhraseRomaji: openingReading.romaji,
    openingPhraseIndonesian: CASE_OPENING_INDONESIAN[row.opening] ?? 'Terjemahan pembuka belum ditambahkan.',
    languageSupportStatus: 'draft',
    requiredQuestions: row.questions.map((q) => ({
      id: q.id,
      topic: q.topic,
      acceptedPhrases: q.ask,
      acceptedPhraseReadings: q.ask.map((japanese) => ({ japanese, ...japaneseReadingFor(japanese) })),
      why: q.why,
      weight: q.weight ?? 2,
      redFlag: q.redFlag ?? false,
    })),
    patientLines: row.lines.map((line) => ({
      id: line.id,
      topic: line.topic,
      japanese: line.ja,
      kana: japaneseReadingFor(line.ja).kana,
      romaji: japaneseReadingFor(line.ja).romaji,
      english: line.en,
      indonesian: line.idn,
    })),
    examinationFindings: row.findings,
    expectedInvestigations: row.tests,
    teachingPoints: row.teach,
    drillTerms: row.terms ?? [],
    voiceNote: row.voice,
  };
}
