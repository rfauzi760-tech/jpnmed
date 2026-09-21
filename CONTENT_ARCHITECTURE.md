# Content Architecture

## 1. Core content entities

The system should support the following first-class entities:

- Vocabulary
- Kanji
- Grammar
- Reading Passage
- Reading Question
- Medical Term
- Clinical Phrase
- Symptom
- Disease
- Test
- Procedure
- Medication
- Department
- Clinical Case
- Personal Note
- Deck
- Review Item
- Mistake Record

---

# 2. Taxonomy

## Language tags

Examples:
- N3
- N2
- N1
- formal
- spoken
- written
- honorific
- casual
- academic

## Medical tags

Examples:
- emergency
- internal-medicine
- cardiology
- neurology
- respiratory
- GI
- pediatrics
- orthopedics
- surgery
- obstetrics
- psychiatry
- dermatology

## Communication tags

Examples:
- greeting
- history
- pain
- medication
- allergy
- examination
- diagnosis
- investigation
- treatment
- discharge
- consent

---

# 3. Content relationship model

Example:

`心筋梗塞`

Relationships:
- symptom: 胸痛
- symptom: 息切れ
- symptom: 冷や汗
- test: 心電図
- test: トロポニン
- department: 循環器内科
- related disease: 狭心症
- phrase: 胸の痛みはいつからですか
- anatomy: 心臓
- anatomy: 冠動脈

The UI should surface these relationships automatically.

---

# 4. Content source fields

Every content item should optionally store:

- source type
- source title
- source URL
- author
- date accessed
- personal note
- confidence
- verification status

Verification status:
- draft
- reviewed
- verified

---

# 5. Import strategy

The application should later support:

- CSV import
- JSON import
- Markdown import
- Anki-style import

The content model should therefore remain portable.

---

# 6. Personal content

The user must be able to create custom content without editing code.

Minimum editor fields:

- title
- Japanese
- kana
- meaning
- examples
- tags
- notes
- source

---

# 7. Default starter collections

Recommended collections:

### Advanced Japanese
- N2 High Frequency Vocabulary
- N2 Grammar
- N1 Bridge Vocabulary
- Logical Connectors
- Reading Trap Words

### Medical
- Core Hospital Japanese
- Emergency Japanese
- Internal Medicine
- Examination Commands
- Investigations
- Disease Names
- Patient-Friendly Explanations
