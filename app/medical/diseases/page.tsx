import type { Metadata } from 'next';
import Link from 'next/link';
import { DISEASES, diseasesBySpecialty } from '@/lib/content';
import { SPECIALTIES, specialtyLabel } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import { Badge, EmptyState, Input, LinkButton, PageHeader, SafetyNote, SectionHeading } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Diseases',
  description: 'Disease pages with patient explanation, questions to ask, examination wording, investigations and treatment language.',
};

const SEVERITY_TONE = { routine: 'outline', urgent: 'warning', emergency: 'danger' } as const;

export default async function DiseasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string; severity?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const severity = params.severity ?? 'all';

  const filtered = DISEASES.filter((disease) => {
    if (params.specialty && !disease.specialties.includes(params.specialty)) return false;
    if (severity !== 'all' && disease.severity !== severity) return false;
    if (!query) return true;
    return [disease.japanese, disease.kana, disease.english, disease.indonesian, disease.layJapanese ?? '', ...disease.keySymptoms]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  const specialtiesWithDiseases = SPECIALTIES.map((specialty) => ({
    ...specialty,
    count: diseasesBySpecialty(specialty.id).length,
  })).filter((specialty) => specialty.count > 0);

  return (
    <PageBody>
      <PageHeader
        eyebrow="Diseases · 疾患"
        title="Disease pages"
        description="One page per condition: how to explain it, what to ask, what to examine, which tests to order, how to explain them, and what to say before the patient leaves."
        meta={
          <>
            <span>{DISEASES.length} conditions</span>
            <span>{filtered.length} shown</span>
            <span>{DISEASES.filter((disease) => disease.severity !== 'routine').length} urgent or emergency</span>
          </>
        }
        actions={
          <LinkButton href="/medical/phrases" size="sm" variant="secondary">
            Phrasebook
          </LinkButton>
        }
      />

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Filter — 心筋梗塞, 肺炎, pneumonia, serangan jantung"
          className="max-w-md"
          aria-label="Filter diseases"
        />
        <select
          name="severity"
          defaultValue={severity}
          className="h-9 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground"
          aria-label="Severity"
        >
          <option value="all">Any severity</option>
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="emergency">Emergency</option>
        </select>
        {params.specialty ? <input type="hidden" name="specialty" value={params.specialty} /> : null}
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-secondary"
        >
          Filter
        </button>
        <Link href="/medical/diseases" className="text-[12px] text-primary hover:underline">
          Reset
        </Link>
      </form>

      <section className="mt-5">
        <SectionHeading title="By specialty" />
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link
            href="/medical/diseases"
            className="rounded-[5px] border border-border px-2 py-1 text-[11.5px] text-muted-foreground hover:text-foreground"
          >
            All
          </Link>
          {specialtiesWithDiseases.map((specialty) => (
            <Link
              key={specialty.id}
              href={`/medical/diseases?specialty=${specialty.id}`}
              className={
                params.specialty === specialty.id
                  ? 'rounded-[5px] border border-border-strong bg-surface-secondary px-2 py-1 text-[11.5px] text-foreground'
                  : 'rounded-[5px] border border-border px-2 py-1 text-[11.5px] text-muted-foreground hover:text-foreground'
              }
            >
              {specialty.label.en}
              <span className="ml-1 font-mono text-[10.5px] tabular-nums text-muted">{specialty.count}</span>
            </Link>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="No conditions match" description="Clear the specialty or severity filter and try again." />
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-border border-y border-border">
          {filtered.map((disease) => (
            <li key={disease.id} className="flex flex-wrap items-start gap-x-5 gap-y-2 py-3">
              <div className="min-w-[220px] flex-1">
                <Link href={`/medical/diseases/${encodeURIComponent(disease.id)}`} className="group block">
                  <span lang="ja" className="text-[16px] tracking-tight text-foreground group-hover:text-primary">
                    {disease.japanese}
                  </span>
                  <span lang="ja" className="ml-2 text-[11.5px] text-muted">
                    {disease.kana}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] text-foreground">
                    {disease.english} <span className="text-muted">· {disease.indonesian}</span>
                  </span>
                </Link>
              </div>
              <p lang="ja" className="min-w-[240px] flex-[2] text-[12.5px] leading-relaxed text-muted-foreground">
                {disease.patientExplanation}
              </p>
              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <Badge tone={SEVERITY_TONE[disease.severity]}>{disease.severity}</Badge>
                <Badge tone="neutral">{specialtyLabel(disease.specialties[0])}</Badge>
                <span className="font-mono text-[10.5px] text-muted">
                  {disease.historyQuestions.length}q · {disease.investigations.length}t
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <SafetyNote />
      </div>
    </PageBody>
  );
}
