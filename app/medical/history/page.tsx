import type { Metadata } from 'next';
import Link from 'next/link';
import { PHRASES } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { Badge, EmptyState, Input, LinkButton, PageHeader, SafetyNote, SectionHeading } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'History-taking modules',
  description: 'Complaint-based Japanese history-taking scripts with clinician questions and natural patient answers.',
};

export default async function HistoryModulesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const rows = PHRASES.filter((phrase) => phrase.clinicalContext.startsWith('History-taking for'));
  const contexts = [...new Set(rows.map((phrase) => phrase.clinicalContext))].sort();
  const filtered = contexts.filter((context) => !query || context.toLowerCase().includes(query) || rows.some((phrase) => phrase.clinicalContext === context && [phrase.japanese, phrase.kana, phrase.romaji, phrase.indonesian, phrase.english].join(' ').toLowerCase().includes(query)));

  return (
    <PageBody wide>
      <PageHeader
        eyebrow="History-taking · 問診"
        title="Complaint-based history modules"
        description="Open a complaint and move from onset through red flags, then compare the questions with natural patient answers. Every line keeps Japanese, kana, romaji and Indonesian together for rapid clinical reference."
        meta={<><span>{contexts.length} complaint modules</span><span>{rows.length} linked phrases</span><span>HPI · red flags · patient answers</span></>}
        actions={<LinkButton href="/medical/phrases?stage=hpi" size="sm" variant="secondary">Open full phrasebook</LinkButton>}
      />

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <Input name="q" defaultValue={params.q ?? ''} placeholder="Search complaint, Japanese, romaji, Indonesian" className="max-w-lg" aria-label="Search history modules" />
        <button type="submit" className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-foreground hover:bg-surface-secondary">Search</button>
        <Link href="/medical/history" className="text-[12px] text-primary hover:underline">Reset</Link>
      </form>

      {filtered.length === 0 ? <div className="mt-5"><EmptyState title="No modules match" description="Try a complaint such as chest pain, fever, or sesak." /></div> : (
        <div className="mt-5 space-y-8">
          {filtered.map((context) => {
            const moduleRows = rows.filter((phrase) => phrase.clinicalContext === context);
            const title = context.replace('History-taking for ', '');
            return (
              <section key={context} className="border-t border-border pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <SectionHeading title={title} hint={`${moduleRows.length} lines`} />
                  <div className="flex gap-1.5"><Badge tone="outline">doctor questions</Badge><Badge tone="outline">patient answers</Badge></div>
                </div>
                <div className="mt-3 divide-y divide-border rounded-md border border-border">
                  {moduleRows.map((phrase) => (
                    <article key={phrase.id} className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div>
                        <p className="meta-label">{phrase.speaker} · {phrase.intent.split(' · ').slice(-1)[0]}</p>
                        <p lang="ja" className="mt-1 text-[15px] leading-relaxed text-foreground">{phrase.japanese}</p>
                        <p lang="ja" className="text-[11.5px] text-muted">{phrase.kana}</p>
                        <p className="text-[11.5px] text-info">{phrase.romaji}</p>
                        <p className="mt-1 text-[12.5px] text-foreground">{phrase.indonesian}</p>
                        <p className="text-[11.5px] text-muted">{phrase.english}</p>
                      </div>
                      <div className="border-l border-border pl-3 text-[12px] leading-relaxed text-muted-foreground">
                        <p>{phrase.nuance}</p>
                        {phrase.relatedDiseaseIds.length > 0 ? <p className="mt-2 text-[11px] text-muted">Related: {phrase.relatedDiseaseIds.join(' · ')}</p> : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-6"><SafetyNote /></div>
    </PageBody>
  );
}
