import type { Metadata } from 'next';
import Link from 'next/link';
import { SYMPTOMS } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { Badge, EmptyState, Input, LinkButton, PageHeader, SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Symptoms',
  description: 'How patients describe symptoms in Japanese, the questions to ask, and the red flags that must not be missed.',
};

export default async function SymptomsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; redflags?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const onlyRedFlags = params.redflags === '1';

  const filtered = SYMPTOMS.filter((symptom) => {
    if (onlyRedFlags && symptom.redFlags.length === 0) return false;
    if (!query) return true;
    return [symptom.japanese, symptom.kana, symptom.english, symptom.indonesian, ...symptom.patientExpressions, ...symptom.doctorQuestions]
      .join(' ')
      .toLowerCase()
      .includes(query);
  });

  return (
    <PageBody>
      <PageHeader
        eyebrow="Symptoms · 症状"
        title="Symptom language"
        description="Each page pairs what the patient says with the questions that turn a description into a diagnosis, plus the red flags."
        meta={
          <>
            <span>{SYMPTOMS.length} symptoms</span>
            <span>{filtered.length} shown</span>
            <span>{SYMPTOMS.filter((symptom) => symptom.redFlags.length > 0).length} carry red flags</span>
          </>
        }
        actions={
          <LinkButton href="/medical/phrases?stage=hpi" size="sm" variant="secondary">
            History-taking phrases
          </LinkButton>
        }
      />

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Filter symptoms — 胸痛, 発熱, fever, nyeri"
          className="max-w-md"
          aria-label="Filter symptoms"
        />
        <label className="inline-flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <input type="checkbox" name="redflags" value="1" defaultChecked={onlyRedFlags} className="h-3.5 w-3.5" />
          Only symptoms with red flags
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-secondary"
        >
          Filter
        </button>
        <Link href="/medical/symptoms" className="text-[12px] text-primary hover:underline">
          Reset
        </Link>
      </form>

      {filtered.length === 0 ? (
        <div className="mt-5">
          <EmptyState title="No symptoms match" description="Try a Japanese term, its kana reading, or the English name." />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border border-y border-border">
          {filtered.map((symptom) => (
            <li key={symptom.id} className="py-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <Link href={`/medical/symptoms/${encodeURIComponent(symptom.id)}`} className="group min-w-[160px]">
                  <span lang="ja" className="text-[16px] tracking-tight text-foreground group-hover:text-primary">
                    {symptom.japanese}
                  </span>
                  <span lang="ja" className="ml-2 text-[11.5px] text-muted">
                    {symptom.kana}
                  </span>
                </Link>
                <span className="text-[13px] text-foreground">{symptom.english}</span>
                <span className="text-[11.5px] text-muted">{symptom.indonesian}</span>
                <div className="ml-auto flex items-center gap-1.5">
                  {symptom.redFlags.length > 0 ? <Badge tone="danger">{symptom.redFlags.length} red flag</Badge> : null}
                  <Badge tone="outline">{symptom.doctorQuestions.length} questions</Badge>
                  <Badge tone="outline">{symptom.patientExpressions.length} patient phrasings</Badge>
                </div>
              </div>
              <p lang="ja" className="mt-1.5 max-w-3xl text-[12.5px] leading-relaxed text-muted-foreground">
                {symptom.patientExpressions[0]}
                <span className="ml-2 text-muted">— {symptom.doctorQuestions[0]}</span>
              </p>
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
