import { z } from 'zod';

/* ------------------------------------------------------------------
   J-Med Mastery — content schema

   The domain model is independent of the storage engine. Content is
   authored as typed data, validated with Zod, and consumed by pages and
   the search index. Nothing in this file knows about UI.
------------------------------------------------------------------ */

export const jlptLevelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);

export const difficultyLevelSchema = z.enum([
  'N3',
  'N2',
  'N1',
  'medical-basic',
  'medical-intermediate',
  'medical-advanced',
]);

export const verificationStatusSchema = z.enum(['draft', 'reviewed', 'verified']);
export const junitPrioritySchema = z.enum(['essential', 'common', 'occasional', 'advanced']);

export const sourceSchema = z.object({
  type: z.enum(['book', 'website', 'article', 'personal', 'course']),
  title: z.string().optional(),
  url: z.string().optional(),
  author: z.string().optional(),
  accessedAt: z.string().optional(),
});

export const exampleSentenceSchema = z.object({
  ja: z.string().min(1),
  en: z.string().min(1),
  id: z.string().optional(),
  /** Content id of a grammar pattern or word this example drills. */
  targetId: z.string().optional(),
});

export type ExampleSentence = z.infer<typeof exampleSentenceSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type JlptLevel = z.infer<typeof jlptLevelSchema>;
export type DifficultyLevel = z.infer<typeof difficultyLevelSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

/* -------------------------------- Vocabulary ------------------------------- */

export const vocabularySchema = z.object({
  id: z.string().min(1),
  japanese: z.string().min(1),
  kana: z.string().optional(),
  romaji: z.string().optional(),
  meaningsEn: z.array(z.string()).min(1),
  meaningsId: z.array(z.string()).min(1),
  definitionJa: z.string().optional(),
  partOfSpeech: z.array(z.string()).optional(),
  jlptLevel: jlptLevelSchema.optional(),
  frequencyRank: z.number().optional(),
  tags: z.array(z.string()).default([]),
  examples: z.array(exampleSentenceSchema).default([]),
  synonyms: z.array(z.string()).optional(),
  antonyms: z.array(z.string()).optional(),
  collocations: z.array(z.string()).optional(),
  relatedGrammarIds: z.array(z.string()).optional(),
  medicalRelevance: z.boolean().optional(),
  notes: z.string().optional(),
  source: sourceSchema.optional(),
  verificationStatus: verificationStatusSchema.default('reviewed'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Vocabulary = z.infer<typeof vocabularySchema>;

/* ---------------------------------- Kanji ---------------------------------- */

export const kanjiSchema = z.object({
  id: z.string(),
  kanji: z.string().min(1),
  onyomi: z.array(z.string()).default([]),
  kunyomi: z.array(z.string()).default([]),
  meaningsEn: z.array(z.string()).min(1),
  meaningsId: z.array(z.string()).default([]),
  radicals: z.array(z.string()).default([]),
  strokeCount: z.number().optional(),
  jlptLevel: jlptLevelSchema.optional(),
  commonVocabIds: z.array(z.string()).default([]),
  medicalVocabIds: z.array(z.string()).default([]),
  confusingWith: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export type Kanji = z.infer<typeof kanjiSchema>;

/* --------------------------------- Grammar --------------------------------- */

export const grammarFamilySchema = z.enum([
  'contrast-concession',
  'limitation',
  'evaluation-certainty',
  'negative-nuance',
  'cause-basis',
  'change-correlation',
  'formal-written',
  'condition',
  'time',
  'reference',
]);

export const grammarSchema = z.object({
  id: z.string(),
  pattern: z.string().min(1),
  kana: z.string().optional(),
  reading: z.string(),
  meaning: z.string(),
  meaningsId: z.string().optional(),
  family: grammarFamilySchema,
  jlptLevel: jlptLevelSchema,
  /** Construction / attachment rule, e.g. 「Vた + ものの」 */
  formation: z.string(),
  nuance: z.string(),
  register: z.array(z.enum(['formal', 'written', 'spoken', 'honorific', 'academic'])).default([]),
  whenToUse: z.array(z.string()).min(1),
  whenNotToUse: z.array(z.string()).default([]),
  examples: z.array(exampleSentenceSchema).min(1),
  readingExample: z.string().optional(),
  commonMistakes: z.array(z.object({ wrong: z.string(), right: z.string(), why: z.string() })).default([]),
  similarIds: z.array(z.string()).default([]),
  contrastNote: z.string().optional(),
  relatedVocabularyIds: z.array(z.string()).default([]),
  verificationStatus: verificationStatusSchema.default('reviewed'),
});

export type GrammarEntry = z.infer<typeof grammarSchema>;
/** Shape accepted when authoring grammar by hand (defaults are optional). */
export type GrammarEntryInput = z.input<typeof grammarSchema>;

/* ----------------------------- Reading passages ---------------------------- */

export const readingSkillSchema = z.enum([
  'main-idea',
  'detail',
  'inference',
  'reference',
  'paraphrase',
  'author-intent',
  'structure',
]);

export const mistakeCategorySchema = z.enum([
  'vocabulary',
  'grammar',
  'negation',
  'contrast',
  'inference',
  'main-idea',
  'paraphrase',
  'reference',
  'rushed',
  'overthinking',
  'distractor',
]);

export const readingOptionSchema = z.object({
  text: z.string().min(1),
  /** Why this option is right (correct) or where it goes wrong (distractor). */
  why: z.string().min(1),
  /** Mistake category the learner reveals if they pick this distractor. */
  trap: mistakeCategorySchema.optional(),
});

export const readingQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string().min(1),
  options: z.array(readingOptionSchema).min(2),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
  skill: readingSkillSchema,
  /** Paragraph index (0-based) and the exact sentence that proves the answer. */
  evidenceParagraph: z.number().int().min(0),
  evidenceSentence: z.string().min(1),
  howEvidenceWorks: z.string().min(1),
  paraphrase: z.string().optional(),
  grammarIds: z.array(z.string()).default([]),
  vocabularyIds: z.array(z.string()).default([]),
  /**
   * Japanese surface forms referenced in this question. Resolved to
   * vocabulary / grammar ids at load time by lib/content/relations.ts, so
   * authors never have to hand-compute generated ids.
   */
  vocabRefs: z.array(z.string()).default([]),
  grammarRefs: z.array(z.string()).default([]),
});

export const readingParagraphSchema = z.object({
  index: z.number().int().min(0),
  text: z.string().min(1),
  /** Full-sentence reading support; kept separate from furigana token data. */
  kana: z.string().min(1),
  romaji: z.string().min(1),
  indonesian: z.string().min(1),
  english: z.string().optional(),
  languageSupportStatus: verificationStatusSchema.default('draft'),
  /** Structural role, surfaced during result analysis. */
  role: z.string(),
});

export const readingPassageSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  titleEn: z.string().optional(),
  category: z.enum([
    'notice',
    'email',
    'essay',
    'opinion',
    'explanation',
    'science',
    'health',
    'society',
    'workplace',
    'news',
    'medical-information',
    'hospital-notice',
    'patient-instructions',
  ]),
  text: z.string().min(1),
  level: z.enum(['N3', 'N2', 'N1']),
  topic: z.string(),
  characterCount: z.number(),
  estimatedMinutes: z.number(),
  difficulty: z.number().min(1).max(10),
  vocabularyIds: z.array(z.string()).default([]),
  grammarIds: z.array(z.string()).default([]),
  /** Japanese surface forms to surface after reading (partial matches allowed). */
  vocabRefs: z.array(z.string()).default([]),
  grammarRefs: z.array(z.string()).default([]),
  paragraphs: z.array(readingParagraphSchema).min(1),
  questions: z.array(readingQuestionSchema).min(1),
  source: sourceSchema.optional(),
  languageSupportStatus: verificationStatusSchema.default('draft'),
  verificationStatus: verificationStatusSchema.default('reviewed'),
});

export type ReadingPassage = z.infer<typeof readingPassageSchema>;
export type ReadingQuestion = z.infer<typeof readingQuestionSchema>;
export type ReadingOption = z.infer<typeof readingOptionSchema>;
export type ReadingSkill = z.infer<typeof readingSkillSchema>;
export type MistakeCategory = z.infer<typeof mistakeCategorySchema>;

/* ------------------------------ Medical content ---------------------------- */

export const medicalCategorySchema = z.enum([
  'anatomy',
  'symptom',
  'sign',
  'disease',
  'department',
  'test',
  'imaging',
  'lab',
  'procedure',
  'surgery',
  'medication',
  'dosage-form',
  'vital',
  'hospital',
  'document',
  'medical-device',
  'billing',
  'emergency',
  'allergy',
]);

/**
 * A complete language layer for Register B/C wording. This is deliberately
 * separate from the technical term so patient language cannot lose its own
 * reading, translations, or review state.
 */
export const medicalRegisterSupportSchema = z.object({
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  indonesian: z.string().min(1),
  english: z.string().min(1),
  /** Verification of the authored Japanese wording itself. */
  verificationStatus: verificationStatusSchema.default('reviewed'),
  /** Verification of kana, romaji and translations, which may be generated. */
  languageSupportStatus: verificationStatusSchema.default('draft'),
});

export type MedicalRegisterSupport = z.infer<typeof medicalRegisterSupportSchema>;

export const medicalTermExampleSchema = z.object({
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  indonesian: z.string().min(1),
  english: z.string().min(1),
});

export type MedicalTermExample = z.infer<typeof medicalTermExampleSchema>;

export const medicalTermSchema = z.object({
  id: z.string(),
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  english: z.string().min(1),
  indonesian: z.string().min(1),
  /** Register B — plain-language wording a patient is more likely to follow. */
  patientFriendly: z.string().optional(),
  patientFriendlySupport: medicalRegisterSupportSchema.optional(),
  /** Register C — how a patient tends to describe this themselves. */
  patientExpression: z.string().optional(),
  patientExpressionSupport: medicalRegisterSupportSchema.optional(),
  register: z.literal('technical').default('technical'),
  category: medicalCategorySchema,
  specialties: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  definitionJa: z.string().optional(),
  example: medicalTermExampleSchema.optional(),
  usageNote: z.string().optional(),
  relatedIds: z.array(z.string()).default([]),
  /** Lay synonyms a patient may use, indexed by search. */
  alternativeNames: z.array(z.string()).default([]),
  verificationStatus: verificationStatusSchema.default('reviewed'),
  junitPriority: junitPrioritySchema.default('common'),
  source: sourceSchema.optional(),
  notes: z.string().optional(),
});

export type MedicalTerm = z.infer<typeof medicalTermSchema>;
export type MedicalCategory = z.infer<typeof medicalCategorySchema>;

export const symptomSchema = z.object({
  id: z.string(),
  japanese: z.string().min(1),
  kana: z.string(),
  romaji: z.string().min(1),
  english: z.string().min(1),
  indonesian: z.string().min(1),
  termId: z.string().optional(),
  /** Patient expressions from the checklist: what they actually say. */
  patientExpressions: z.array(z.string()).min(1),
  doctorQuestions: z.array(z.string()).min(1),
  descriptors: z.array(z.string()).default([]),
  severityPhrases: z.array(z.string()).default([]),
  timingPhrases: z.array(z.string()).default([]),
  associatedQuestions: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
  patientFriendlyExplanation: z.string().optional(),
  /** Paired encounter drills: what the patient says → how you respond. */
  exchanges: z
    .array(
      z.object({
        patient: z.string().min(1),
        doctor: z.string().min(1),
        doctorEn: z.string().optional(),
      }),
    )
    .default([]),
  relatedTermIds: z.array(z.string()).default([]),
  relatedSymptomIds: z.array(z.string()).default([]),
  verificationStatus: verificationStatusSchema.default('reviewed'),
});

export type Symptom = z.infer<typeof symptomSchema>;
export type SymptomExchange = Symptom['exchanges'][number];

export const phraseStageSchema = z.enum([
  'greeting',
  'chief-complaint',
  'hpi',
  'pmh',
  'medication',
  'allergy',
  'family',
  'social',
  'examination',
  'investigation',
  'diagnosis',
  'treatment',
  'consent',
  'admission',
  'referral',
  'discharge',
  'follow-up',
  'safety-netting',
  'emergency',
]);

export const clinicalPhraseSchema = z.object({
  id: z.string(),
  intent: z.string().min(1),
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  english: z.string().min(1),
  indonesian: z.string().min(1),
  register: z.enum(['patient-friendly', 'polite', 'formal', 'staff']),
  speaker: z.enum(['doctor', 'nurse', 'patient', 'family', 'staff']).default('doctor'),
  stage: phraseStageSchema,
  /** The real encounter setting, separate from the broad consultation stage. */
  clinicalContext: z.string().min(1),
  nuance: z.string().optional(),
  specialtyTags: z.array(z.string()).default([]),
  /** Alternatives at the same or another register for the same intent. */
  variants: z.array(z.string()).default([]),
  alternativeExpressions: z.array(z.string()).default([]),
  relatedTermIds: z.array(z.string()).default([]),
  relatedDiseaseIds: z.array(z.string()).default([]),
  notes: z.string().optional(),
  audioUrl: z.string().optional(),
  verificationStatus: verificationStatusSchema.default('reviewed'),
  junitPriority: junitPrioritySchema.default('common'),
});

export type ClinicalPhrase = z.infer<typeof clinicalPhraseSchema>;
export type PhraseStage = z.infer<typeof phraseStageSchema>;

const clinicalLineSchema = z.object({
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  indonesian: z.string().min(1),
  english: z.string().min(1),
});

export const medicationSchema = z.object({
  id: z.string(),
  indonesianGeneric: z.string().min(1),
  english: z.string().min(1),
  japanese: z.string().min(1),
  katakana: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  drugClassJapanese: z.string().min(1),
  dosageForms: z.array(z.string()).min(1),
  indicationTerms: z.array(z.string()).default([]),
  whyPrescribed: clinicalLineSchema,
  frequencyInstruction: clinicalLineSchema,
  mealInstruction: clinicalLineSchema,
  prnInstruction: clinicalLineSchema,
  durationInstruction: clinicalLineSchema,
  adverseEffectVocabulary: z.array(clinicalLineSchema).default([]),
  allergyQuestion: clinicalLineSchema,
  pregnancyWording: clinicalLineSchema.optional(),
  reconciliationQuestions: z.array(clinicalLineSchema).default([]),
  aliases: z.array(z.string()).default([]),
  relatedDiseases: z.array(z.string()).default([]),
  relatedClasses: z.array(z.string()).default([]),
  verificationStatus: verificationStatusSchema.default('draft'),
  junitPriority: junitPrioritySchema.default('common'),
});

export type ClinicalLine = z.infer<typeof clinicalLineSchema>;
export type Medication = z.infer<typeof medicationSchema>;

export const investigationSchema = z.object({
  id: z.string(),
  japanese: z.string().min(1),
  kana: z.string().min(1),
  romaji: z.string().min(1),
  indonesian: z.string().min(1),
  english: z.string().min(1),
  category: z.enum(['laboratory', 'imaging', 'functional', 'procedure']),
  specialties: z.array(z.string()).default([]),
  patientExplanation: clinicalLineSchema,
  preparationInstruction: clinicalLineSchema.optional(),
  resultDiscussion: clinicalLineSchema,
  relatedDiseases: z.array(z.string()).default([]),
  relatedTerms: z.array(z.string()).default([]),
  verificationStatus: verificationStatusSchema.default('draft'),
  junitPriority: junitPrioritySchema.default('common'),
});

export type Investigation = z.infer<typeof investigationSchema>;

export const diseaseSchema = z.object({
  id: z.string(),
  japanese: z.string().min(1),
  kana: z.string(),
  romaji: z.string().min(1),
  english: z.string().min(1),
  indonesian: z.string().min(1),
  /** Lay Japanese term patients recognise. */
  layJapanese: z.string().optional(),
  specialties: z.array(z.string()).min(1),
  severity: z.enum(['routine', 'urgent', 'emergency']),
  keySymptoms: z.array(z.string()).min(1),
  relatedTerms: z.array(z.string()).default([]),
  historyQuestions: z.array(z.string()).min(1),
  examinationPhrases: z.array(z.string()).default([]),
  investigations: z.array(z.string()).default([]),
  investigationExplanations: z.array(z.string()).default([]),
  patientExplanation: z.string().min(1),
  causeExplanation: z.string().optional(),
  treatmentPhrases: z.array(z.string()).default([]),
  redFlagPhrases: z.array(z.string()).default([]),
  admissionWording: z.array(z.string()).default([]),
  relatedDiseases: z.array(z.string()).default([]),
  dialogue: z.array(z.object({ speaker: z.enum(['patient', 'doctor']), japanese: z.string(), english: z.string() })).default([]),
  verificationStatus: verificationStatusSchema.default('draft'),
  notes: z.string().optional(),
});

export type Disease = z.infer<typeof diseaseSchema>;

/* ------------------------------- Clinical cases ---------------------------- */

export const clinicalCaseSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  titleJa: z.string().min(1),
  specialty: z.string(),
  difficulty: z.enum(['basic', 'intermediate', 'advanced', 'emergency']),
  setting: z.string(),
  patientProfile: z.object({
    age: z.number(),
    sex: z.string(),
    nationality: z.string().optional(),
    occupation: z.string().optional(),
    background: z.string().optional(),
  }),
  chiefComplaint: z.string(),
  hiddenDiagnosis: z.string(),
  openingPhrase: z.string(),
  openingPhraseKana: z.string().min(1),
  openingPhraseRomaji: z.string().min(1),
  openingPhraseIndonesian: z.string().min(1),
  languageSupportStatus: verificationStatusSchema.default('draft'),
  /** Questions that a safe clinician asks. weight = clinical importance. */
  requiredQuestions: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      /** How the learner can ask it (any of these counts as asked). */
      acceptedPhrases: z.array(z.string()).min(1),
      acceptedPhraseReadings: z.array(z.object({ japanese: z.string(), kana: z.string(), romaji: z.string() })).default([]),
      why: z.string(),
      weight: z.number().min(1).max(3),
      redFlag: z.boolean().default(false),
    }),
  ).min(4),
  patientLines: z.array(
    z.object({
      id: z.string(),
      /** Question topic this line answers. */
      topic: z.string(),
      japanese: z.string(),
      kana: z.string().min(1),
      romaji: z.string().min(1),
      english: z.string(),
      indonesian: z.string(),
    }),
  ).min(4),
  examinationFindings: z.string(),
  expectedInvestigations: z.array(z.string()).min(1),
  teachingPoints: z.array(z.string()).min(1),
  drillTerms: z.array(z.string()).default([]),
  voiceNote: z.string().optional(),
});

export type ClinicalCase = z.infer<typeof clinicalCaseSchema>;

/* ------------------------------- Personal data ----------------------------- */

export const reviewRatingSchema = z.enum(['again', 'hard', 'good', 'easy']);
export type ReviewRating = z.infer<typeof reviewRatingSchema>;

export const contentTypeSchema = z.enum(['vocabulary', 'grammar', 'medical-term', 'clinical-phrase', 'disease', 'symptom', 'medication', 'investigation']);
export type ContentType = z.infer<typeof contentTypeSchema>;

export const reviewItemSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  contentType: contentTypeSchema,
  due: z.string(),
  stability: z.number().default(0),
  difficulty: z.number().default(0),
  reps: z.number().default(0),
  lapses: z.number().default(0),
  state: z.enum(['new', 'learning', 'review', 'relearning']).default('new'),
  lastRating: reviewRatingSchema.optional(),
  lastReviewedAt: z.string().optional(),
  createdAt: z.string(),
  /** Set when the learner suspends an item out of the queue. */
  suspended: z.boolean().optional(),
});

export type ReviewItem = z.infer<typeof reviewItemSchema>;

export const mistakeRecordSchema = z.object({
  id: z.string(),
  contentId: z.string(),
  contentType: z.string(),
  category: mistakeCategorySchema,
  /** Free text context, e.g. the question stem or the chosen distractor. */
  note: z.string().optional(),
  questionId: z.string().optional(),
  passageId: z.string().optional(),
  createdAt: z.string(),
  resolved: z.boolean().optional(),
});

export type MistakeRecord = z.infer<typeof mistakeRecordSchema>;

export const noteSchema = z.object({
  id: z.string(),
  kind: z.enum(['vocabulary', 'grammar', 'phrase', 'reading', 'disease', 'custom']),
  title: z.string(),
  body: z.string().default(''),
  tags: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  favorite: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Note = z.infer<typeof noteSchema>;

export const readingAttemptSchema = z.object({
  id: z.string(),
  passageId: z.string(),
  startedAt: z.string(),
  finishedAt: z.string(),
  secondsSpent: z.number(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      chosenIndex: z.number(),
      correct: z.boolean(),
      skill: readingSkillSchema,
      category: mistakeCategorySchema.optional(),
      secondsSpent: z.number().default(0),
    }),
  ),
  score: z.number(),
  total: z.number(),
});

export type ReadingAttempt = z.infer<typeof readingAttemptSchema>;

export const caseAttemptSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  finishedAt: z.string(),
  mode: z.enum(['guided', 'multiple-choice', 'free-response']),
  askedQuestionIds: z.array(z.string()),
  missedQuestionIds: z.array(z.string()),
  missedRedFlags: z.array(z.string()),
  score: z.number(),
  maxScore: z.number(),
  notes: z.string().optional(),
});

export type CaseAttempt = z.infer<typeof caseAttemptSchema>;

export const studyLogEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  kind: z.enum(['review', 'reading', 'case', 'term', 'note']),
  /** Content type or module label, used by the consistency heatmap. */
  area: z.string(),
  amount: z.number().default(1),
});

export type StudyLogEntry = z.infer<typeof studyLogEntrySchema>;
