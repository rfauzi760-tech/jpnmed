# Instructions for AI Coding Agents

## Mission

Build the simplest high-quality implementation that satisfies the product specification.

Do not waste tokens or development time creating unnecessary infrastructure.

---

# 1. Read order

Before coding, read:

1. README.md
2. PRD.md
3. CURRICULUM.md
4. MEDICAL_JAPANESE_SPEC.md
5. CONTENT_ARCHITECTURE.md
6. DATA_SCHEMA.md
7. UX_UI.md
8. CONTENT_STYLE_GUIDE.md
9. IMPLEMENTATION_PLAN.md
10. QA_ACCEPTANCE.md

---

# 2. Primary product priorities

Priority order:

1. Global search
2. SRS review
3. Reading trainer
4. Medical dictionary and phrasebook
5. Disease and symptom pages
6. Clinical cases
7. Progress analytics
8. Personal notes

Do not prioritize decorative features above these.

---

# 3. Engineering principles

- Prefer boring, reliable technology.
- Keep domain logic separate from UI.
- Use typed schemas.
- Make content data-driven.
- Avoid hardcoding content inside components.
- Build reusable components.
- Make mobile responsive.
- Keep performance fast.
- Use local-first storage where practical.
- Add authentication only if needed.

---

# 4. Recommended stack

Preferred default:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- SQLite or Supabase/PostgreSQL
- Prisma or Drizzle
- Zod
- local search initially, full-text search later

Alternative stacks are acceptable if they reduce complexity.

---

# 5. Content storage

All learning content must be editable independently of components.

Preferred:
- database tables,
- seed JSON,
- or Markdown/MDX with structured frontmatter.

Do not bury hundreds of terms in React source files.

---

# 6. Search

Global search is a hard requirement.

At minimum support:
- Japanese exact match
- kana
- English
- Indonesian
- partial match
- tags

---

# 7. SRS

Implement review scheduling as a separate service/module.

UI code should not directly calculate scheduling logic.

---

# 8. Reading

Reading passages and questions must come from data.

The component must support:
- timer
- question answering
- result explanation
- adding unknown words to review

---

# 9. Medical content

Clinical terms must support:
- professional term
- patient-friendly term
- multiple languages
- specialty
- related terms
- related phrases

---

# 10. Seed content

Do not attempt to manually create thousands of items before the app works.

Start with:

- 100 advanced vocabulary items
- 30 grammar items
- 10 reading passages
- 150 medical terms
- 100 clinical phrases
- 20 diseases
- 10 clinical cases

Make content expansion easy.

---

# 11. AI use

AI may help generate:
- practice passages,
- explanations,
- case variants,
- quizzes.

However:
- generated medical content should be marked as unverified until reviewed,
- never overwrite curated content automatically.

---

# 12. Avoid

Do not:
- overengineer microservices,
- build complex role systems for a single-user app,
- add payment infrastructure,
- add social features,
- add generic chatbot features without a clear study function,
- add animations that slow study.

---

# 13. Definition of done

A feature is not done until:

- it works on desktop,
- it works on mobile,
- empty state exists,
- loading state exists,
- errors are handled,
- sample content exists,
- keyboard use is reasonable,
- data persists,
- and the feature is testable.
