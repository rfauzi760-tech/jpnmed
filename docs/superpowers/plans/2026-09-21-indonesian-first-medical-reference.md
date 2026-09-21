# Indonesian-First Medical Reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the existing Medical module into an Indonesian-first Japanese clinical communication reference with mandatory romaji, universal search, J-Unit Mode, relationship-driven content, SRS integration, and visible RFSmed coverage.

**Architecture:** Preserve the existing local-first Next.js architecture. Normalize authored rows into strict Zod-backed domain objects, derive one relation graph and one universal in-memory search index, and add focused Medical components that consume those services. Use a local RFSmed inventory snapshot as a coverage target; use Jisho only for explicit draft enrichment.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Zod, Vitest, browser localStorage, existing `StudyProvider` and SRS APIs.

## Global Constraints

- Bahasa Indonesia is the primary Medical explanation language; English is secondary and toggleable.
- Every normalized medical term has Japanese, kana, romaji, Indonesian, English, category, specialty, registers, relations, and verification status.
- Every normalized clinical phrase has Japanese, full kana, full romaji, Indonesian, English, speaker, consultation stage, register, tags, and related content.
- Japanese text and stable IDs are canonical; romaji is required data but never an identifier.
- RFSmed is an inventory/source reference; do not duplicate its calculators, dosing engines, scores, interactions, or clinical decision support.
- Jisho results are draft-only and cannot auto-promote to `verified`.
- Keep current Medical pages and routes working while expanding them.
- Persist preferences and study actions locally; do not add accounts or a server database.
- Use `apply_patch` for edits. Verify with `npm test`, `npm run typecheck`, and `npm run build`.

## Existing boundaries

- `lib/content/schema.ts`: domain and Zod contracts.
- `lib/content/builders.ts`: compact authored-row builders.
- `lib/content/index.ts`: parsed collections, ID maps, and integrity checks.
- `lib/content/taxonomy.ts`: Medical categories, specialties, stages, and labels.
- `lib/content/links.ts`: personal-data content links.
- `lib/content/quick.ts`: quick clinical lookup index.
- `lib/search/index.ts`: local universal search.
- `lib/store/types.ts`, `lib/store/storage.ts`, `lib/store/provider.tsx`: profile and SRS.
- `components/medical/*`: existing Medical UI.
- `components/shell/command-palette.tsx`: global search UI.
- `components/settings/settings-panel.tsx`: settings UI.
- `app/medical/*`: existing Medical routes.
- `tests/*.test.ts`: current 64-test suite.

## RFSmed source baseline

Create a source snapshot in `lib/content/rfsmed.ts` with `url: 'https://rfsmed.vercel.app'`, `observedAt: '2026-09-21'`, and counts: drugs 518, guidelines 340, ICD-10 638, scores 163, calculators 29, imaging 159, interactions 2479. Include the source specialty catalog (emergency medicine, internal medicine, pediatrics, neonatology, obstetrics and gynecology, infectious disease, cardiology, pulmonology, gastroenterology, hepatology, nephrology, hypertension, endocrinology, neurology, hematology, oncology, surgery, orthopedics, urology, ENT, ophthalmology, dermatology, psychiatry, anesthesiology, intensive care, geriatrics, palliative care, nutrition, nursing, toxicology). Store only inventory and links; mark unmapped concepts explicitly.

## Task 1: Strict romaji-complete Medical contracts

**Files:** Modify `lib/content/schema.ts`, `lib/content/builders.ts`, `lib/content/index.ts`, `lib/content/data/medicalTerms.ts`, `lib/content/data/phrases.ts`, and `lib/content/data/diseases.ts`; test `tests/content.test.ts`.

**Produces:** normalized terms and phrases with required romaji, structured disease lines, speaker metadata, and expanded J-Unit stages.

- [ ] Add failing tests asserting every `MEDICAL_TERMS` row has non-empty `kana` and `romaji`; every `PHRASES` row has non-empty `kana`, `romaji`, and `speaker` from `doctor | patient | family | staff`; and every `disease.historyQuestions` row has `japanese`, `kana`, `romaji`, and `indonesian`.
- [ ] Run `npm test -- tests/content.test.ts`; capture the expected failure.
- [ ] Add `medicalLineSchema` with required `japanese`, `kana`, `romaji`, `indonesian`, optional `english`; export `MedicalLine`.
- [ ] Add `phraseSpeakerSchema` for `doctor | patient | family | staff`.
- [ ] Add J-Unit stage IDs: `greeting`, `identification`, `chief-complaint`, `hpi`, `associated-symptoms`, `red-flags`, `pmh`, `medication`, `allergy`, `family`, `social`, `examination`, `differential`, `investigation`, `test-instructions`, `results`, `diagnosis`, `treatment`, `medication-instructions`, `consent`, `referral`, `admission`, `discharge`, `follow-up`, `safety-netting`, `closing`.
- [ ] Make normalized medical-term and clinical-phrase schemas require kana, romaji, and verification status. Add phrase speaker, J-Unit stage, clinical tags, and related disease IDs.
- [ ] Change disease sentence arrays and dialogue turns to structured `MedicalLine` data. Extend `DiseaseRow`/`PhraseRow` and builders. Derive term/phrase romaji from canonical kana with `kanaToRomaji`; require explicit kana and Indonesian for newly authored disease lines.
- [ ] Parse medical terms, phrases, symptoms, and diseases through Zod in `lib/content/index.ts`; include collection, ID, and field in errors. Do not silently synthesize missing clinical translations.
- [ ] Update current starter disease rows until the new integrity tests pass. Run `npm test`, then commit with `git commit -m "feat: make medical content romaji complete"`.

## Task 2: Medication, investigation, relation, and coverage model

**Files:** Create `lib/content/data/medications.ts`, `lib/content/data/investigations.ts`, `lib/content/rfsmed.ts`, and `lib/content/relations.ts`; modify `lib/content/schema.ts`, `lib/content/index.ts`, `lib/content/taxonomy.ts`, and `lib/content/links.ts`; test `tests/medical-reference.test.ts`.

**Produces:** `MEDICATIONS`, `INVESTIGATIONS`, `RFSMED_INVENTORY`, relation helpers, and coverage report.

- [ ] Add failing tests for `relatedForDisease('dis-shinkinkousoku')` returning symptoms, investigations, and phrases; `relatedForTerm('med-kyoutsuu')` returning connected phrases or diseases; and `coverageReport()` keeping `mappedConcepts <= totalConcepts` with incomplete items present.
- [ ] Run `npm test -- tests/medical-reference.test.ts`; capture the expected failure.
- [ ] Add `medicationSchema` requiring Indonesian generic, INN, Japanese, kana, romaji, Japanese class, dosage forms, indications, communication lines, adverse-effect terms, allergy/pregnancy/reconciliation lines, aliases, related diseases/classes, RFSmed path, and verification status.
- [ ] Add `investigationSchema` requiring Japanese, kana, romaji, Indonesian, English, category, explanation lines, instruction lines, related diseases/terms, and verification status.
- [ ] Author starter medication entries for paracetamol, ibuprofen, amoxicillin, amoxicillin-clavulanate, ceftriaxone, azithromycin, salbutamol, ipratropium, omeprazole, ondansetron, metformin, insulin, amlodipine, furosemide, aspirin, clopidogrel, warfarin, apixaban, diazepam, and epinephrine.
- [ ] Author investigation entries for blood, urine, stool, ECG, chest X-ray, CT, MRI, ultrasound, echocardiogram, endoscopy, biopsy, spirometry, pulse oximetry, and lumbar puncture. Each entry must have Japanese, kana, romaji, Indonesian, English, and at least one reviewed communication line or visible `draft` status.
- [ ] Add `RFSmedInventoryItem` and mapping status `not-mapped | mapped | partial | verified`; keep only inventory metadata and source links.
- [ ] Add `RelatedContent` with terms, symptoms, diseases, phrases, medications, investigations, and cases. Export `relatedForTerm`, `relatedForDisease`, `relatedForSymptom`, and `coverageReport`.
- [ ] Resolve authored Japanese names and stable IDs centrally, de-duplicate results, keep deterministic order, and return empty arrays for missing links.
- [ ] Extend content exports, `CONTENT_TYPE_LABELS`, link-index types, and review content types for medications/investigations. Run targeted/full tests and commit `feat: add clinical relations and RFSmed coverage model`.

## Task 3: Indonesian-first universal search and Jisho draft lookup

**Files:** Modify `lib/search/index.ts`, `app/api/search-index/route.ts`, `components/shell/command-palette.tsx`, `components/medical/search-box.tsx`, and `lib/content/taxonomy.ts`; create `app/api/jisho/route.ts`, `components/medical/jisho-draft-lookup.tsx`, and `app/medical/search/page.tsx`; test `tests/search.test.ts` and `tests/jisho.test.ts`.

**Produces:** grouped search over all content plus explicitly labeled Jisho draft results.

- [ ] Add tests for `demam`, `kyoutsuu`, `胸痛`, `きょうつう`, `chest pain`, `nyeri dada`, `how to ask about allergy`, medication names, investigations, and result grouping. Assert `demam` returns related medical content where starter relations exist.
- [ ] Run `npm test -- tests/search.test.ts`; capture the expected failure.
- [ ] Extend `SearchType` with `medication`, `investigation`, `procedure`, `department`, and `jisho-draft`. Extend `SearchDoc` with source label, verification status, and related IDs. Index romaji, aliases, patient wording, Indonesian, English, indication terms, specialty, and relation labels. Add Indonesian exact/word-prefix scoring before broad context matches.
- [ ] Create `/medical/search` with a controlled input, grouped results, match-field labels in Indonesian, loading skeleton, empty state, query-preserving Jisho action, and links to full pages. Keep `⌘K`/`Ctrl+K` and add `Open full Medical search` to the palette.
- [ ] Create `/api/jisho` accepting only `q` length 1–80, fetching `https://jisho.org/api/v1/search/words?keyword=...`, capping 8 results, returning word/reading/English/source metadata, 400 for invalid query, 502 for upstream failure, and never writing to curated content/localStorage.
- [ ] Create `JishoDraftLookup` with the Indonesian warning `Hasil Jisho adalah referensi bahasa umum, bukan terjemahan medis terverifikasi.` and copy-to-draft only. Run tests and commit `feat: add Indonesian-first medical search`.

## Task 4: Persist Medical language display preferences

**Files:** Modify `lib/store/types.ts`, `lib/store/storage.ts`, `lib/store/provider.tsx`, `components/settings/settings-panel.tsx`, `components/study/prefs.tsx`, and `components/japanese.tsx`; create `components/medical/language-controls.tsx`; test `tests/settings.test.ts`.

**Produces:** profile v4 with `furigana: always | difficult | off`, `romaji: always | hover | off`, `showIndonesian`, and `showEnglish`.

- [ ] Add migration tests for v3 `furigana: hidden` → v4 `off`, `showRomaji: false` → `romaji: off`, defaults `showIndonesian: true` and `showEnglish: true`, and malformed settings fallback.
- [ ] Run `npm test -- tests/settings.test.ts`; capture the expected failure.
- [ ] Bump profile version to 4, add new unions/defaults, and preserve review history, notes, logs, cases, and reading progress. Keep `showRomaji` as a compatibility read alias until migrated components no longer use it.
- [ ] Implement accessible `MedicalLanguageControls` using `actions.updateSettings()`, with `Tersimpan` feedback. Place it on Medical hub, search, phrasebook, quick mode, and J-Unit.
- [ ] Extend romaji helpers for always/hover/off and add `MedicalLanguageSurface` rendering Japanese → kana/furigana → romaji → Indonesian → optional English. Preserve general reading behavior.
- [ ] Run targeted/full tests and commit `feat: add Indonesian-first Medical display preferences`.

## Task 5: Phone-first J-Unit Mode

**Files:** Create `lib/content/junit.ts`, `components/medical/j-unit-mode.tsx`, `app/medical/j-unit/page.tsx`, and `tests/j-unit.test.ts`; modify `lib/content/taxonomy.ts`, `components/medical/quick-mode.tsx`, and `components/shell/command-palette.tsx`.

**Produces:** data-driven `/medical/j-unit` stage flow with SRS and language controls.

- [ ] Add failing tests for exact stage order, non-empty populated stages, phrase fields, and preserving selected stage after SRS add.
- [ ] Run `npm test -- tests/j-unit.test.ts`; capture the expected failure.
- [ ] Create `JUNIT_STAGES` with stable IDs from Task 1 and Indonesian, English, and Japanese labels. Empty stages render `Belum ada phrase terverifikasi`.
- [ ] Implement one-column mobile UI: current stage, progress, previous/next, stage picker, phrase cards, speaker/register badges, language controls, copy action, and `Tambahkan ke review`.
- [ ] Add keyboard shortcuts `←`/`→` stage navigation, `r` add focused phrase, `/` focus stage search. Add J-Unit entry points to Medical hub, quick mode, and command palette.
- [ ] Run `npm test -- tests/j-unit.test.ts tests/quick.test.ts` and commit `feat: add phone-first J-Unit mode`.

## Task 6: Related Content and coverage dashboard

**Files:** Create `components/medical/related-content.tsx` and `components/medical/coverage-dashboard.tsx`; modify `app/medical/page.tsx`, `app/medical/terms/[id]/page.tsx`, `app/medical/diseases/[id]/page.tsx`, `app/medical/symptoms/[id]/page.tsx`, `components/medical/register-display.tsx`, and `components/medical/term-browser.tsx`; test `tests/medical-reference.test.ts`.

**Produces:** relationship panels and Indonesian-first coverage visibility.

- [ ] Add tests for disease panels `Gejala terkait`, `Pemeriksaan`, `Obat terkait`, `Phrase`, `Kasus`, and missing mappings rendered as `Belum dipetakan` without invalid links.
- [ ] Implement `RelatedContent` from the typed graph; render Japanese first, Indonesian second, verification badge, and optional RFSmed source link.
- [ ] Implement `CoverageDashboard` for total RFSmed concepts, mapped Japanese, verified Japanese, kana, romaji, Indonesian, patient wording, phrase coverage, disease-page coverage, and drug-page coverage. Add incomplete filter and draft/reviewed/verified legend; do not rely on color alone.
- [ ] Add coverage to Medical hub, keep current registers/browse controls, add Indonesian subtitles, and append relation panels to topic pages.
- [ ] Run targeted/full tests and commit `feat: surface medical relationships and coverage`.

## Task 7: Starter study presets and content expansion

**Files:** Create `lib/content/data/studyPresets.ts`; modify medication, investigation, phrase, disease, symptom, content-index, store-types, and coverage-dashboard files; test `tests/medical-reference.test.ts`.

**Produces:** named SRS presets and the first Indonesian-first content packs.

- [ ] Add tests for presets `First Week at J-Unit`, `Essential Consultation Japanese`, `Top 100 Symptoms`, `Top 100 Diseases`, `Common Medications`, `Emergency Japanese`, `Internal Medicine`, `Cardiology`, `Gastroenterology`, `Neurology`, `Pulmonology`, `Orthopedics`, `Pediatrics`, and `OBGYN`; assert real IDs and no duplicate review keys.
- [ ] Implement `StudyPreset` with `id`, `labelId`, `descriptionId`, and `itemKeys`; build keys with `makeReviewKey()` and validate them in content integrity.
- [ ] Add reviewed phrases for identification, associated symptoms, red flags, test instructions, results, referral, and closing; add patient wording to common symptoms and current disease pages. Keep unresolved/machine-assisted rows `draft`.
- [ ] Add one-click preset review using `actions.addManyToReview()`, show the number added, and preserve page context.
- [ ] Run `npm test` and commit `feat: add Indonesian-first medical study presets`.

## Task 8: Verification and Git handoff

**Files:** Modify `README.md` and `QA_ACCEPTANCE.md`; test all `tests/*.test.ts`.

- [ ] Run `npm run typecheck`; expected exit 0.
- [ ] Run `npm test`; expected all tests pass.
- [ ] Run `npm run build`; expected exit 0.
- [ ] Manually check `/medical`, `/medical/search`, `/medical/j-unit`, `/medical/quick`, a term page, and a disease page at 390px, 768px, 1024px, and 1440px. Search `demam`, `胸痛`, `きょうつう`, `kyoutsuu`, `chest pain`, and `nyeri dada`. Verify keyboard search, stage navigation, language toggles, copy, SRS, loading, empty, error, draft, and unverified states.
- [ ] Document RFSmed mapping, Jisho draft-only behavior, localStorage, new routes, and verification commands in `README.md` and `QA_ACCEPTANCE.md`.
- [ ] Inspect with `git status --short`, `git diff --check`, and `git diff --stat`; commit `docs: document medical reference handoff`.
- [ ] After the user supplies a remote URL, run `git remote add origin` with that exact URL, then `git branch -M main` and `git push -u origin main`; verify with `git remote -v` and `git log --oneline -5`. If authentication or URL is unavailable, keep local commits intact and report the exact error.

## Checkpoints

### After Tasks 1–3

- [ ] Terms and phrases are strict and romaji-complete.
- [ ] Medications, investigations, relations, and RFSmed coverage compile.
- [ ] `demam` and `胸痛` return grouped Indonesian-first results.
- [ ] Jisho is draft-only.
- [ ] `npm test` and `npm run typecheck` pass.

### After Tasks 4–6

- [ ] v3 profiles migrate to v4 without losing study history.
- [ ] Language toggles persist and render Japanese → kana → romaji → Indonesian → optional English.
- [ ] J-Unit is usable on a phone and keyboard-safe.
- [ ] Medical pages show relationships and coverage.
- [ ] `npm test` and `npm run build` pass.

## Completion criteria

- [ ] All task criteria are satisfied.
- [ ] No normalized medical term or clinical phrase is missing romaji.
- [ ] Current disease lines are structured or visibly flagged as incomplete.
- [ ] RFSmed is a coverage target with source links, not duplicated decision support.
- [ ] Jisho remains explicit draft enrichment only.
- [ ] Desktop/mobile checks pass.
- [ ] Git history is clean and pushed to the user-provided remote.
