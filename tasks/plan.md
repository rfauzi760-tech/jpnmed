# Implementation Plan: Complete Medical Communication Expansion

## Overview

Expand Medical into a complete Indonesian-first Japanese clinical communication reference. Patient-friendly and patient-expression registers become structured language lines with Japanese, kana, Hepburn romaji, Indonesian, English, and verification status. Coverage grows through data-driven packs aligned to the RFSmed specialty inventory without copying decision-support logic.

## Architecture Decisions

- Keep the existing Medical pages, search index, SRS, J-Unit flow, relationships, and verification model.
- Represent each register as a structured clinical line rather than a bare Japanese string, so romaji can never disappear in a UI card.
- Keep generated readings visibly `draft`; curated clinical Japanese remains separate from machine-generated support.
- Add content in reusable specialty/category packs instead of embedding large arrays in React components.
- Use RFSmed as a coverage target and expose explicit mapped/unmapped counts rather than claiming full clinical coverage prematurely.

## Task List

### Phase 1: Register foundation

- [ ] Convert patient-friendly and patient-expression term registers to structured lines.
- [ ] Render Japanese → kana → romaji → Indonesian → optional English on term list, term page, and register cards.
- [ ] Add validation and tests that every populated patient register has romaji and Indonesian text.

### Phase 2: High-value communication coverage

- [ ] Expand symptom, sign, anatomy, vital, examination, investigation, procedure, hospital workflow, and emergency terminology packs.
- [ ] Expand consultation phrase packs across every stage and speaker/register.
- [ ] Add patient-friendly explanations and patient wording for the highest-use clinical concepts.

### Phase 3: Disease and medication coverage

- [ ] Add disease communication packs by specialty with history, examination, investigation, treatment, referral, admission, discharge, follow-up, and safety-net phrases.
- [ ] Add individual generic medication entries and communication lines, using RFSmed only as an inventory target.
- [ ] Link diseases, symptoms, drugs, investigations, procedures, phrases, and cases into Related Content.

### Phase 4: Coverage and quality control

- [ ] Extend the coverage dashboard to report patient-register, phrase, disease-page, drug-page, kana, romaji, Indonesian, and verification completion.
- [ ] Add incomplete-content flags and review queues; never label generated Japanese as verified.
- [ ] Verify search, SRS actions, J-Unit, mobile layouts, tests, build, and live deployment.

## Checkpoints

- Foundation checkpoint: schemas parse, all Medical register views show romaji, tests pass.
- Content checkpoint: new packs are searchable, reviewable, and linked from Medical pages.
- Completion checkpoint: coverage dashboard makes every remaining gap explicit and deployment is verified.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Large generated content looks fluent but is clinically wrong | High | Mark readings/translations draft, preserve sources, and expose verification state. |
| Content grows as isolated vocabulary | Medium | Add relationship fields and related-content resolution with every pack. |
| UI becomes too dense on phone | Medium | Reuse compact medical-line components and keep English optional. |
| RFSmed inventory changes | Medium | Keep observed inventory snapshot and show mapping progress, not copied CDS. |
