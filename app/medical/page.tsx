import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { CASES, CONTENT_STATS, DISEASES, MEDICAL_TERMS, PHRASES, SYMPTOMS, diseasesBySpecialty } from '@/lib/content';
import { MEDICAL_CATEGORIES, PHRASE_STAGES, SPECIALTIES, STAGE_GROUP_LABELS } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import { Badge, LinkButton, PageHeader, SafetyNote, SectionHeading, StatRow } from '@/components/ui/primitives';
import { MedicalSearchBox } from '@/components/medical/search-box';

export const metadata: Metadata = {
  title: 'Medical Japanese',
  description:
    'Clinically usable hospital Japanese: terminology, symptoms, diseases, phrases, examination language and quick lookup for the ward.',
};

export default function MedicalHubPage() {
  const counts = new Map<string, number>();
  for (const term of MEDICAL_TERMS) counts.set(term.category, (counts.get(term.category) ?? 0) + 1);
  const stageCounts = new Map<string, number>();
  for (const phrase of PHRASES) stageCounts.set(phrase.stage, (stageCounts.get(phrase.stage) ?? 0) + 1);

  const specialtiesWithContent = SPECIALTIES.map((specialty) => ({
    ...specialty,
    diseases: diseasesBySpecialty(specialty.id).length,
    terms: MEDICAL_TERMS.filter((term) => term.specialties.includes(specialty.id)).length,
  })).filter((specialty) => specialty.diseases + specialty.terms > 0);

  const emergencies = DISEASES.filter((disease) => disease.severity !== 'routine');
  const patientFriendlyCount = MEDICAL_TERMS.filter((term) => term.patientFriendly).length;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Medical Japanese · 医療日本語"
        title="Hospital Japanese that works at the bedside"
        description="Terminology in three distinct registers — the technical term, the explanation a patient understands, and the words the patient actually uses."
        meta={
          <>
            <span>{CONTENT_STATS.terms} terms</span>
            <span>{CONTENT_STATS.phrases} clinical phrases</span>
            <span>{CONTENT_STATS.symptoms} symptom pages</span>
            <span>{CONTENT_STATS.diseases} disease pages</span>
            <span>{CONTENT_STATS.cases} cases</span>
          </>
        }
        actions={
          <>
            <LinkButton href="/medical/quick" variant="primary" size="md">
              <Stethoscope className="h-4 w-4" />
              Quick clinical mode
            </LinkButton>
            <LinkButton href="/medical/j-unit" variant="secondary" size="md">
              J-Unit Mode
            </LinkButton>
            <LinkButton href="/medical/phrases" variant="secondary" size="md">
              Phrasebook
            </LinkButton>
          </>
        }
      />

      <div className="mt-4">
        <MedicalSearchBox />
      </div>

      <section className="mt-5 rounded-lg border border-border bg-surface-secondary/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div><SectionHeading title="RFSmed coverage dashboard" hint="Japanese learning coverage, not clinical decision support" /></div>
          <span className="text-[11px] text-muted">Target inventory: {CONTENT_STATS.rfsmedInventory.toLocaleString()}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div><div className="meta-label">Mapped concepts</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.terms + CONTENT_STATS.symptoms + CONTENT_STATS.diseases + CONTENT_STATS.medications + CONTENT_STATS.investigations}</div></div>
          <div><div className="meta-label">Kana complete</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.terms + CONTENT_STATS.symptoms + CONTENT_STATS.diseases + CONTENT_STATS.medications + CONTENT_STATS.investigations}</div></div>
          <div><div className="meta-label">Romaji complete</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.medicalRomajiComplete}</div></div>
          <div><div className="meta-label">Indonesian complete</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.medicalRomajiComplete}</div></div>
          <div><div className="meta-label">Patient wording</div><div className="mt-1 text-lg text-foreground">{patientFriendlyCount + SYMPTOMS.length}</div></div>
          <div><div className="meta-label">Phrase coverage</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.phrases}</div></div>
          <div><div className="meta-label">Disease pages</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.diseases}</div></div>
          <div><div className="meta-label">Drug pages</div><div className="mt-1 text-lg text-foreground">{CONTENT_STATS.medications}</div></div>
        </div>
      </section>

      {/* Register model */}
      <section className="mt-6">
        <SectionHeading title="The three registers" hint="they are not interchangeable" />
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div className="border-l-2 border-l-primary pl-3">
            <div className="meta-label">A · Technical term 医療用語</div>
            <p lang="ja" className="mt-1 text-[15px] leading-relaxed text-foreground">
              心筋梗塞
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              For notes, referrals, conferences and colleagues who share the vocabulary.
            </p>
          </div>
          <div className="border-l-2 border-l-info pl-3">
            <div className="meta-label">B · Patient-friendly やさしい説明</div>
            <p lang="ja" className="mt-1 text-[15px] leading-relaxed text-foreground">
              心臓に血液を送る血管が詰まる病気
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              What you say when you explain the diagnosis to the patient.
            </p>
          </div>
          <div className="border-l-2 border-l-border-strong pl-3">
            <div className="meta-label">C · Patient wording 患者さんの言い方</div>
            <p lang="ja" className="mt-1 text-[15px] leading-relaxed text-foreground">
              胸が締め付けられる感じがします
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              What you have to understand when the patient describes the symptom.
            </p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-muted">
          {patientFriendlyCount} of {CONTENT_STATS.terms} terms currently carry a patient-friendly explanation; the rest are marked
          with verification status on their own pages.
        </p>
      </section>

      {/* Categories */}
      <section className="mt-7">
        <SectionHeading
          title="Browse the dictionary"
          action={
            <Link href="/medical/terms" className="text-[12px] text-primary hover:underline">
              All terminology
            </Link>
          }
        />
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 sm:grid-cols-3">
          {MEDICAL_CATEGORIES.filter((category) => (counts.get(category.id) ?? 0) > 0).map((category) => (
            <Link
              key={category.id}
              href={`/medical/terms?category=${category.id}`}
              className="group flex items-baseline justify-between gap-2 border-b border-border/70 py-1.5"
            >
              <span className="min-w-0">
                <span className="block text-[13.5px] text-foreground group-hover:text-primary">{category.label.en}</span>
                <span lang="ja" className="block text-[11px] text-muted">
                  {category.label.ja}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted">{counts.get(category.id)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Encounter flow */}
      <section className="mt-7">
        <SectionHeading
          title="The consultation, stage by stage"
          hint="18 stages"
          action={
            <Link href="/medical/phrases" className="text-[12px] text-primary hover:underline">
              Open the phrasebook
            </Link>
          }
        />
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(['opening', 'assessment', 'explanation', 'aftercare'] as const).map((group) => (
            <div key={group}>
              <div className="meta-label">{STAGE_GROUP_LABELS[group].en}</div>
              <ul className="mt-1.5 space-y-0.5">
                {PHRASE_STAGES.filter((stage) => stage.group === group).map((stage) => (
                  <li key={stage.id}>
                    <Link
                      href={`/medical/phrases?stage=${stage.id}`}
                      className="group flex items-baseline justify-between gap-2 border-b border-border/60 py-1"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] text-foreground group-hover:text-primary">
                          {stage.label.short ?? stage.label.en}
                        </span>
                        <span lang="ja" className="block text-[10.5px] text-muted">
                          {stage.label.ja}
                        </span>
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted">{stageCounts.get(stage.id) ?? 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Clinical content */}
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7">
          <section>
            <SectionHeading
              title="Diseases"
              hint="patient explanation, questions, tests, treatment"
              action={
                <Link href="/medical/diseases" className="text-[12px] text-primary hover:underline">
                  All {CONTENT_STATS.diseases}
                </Link>
              }
            />
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {DISEASES.slice(0, 10).map((disease) => (
                <li key={disease.id}>
                  <Link href={`/medical/diseases/${encodeURIComponent(disease.id)}`} className="group flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1">
                      <span lang="ja" className="block text-[14.5px] text-foreground group-hover:text-primary">
                        {disease.japanese}
                      </span>
                      <span className="block text-[11.5px] text-muted">
                        {disease.english} · {disease.indonesian}
                      </span>
                    </span>
                    <Badge tone={disease.severity === 'emergency' ? 'danger' : disease.severity === 'urgent' ? 'warning' : 'outline'}>
                      {disease.severity}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionHeading
              title="Symptoms"
              hint="what patients say, what you must ask"
              action={
                <Link href="/medical/symptoms" className="text-[12px] text-primary hover:underline">
                  All {SYMPTOMS.length}
                </Link>
              }
            />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SYMPTOMS.map((symptom) => (
                <Link key={symptom.id} href={`/medical/symptoms/${encodeURIComponent(symptom.id)}`}>
                  <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-border px-2 py-1 text-[12.5px] text-foreground transition-colors hover:border-border-strong hover:text-primary">
                    <span lang="ja">{symptom.japanese}</span>
                    <span className="text-[10.5px] text-muted">{symptom.english}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Clinical cases" hint="run a consultation in Japanese" />
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {CASES.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link href={`/cases/${item.id}`} className="group flex items-center gap-3 py-2 text-[13.5px]">
                    <span lang="ja" className="min-w-0 flex-1 truncate text-foreground group-hover:text-primary">
                      {item.titleJa}
                    </span>
                    <span className="shrink-0 text-[11.5px] text-muted">{item.setting}</span>
                    <Badge tone={item.difficulty === 'emergency' ? 'danger' : item.difficulty === 'advanced' ? 'warning' : 'outline'}>
                      {item.difficulty}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2">
              <LinkButton href="/cases" size="sm" variant="secondary">
                All {CASES.length} cases
              </LinkButton>
            </div>
          </section>
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Coverage" />
            <div className="pt-3">
              <StatRow
                items={[
                  { label: 'Terms', value: CONTENT_STATS.terms },
                  { label: 'Phrases', value: CONTENT_STATS.phrases },
                  { label: 'Specialties', value: specialtiesWithContent.length },
                ]}
              />
            </div>
          </section>

          <section>
            <SectionHeading title="Emergency wording" hint={`${emergencies.length} topics`} />
            <ul className="pt-2">
              {emergencies.slice(0, 8).map((disease) => (
                <li key={disease.id}>
                  <Link
                    href={`/medical/diseases/${encodeURIComponent(disease.id)}`}
                    className="flex items-center justify-between gap-3 py-1.5 text-[13px] text-foreground hover:text-primary"
                  >
                    <span lang="ja">{disease.japanese}</span>
                    <Badge tone={disease.severity === 'emergency' ? 'danger' : 'warning'}>{disease.severity}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/medical/phrases?stage=emergency" className="mt-2 inline-block text-[12px] text-primary hover:underline">
              Emergency phrases
            </Link>
          </section>

          <section>
            <SectionHeading title="Specialties" />
            <ul className="pt-2">
              {specialtiesWithContent.slice(0, 12).map((specialty) => (
                <li key={specialty.id}>
                  <Link
                    href={`/medical/diseases?specialty=${specialty.id}`}
                    className="flex items-baseline justify-between gap-2 border-b border-border/60 py-1.5"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] text-foreground">{specialty.label.en}</span>
                      <span lang="ja" className="block text-[10.5px] text-muted">
                        {specialty.label.ja}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted">
                      {specialty.diseases}d · {specialty.terms}t
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
