# Product Requirements Document

## 1. Product name

**J-Med Mastery**

A personal web application for advanced Japanese learning and medical Japanese.

---

## 2. Problem statement

The target user already possesses an intermediate level of Japanese, but faces two major problems.

### Problem A: Advanced Japanese is fragmented

The user can understand a lot of Japanese but still struggles when content becomes dense, abstract, long, or inferential.

Typical failure points include:

- slow reading,
- unknown vocabulary interrupting comprehension,
- knowing a word passively but not recognizing it quickly,
- confusing similar grammar,
- difficulty finding the writer's main point,
- difficulty identifying contrast, concession, cause, implication, and stance,
- over-translating sentence by sentence,
- rereading repeatedly,
- difficulty under time pressure,
- and weak retention after studying.

### Problem B: General Japanese does not equal clinical Japanese

A doctor needs a specialized register that ordinary Japanese resources rarely teach.

Clinical communication requires knowledge of:

- symptoms,
- anatomy,
- disease names,
- medical departments,
- medications,
- allergies,
- investigations,
- procedures,
- risk explanation,
- consent,
- admission,
- discharge,
- referral,
- emergencies,
- patient-friendly phrasing,
- polite Japanese,
- and medical documentation vocabulary.

The user needs to be able to understand both:
- what a Japanese patient says,
- and what a doctor should say back.

---

# 3. Product goals

## Goal 1: Improve advanced Japanese reading

The system should train:

- reading speed,
- vocabulary recognition,
- grammar parsing,
- logical structure,
- inference,
- paraphrase recognition,
- main idea extraction,
- author stance,
- reference tracking,
- and question strategy.

## Goal 2: Build clinically useful Japanese

The system should help the user perform:

- registration interaction,
- triage,
- history taking,
- review of systems,
- medication reconciliation,
- allergy assessment,
- physical examination instructions,
- investigation explanation,
- diagnosis explanation,
- treatment explanation,
- informed consent,
- admission,
- discharge,
- follow-up,
- referral,
- emergency communication,
- and family communication.

## Goal 3: Centralize all learning

The website should become the user's personal Japanese database.

Every item should be:
- searchable,
- taggable,
- reviewable,
- linked to related content,
- and trackable.

## Goal 4: Convert passive knowledge into active recall

Every content item should support one or more study modes:

- recognition,
- recall,
- cloze,
- listening,
- production,
- reading,
- clinical simulation.

---

# 4. Non-goals

The first version does not need to:

- replace formal medical interpreters,
- provide legally binding translations,
- diagnose patients,
- generate unsupervised medical advice,
- become a full beginner Japanese course,
- teach kana from scratch,
- reproduce copyrighted JLPT questions,
- or function as a hospital electronic medical record.

---

# 5. Target user level

Primary target:
- approximately JLPT N3–N2 or equivalent functional Japanese,
- strong enough to study mainly in Japanese,
- but not yet consistently comfortable with advanced reading or clinical interaction.

The system should allow content difficulty labels:

- N3
- N2
- N1
- Medical Basic
- Medical Intermediate
- Medical Advanced

---

# 6. Primary user journeys

## Journey A: Daily study

1. User opens dashboard.
2. Sees today's review queue.
3. Reviews due vocabulary and grammar.
4. Completes one reading drill.
5. Completes one clinical scenario.
6. Reviews mistakes.
7. Weak items are automatically rescheduled.

## Journey B: Preparing for a Japanese patient

1. User searches a disease, symptom, or department.
2. Opens a clinical topic page.
3. Reviews:
   - key words,
   - patient phrases,
   - doctor questions,
   - explanation phrases,
   - examination commands,
   - red flags,
   - discharge wording.
4. Saves important phrases to quick review.

## Journey C: Reading training

1. User selects reading difficulty.
2. Reads passage under optional timer.
3. Answers questions.
4. Receives explanation not only of the answer but:
   - paragraph role,
   - logical connectors,
   - trap choices,
   - paraphrases,
   - unknown vocabulary,
   - inference clues.
5. Missed vocabulary is added to SRS.

## Journey D: Clinical consultation simulation

1. User selects a case.
2. Patient speaks in Japanese.
3. User chooses or types a response.
4. System scores:
   - clinical completeness,
   - politeness,
   - naturalness,
   - vocabulary,
   - safety.
5. System identifies missing questions.

---

# 7. Product modules

## 7.1 Dashboard

Must show:

- due reviews,
- daily goal,
- streak,
- reading minutes,
- words learned,
- medical phrases mastered,
- recent mistakes,
- weak categories,
- study history,
- quick-launch buttons.

Recommended quick actions:
- Start Daily Review
- Reading Drill
- Clinical Case
- Search Medical Japanese
- Add New Word
- Review Mistakes

---

## 7.2 Vocabulary module

Each vocabulary entry should include:

- Japanese word,
- kana reading,
- romaji optional and hidden by default,
- part of speech,
- English meaning,
- Indonesian meaning,
- simple Japanese definition,
- example sentence,
- example translation,
- JLPT level,
- frequency,
- tags,
- synonyms,
- antonyms,
- related words,
- collocations,
- pitch accent optional,
- medical relevance,
- source,
- personal note,
- mnemonic,
- mastery status.

Study modes:
- Japanese → meaning
- meaning → Japanese
- audio → word
- cloze sentence
- synonym distinction
- sentence production

---

## 7.3 Kanji module

Each kanji page should show:

- kanji,
- onyomi,
- kunyomi,
- meanings,
- radicals/components,
- common vocabulary,
- medical vocabulary,
- confusing kanji,
- example sentences,
- frequency,
- stroke order optional.

Medical kanji collections should include:
- organs,
- symptoms,
- pathology,
- procedures,
- medications,
- hospital terminology.

---

## 7.4 Grammar module

Each grammar entry:

- pattern,
- meaning,
- formation,
- nuance,
- register,
- when to use,
- when not to use,
- similar grammar,
- contrast table,
- examples,
- reading example,
- production exercise.

Critical feature:
**Compare similar grammar side-by-side.**

Examples:
- によって vs によると
- わけではない vs とは限らない
- に違いない vs はずだ
- ものの vs ながら
- ことから vs ために
- に伴って vs につれて

---

## 7.5 Reading trainer

This is a flagship module.

Reading categories:
- short notices,
- emails,
- essays,
- opinion pieces,
- explanations,
- science,
- health,
- society,
- workplace,
- news-style articles,
- medical information,
- hospital notices,
- patient instructions.

Features:

- optional timer,
- paragraph numbering,
- hover/tap dictionary,
- furigana toggle,
- highlight logical connectors,
- sentence structure breakdown,
- unknown word marking,
- confidence score,
- question review,
- detailed explanations.

The explanation engine should identify:
- topic,
- main claim,
- paragraph purpose,
- contrast,
- examples,
- cause/effect,
- concession,
- conclusion,
- pronoun/reference targets,
- paraphrases,
- distractor logic.

---

## 7.6 Reading mistake notebook

Every wrong answer should create a mistake record.

Categories:
- vocabulary failure,
- grammar failure,
- missed negation,
- missed contrast,
- inference error,
- main idea error,
- paraphrase error,
- reference tracking error,
- rushed reading,
- overthinking,
- distractor selected.

Dashboard should show recurring mistake patterns.

---

## 7.7 Medical dictionary

Searchable bilingual/trilingual dictionary:

Japanese ↔ English ↔ Indonesian.

Categories:
- anatomy,
- symptom,
- sign,
- disease,
- department,
- test,
- imaging,
- lab,
- procedure,
- surgery,
- medication,
- dosage form,
- allergy,
- emergency,
- obstetrics,
- pediatrics,
- internal medicine,
- surgery,
- orthopedics,
- neurology,
- psychiatry,
- dermatology,
- ENT,
- ophthalmology,
- urology,
- cardiology,
- pulmonology,
- gastroenterology,
- endocrinology,
- infectious disease.

Each item should distinguish:

**Medical term**
vs
**Patient-friendly wording**

Example:
- 高血圧症
- 血圧が高い状態

---

## 7.8 Clinical phrasebook

Organized by consultation flow.

### Opening
- greeting
- identity
- preferred language
- interpreter needs

### Chief complaint
- What brings you here today?
- When did it start?
- Where does it hurt?

### HPI
- onset
- location
- duration
- character
- aggravating factors
- relieving factors
- timing
- severity
- associated symptoms

### Past history

### Medication

### Allergy

### Family history

### Social history

### Physical examination

### Investigation

### Diagnosis

### Plan

### Safety netting

### Discharge

### Follow-up

All phrase pages should support:
- polite standard,
- simpler patient-friendly version,
- more formal version,
- kana,
- translation,
- audio.

---

## 7.9 Disease pages

Each disease page should contain:

1. Japanese disease name
2. kana
3. English
4. Indonesian
5. common lay term
6. key symptoms
7. key questions to ask
8. key vocabulary
9. examination instructions
10. tests to explain
11. simple patient explanation
12. treatment explanation phrases
13. admission/discharge vocabulary
14. red flag wording
15. example mini-dialogue

---

## 7.10 Symptom pages

Examples:
- 発熱
- 頭痛
- めまい
- 胸痛
- 動悸
- 息切れ
- 咳
- 痰
- 腹痛
- 吐き気
- 嘔吐
- 下痢
- 便秘
- 血便
- 排尿痛
- 血尿
- 腰痛
- しびれ
- 脱力
- 発疹

Each symptom page should include:
- patient expressions,
- doctor questions,
- descriptors,
- severity phrases,
- timing phrases,
- associated symptom questions.

---

## 7.11 Clinical scenario simulator

Case structure:

- setting,
- patient demographics,
- chief complaint,
- hidden diagnosis,
- required history points,
- red flags,
- expected examination,
- expected plan,
- Japanese dialogue,
- scoring rubric.

Modes:
- multiple choice,
- ordered dialogue,
- free text,
- voice later.

Difficulty:
- basic
- intermediate
- advanced
- emergency

---

## 7.12 Personal notebook

User can create:

- vocabulary note,
- grammar note,
- phrase note,
- disease note,
- reading note,
- custom deck.

Support:
- Markdown,
- tags,
- backlinks,
- favorites,
- search.

---

## 7.13 SRS review system

Each review item should use spaced repetition.

Recommended initial algorithm:
- FSRS if practical,
- otherwise SM-2-compatible implementation.

Review rating:
- Again
- Hard
- Good
- Easy

Track:
- stability,
- difficulty,
- repetitions,
- lapses,
- due date,
- last reviewed.

---

# 8. Search

Global search is essential.

Search should find:
- Japanese,
- kana,
- English,
- Indonesian,
- synonyms,
- tags,
- medical categories,
- phrase contents.

Example searches:
- chest pain
- 胸痛
- nyeri dada
- heart attack
- 心筋梗塞
- how to ask allergy

---

# 9. Content linking

All content should be interconnected.

Example:

`胸痛`
links to:
- 胸部
- 心筋梗塞
- 狭心症
- 息切れ
- 動悸
- 心電図
- 採血
- 循環器内科

This graph structure is a major product advantage.

---

# 10. Progress metrics

Track:

### General Japanese
- vocabulary mastered
- grammar mastered
- reading accuracy
- reading speed
- average passage time
- inference accuracy
- main idea accuracy

### Medical Japanese
- terms mastered
- phrases mastered
- cases completed
- history completeness
- clinical topic coverage

### Review
- due items
- retention rate
- lapses
- weak tags

---

# 11. Gamification

Use light gamification only.

Acceptable:
- streak
- XP
- daily target
- progress rings
- mastery levels
- achievements

Avoid:
- childish visuals
- excessive animations
- intrusive rewards

---

# 12. Accessibility

- responsive design,
- keyboard navigation,
- high contrast,
- scalable Japanese text,
- readable line spacing,
- dark mode,
- mobile-first review mode.

---

# 13. Safety

The site is a language-learning tool.

Medical content should be labeled:
- educational,
- not a replacement for hospital protocols,
- not a replacement for professional medical interpretation where required.

Clinical phrase templates should avoid implying that the application is making a diagnosis.

---

# 14. Future features

- text-to-speech,
- speech recognition,
- pronunciation feedback,
- OCR import,
- browser extension,
- article import,
- AI reading tutor,
- AI patient simulation,
- automatic phrase extraction,
- Anki import/export,
- JLPT-style mock exams,
- hospital-specific phrase packs,
- offline PWA.
