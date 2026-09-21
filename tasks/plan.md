# Implementation Plan: Comprehensive Japanese Medical Knowledge Base

## Audit baseline (2026-09-21)

The existing Medical module has a good typed architecture, but its content is still a starter dataset:

- 321 canonical medical terms; 0 have `definitionJa`; 316 have no explicit related IDs.
- 124 clinical phrases across all stages, but only 5 have variants and the phrase schema lacks a clinical-context field.
- 28 symptom pages and 20 disease pages; 10 cases; 3 medications; 3 investigations.
- 100 general vocabulary items, not a medical dictionary at the requested scale.
- All current phrase/case lines have kana, but content volume and cross-entity coverage are insufficient.

## Architecture decisions

- Preserve the existing schema, Indonesian-first display, SRS integration, J-Unit stages, and relationship resolver.
- Add data-driven specialty packs, not content embedded in React components.
- Add typed clinical phrase fields for context, nuance, alternatives, and related diseases/terms while keeping existing records compatible.
- Add a dedicated patient-expression / medical-onomatopoeia layer that distinguishes formal clinical Japanese from patient wording.
- Keep generated readings and translations visibly draft; only authored Japanese wording can be reviewed independently.
- Add an executable completeness audit that reports counts and missing required fields without pretending that a large dataset is fully medically verified.

## Execution slices

### Slice 1: Audit and content-quality foundation

- [x] Measure all existing collections and relationship coverage.
- [ ] Add phrase context/nuance/alternative fields and strengthen integrity checks.
- [ ] Add coverage report output for required medical fields.

### Slice 2: Core clinical communication pack

- [ ] Add 300+ practical consultation phrases across doctor, nurse, patient, family, reception, pharmacy, phone, outpatient, inpatient, discharge, referral, consent, and emergency contexts.
- [ ] Add 25+ history-taking complaint modules with question flow and patient answers.
- [ ] Add complete examination/instruction pack and onomatopoeia pack.

### Slice 3: Specialty terminology expansion

- [ ] Add specialty packs covering major hospital departments, anatomy, symptoms, investigations, procedures, workflow, and patient wording.
- [ ] Add individual generic medication and dosage-form communication packs.
- [ ] Add systematic disease taxonomy packs with Japanese, kana, romaji, Indonesian, English, patient explanation, history, investigations, treatment, red flags, and dialogue.

### Slice 4: Connected learning surfaces

- [ ] Expand relationship resolution across terms, phrases, symptoms, diseases, drugs, investigations, procedures, and cases.
- [ ] Make universal medical search index every alias, patient wording, romaji, context, and relationship.
- [ ] Add category/specialty/register/patient-vs-clinician filters.

### Slice 5: Verification and release

- [ ] Add thresholds that expose underpopulated specialties and incomplete entries.
- [ ] Run tests, typecheck, production build, mobile smoke checks, and live Vercel verification.
- [ ] Push each verified increment to GitHub `main`.

## Checkpoints

- Foundation: schema and audit tests pass; no required field is silently optional.
- Communication: phrase, history, examination, and patient-language search works end-to-end.
- Specialty: each major specialty has meaningful terms, phrases, diseases, investigations, and medication links.
- Release: counts are reported honestly, missing content remains visible, and deployment is verified.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Bulk-generated Japanese appears fluent but is clinically wrong | High | Use authored packs, preserve verification status, add translation/source audit, never auto-promote generated text. |
| Large datasets become duplicated or disconnected | High | Stable IDs, canonical Japanese surface tests, relation integrity checks, pack-level taxonomy. |
| Phone UI becomes overloaded | Medium | Keep compact line components and use filters/stages instead of rendering everything at once. |
| Static build grows too large | Medium | Keep data local and typed, monitor build output, use server-side list filtering where needed. |
