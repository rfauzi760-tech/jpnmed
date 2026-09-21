# Data Schema

The implementation may use SQLite, PostgreSQL, Supabase, or a typed JSON repository for an early local-first version.

The domain model should remain independent of the storage engine.

---

# 1. Vocabulary

```ts
type Vocabulary = {
  id: string
  japanese: string
  kana?: string
  romaji?: string
  meaningsEn: string[]
  meaningsId: string[]
  definitionJa?: string
  partOfSpeech?: string[]
  jlptLevel?: "N5" | "N4" | "N3" | "N2" | "N1"
  frequencyRank?: number
  tags: string[]
  examples: ExampleSentence[]
  synonyms?: string[]
  antonyms?: string[]
  relatedIds?: string[]
  medicalRelevance?: boolean
  notes?: string
  source?: Source
  createdAt: string
  updatedAt: string
}
```

---

# 2. Clinical phrase

```ts
type ClinicalPhrase = {
  id: string
  intent: string
  japanese: string
  kana?: string
  english: string
  indonesian: string
  register: "patient-friendly" | "polite" | "formal" | "staff"
  stage:
    | "opening"
    | "chief-complaint"
    | "hpi"
    | "pmh"
    | "medication"
    | "allergy"
    | "social"
    | "examination"
    | "investigation"
    | "diagnosis"
    | "treatment"
    | "consent"
    | "discharge"
    | "emergency"
  specialtyTags: string[]
  relatedTermIds?: string[]
  audioUrl?: string
  notes?: string
}
```

---

# 3. Disease

```ts
type Disease = {
  id: string
  japanese: string
  kana?: string
  english: string
  indonesian: string
  layJapanese?: string
  specialties: string[]
  keySymptoms: string[]
  relatedTerms: string[]
  historyQuestions: string[]
  examinationPhrases: string[]
  investigations: string[]
  patientExplanation?: string
  treatmentPhrases: string[]
  redFlagPhrases: string[]
  relatedDiseases?: string[]
  notes?: string
}
```

---

# 4. Reading passage

```ts
type ReadingPassage = {
  id: string
  title: string
  text: string
  level: "N3" | "N2" | "N1"
  topic: string
  characterCount: number
  estimatedMinutes: number
  difficulty: number
  vocabularyIds: string[]
  grammarIds: string[]
  paragraphs: ReadingParagraph[]
  questions: ReadingQuestion[]
  source?: Source
}
```

---

# 5. Reading question

```ts
type ReadingQuestion = {
  id: string
  passageId: string
  prompt: string
  options: string[]
  correctIndex: number
  explanation: string
  skill:
    | "main-idea"
    | "detail"
    | "inference"
    | "reference"
    | "paraphrase"
    | "author-intent"
    | "structure"
}
```

---

# 6. Mistake record

```ts
type MistakeRecord = {
  id: string
  contentId: string
  contentType: string
  category:
    | "vocabulary"
    | "grammar"
    | "negation"
    | "contrast"
    | "inference"
    | "main-idea"
    | "paraphrase"
    | "reference"
    | "rushed"
    | "overthinking"
  note?: string
  createdAt: string
}
```

---

# 7. SRS item

```ts
type ReviewItem = {
  id: string
  contentId: string
  contentType: string
  due: string
  stability?: number
  difficulty?: number
  repetitions: number
  lapses: number
  lastRating?: "again" | "hard" | "good" | "easy"
  lastReviewedAt?: string
}
```

---

# 8. Clinical case

```ts
type ClinicalCase = {
  id: string
  title: string
  specialty: string
  difficulty: "basic" | "intermediate" | "advanced" | "emergency"
  patientProfile: {
    age: number
    sex: string
    nationality?: string
  }
  chiefComplaint: string
  hiddenDiagnosis?: string
  requiredQuestions: string[]
  redFlags: string[]
  dialogueTurns: DialogueTurn[]
  teachingPoints: string[]
}
```

---

# 9. Source

```ts
type Source = {
  type: "book" | "website" | "article" | "personal" | "course"
  title?: string
  url?: string
  author?: string
  accessedAt?: string
}
```
