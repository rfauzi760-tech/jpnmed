# QA and Acceptance Criteria

## 1. Global navigation

Pass if:
- every main module can be reached in two clicks or fewer,
- mobile navigation is usable,
- page state does not unexpectedly reset.

---

# 2. Search

Pass if:
- Japanese search works,
- kana search works,
- English search works,
- Indonesian search works,
- partial matches work,
- result type is visible.

Example test queries:
- 胸痛
- きょうつう
- chest pain
- nyeri dada

---

# 3. Vocabulary

Pass if:
- user can open a word,
- see meanings,
- see examples,
- add it to review,
- edit personal notes,
- view related words.

---

# 4. SRS

Pass if:
- due items appear correctly,
- rating changes next due date,
- review history is stored,
- no duplicate review items are created.

---

# 5. Reading

Pass if:
- passage renders correctly,
- Japanese line wrapping is readable,
- questions can be answered,
- result is stored,
- explanations show evidence,
- mistakes are categorized,
- unknown vocabulary can be saved.

---

# 6. Medical term

Pass if:
- term has Japanese and translations,
- professional and patient-friendly forms can be distinguished,
- related diseases/phrases can be opened.

---

# 7. Disease page

Pass if it can display:
- disease name,
- lay explanation,
- symptoms,
- history questions,
- examination phrases,
- investigations,
- treatment phrases,
- safety-netting.

---

# 8. Clinical phrases

Pass if:
- phrases are grouped by consultation stage,
- register is visible,
- kana can be shown,
- phrase can be added to review.

---

# 9. Clinical cases

Pass if:
- case has required questions,
- user can progress through the case,
- missed key questions are shown,
- red flags are identified.

---

# 10. Performance

Target:
- main pages load quickly,
- search feels near-instant for local dataset,
- review button actions feel immediate.

---

# 11. Responsive design

Test widths:
- 390px
- 768px
- 1024px
- 1440px

---

# 12. Accessibility

Pass if:
- keyboard navigation works for study actions,
- focus states are visible,
- text contrast is adequate,
- Japanese text can be enlarged.

---

# 13. Content integrity

Pass if:
- duplicate IDs rejected,
- broken relationships are detected,
- missing required translations can be flagged,
- unverified content is visibly marked.

---

# 14. Medical safety

Pass if:
- learning purpose is clear,
- content is not presented as patient-specific diagnosis,
- unverified generated medical content cannot silently become verified.
