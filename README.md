# Japanese Medical Mastery — Product Specification Pack

## Project purpose

**Japanese Medical Mastery** is a personal study web application for an intermediate-to-advanced Japanese learner who is also a practicing doctor.

The product has two equally important goals:

1. **Advanced Japanese proficiency**
   - Especially reading comprehension, speed, vocabulary depth, grammar recognition, and inference.
   - Designed for a learner who already knows a substantial amount of Japanese but repeatedly struggles with advanced exam-style reading.

2. **Clinical Japanese for real hospital work**
   - Communicating safely and naturally with Japanese patients and expatriates.
   - Taking history, explaining examination findings, discussing tests, giving instructions, explaining diagnoses, medications, procedures, admission, discharge, referral, consent, and emergencies.
   - Building a searchable medical Japanese knowledge base covering vocabulary, phrases, disease names, anatomy, symptoms, drugs, tests, departments, forms, honorific language, and culturally appropriate communication.

This repository contains the product and content specification that an AI coding agent should follow.

---

## Core design philosophy

This must **not** feel like a generic flashcard website or a beginner Japanese course.

The user is already intermediate/advanced. The site should behave more like:

- a personal Japanese knowledge OS,
- a reading trainer,
- a clinical phrasebook,
- a spaced repetition system,
- a medical terminology database,
- a case simulator,
- and a progress dashboard.

The application should make it easy to move from:

**recognition → understanding → recall → production → clinical application**

---

## Recommended files

Read these in order:

1. `PRD.md`
2. `CURRICULUM.md`
3. `MEDICAL_JAPANESE_SPEC.md`
4. `CONTENT_ARCHITECTURE.md`
5. `DATA_SCHEMA.md`
6. `UX_UI.md`
7. `CONTENT_STYLE_GUIDE.md`
8. `AGENTS.md`
9. `IMPLEMENTATION_PLAN.md`
10. `QA_ACCEPTANCE.md`

---

## Product working name

**J-Med Mastery**

Alternative names:
- J-Med OS
- Nihongo MD
- ClinNihongo
- MedNihongo
- Japanese for Doctors
- 医療日本語 Mastery

The implementation should keep branding configurable.

---

## Primary user

A doctor who:
- already has intermediate Japanese,
- has difficulty with advanced reading,
- wants stronger vocabulary and grammar recall,
- works in a hospital that has a Japanese expatriate service/unit,
- wants to speak directly and safely with Japanese patients,
- wants one personal website to organize all study material.

---

## Deploying to Vercel

This is a standard Next.js App Router project — no database, no environment variables.
All progress data lives in the browser's localStorage.

```bash
npm install
npm run build   # typecheck + production build
npm test        # vitest, content integrity included
```

To deploy: push to a Git repository and import it at vercel.com, or run `npx vercel` from
this folder. Framework preset is auto-detected as Next.js; build command `next build`,
output is handled automatically. Node 20 or newer.

---

## High-level success criteria

The product is successful if the user can:

- read advanced Japanese faster and with less rereading,
- identify why an answer in a reading question is correct or incorrect,
- actively recall high-frequency advanced vocabulary,
- distinguish similar grammar patterns,
- understand real-world hospital Japanese,
- perform a complete medical interview in Japanese,
- explain common conditions and investigations in Japanese,
- switch between patient-friendly and professional terminology,
- search any disease/symptom/phrase quickly,
- review weak areas automatically,
- and see measurable progress over time.
