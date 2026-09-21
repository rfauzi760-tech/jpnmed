import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { GRAMMAR, getGrammar, getVocab } from '@/lib/content';
import { GRAMMAR_FAMILY_LABELS } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import {
  Badge,
  Divider,
  FactGrid,
  LinkButton,
  PageHeader,
  SectionHeading,
  SafetyNote,
  Table,
  VerificationBadge,
} from '@/components/ui/primitives';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';
import { makeReviewKey } from '@/lib/store/types';

export function generateStaticParams() {
  return GRAMMAR.map((entry) => ({ id: entry.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const entry = getGrammar(id);
  if (!entry) return { title: 'Grammar' };
  return { title: `${entry.pattern} — ${entry.meaning}`, description: entry.nuance };
}

export default async function GrammarEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = getGrammar(id);
  if (!entry) notFound();

  const index = GRAMMAR.findIndex((item) => item.id === entry.id);
  const previous = GRAMMAR[index - 1];
  const next = GRAMMAR[index + 1];
  const similar = GRAMMAR.filter((item) => entry.similarIds.includes(item.id));
  const relatedVocab = entry.relatedVocabularyIds.map((vocabId) => getVocab(vocabId)).filter(Boolean);

  return (
    <PageBody>
      <div className="mb-4 flex items-center justify-between gap-3 text-[11.5px] text-muted">
        <Link href="/grammar" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          Pattern library
        </Link>
        <div className="flex items-center gap-3">
          {previous ? (
            <Link href={`/grammar/${previous.id}`} lang="ja" className="hover:text-foreground">
              {previous.pattern}
            </Link>
          ) : null}
          {next ? (
            <Link href={`/grammar/${next.id}`} lang="ja" className="inline-flex items-center gap-1 hover:text-foreground">
              {next.pattern}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <PageHeader
        eyebrow={`Grammar · ${GRAMMAR_FAMILY_LABELS[entry.family].en}`}
        title={<span lang="ja">{entry.pattern}</span>}
        description={entry.meaning}
        meta={
          <>
            {entry.kana ? (
              <span lang="ja" className="text-muted-foreground">
                {entry.kana}
              </span>
            ) : null}
            <span className="font-mono text-[11px] text-muted">{entry.reading}</span>
            <Badge tone="primary">{entry.jlptLevel}</Badge>
            {entry.register.map((register) => (
              <Badge key={register} tone="neutral">
                {register}
              </Badge>
            ))}
            {entry.meaningsId ? <span>{entry.meaningsId}</span> : null}
            <VerificationBadge status={entry.verificationStatus} />
            <ReviewStateLine contentType="grammar" contentId={entry.id} />
          </>
        }
        actions={
          <>
            <AddToReviewButton contentType="grammar" contentId={entry.id} size="md" />
            <NoteButton contentType="grammar" contentId={entry.id} defaultTitle={entry.pattern} />
            <BookmarkButton contentKey={makeReviewKey('grammar', entry.id)} />
          </>
        }
      />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-7">
          <section>
            <SectionHeading title="Formation and nuance" />
            <div className="space-y-3 pt-3">
              <div className="rounded-md border border-border bg-surface-secondary/50 px-3 py-2">
                <div className="meta-label">Structure</div>
                <p lang="ja" className="mt-0.5 text-[15px] text-foreground">
                  {entry.formation}
                </p>
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">{entry.nuance}</p>
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <SectionHeading title="Use it when" />
              <ul className="space-y-1.5 pt-3 text-[13px] text-muted-foreground">
                {entry.whenToUse.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionHeading title="Do not use it for" />
              {entry.whenNotToUse.length === 0 ? (
                <p className="pt-3 text-[13px] text-muted">No restriction recorded.</p>
              ) : (
                <ul className="space-y-1.5 pt-3 text-[13px] text-muted-foreground">
                  {entry.whenNotToUse.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-danger" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section>
            <SectionHeading title="Examples" hint={`${entry.examples.length} sentences`} />
            <ul className="divide-y divide-border pt-1">
              {entry.examples.map((example) => (
                <li key={example.ja} className="py-2.5">
                  <p lang="ja" className="text-[15px] leading-relaxed text-foreground">
                    {example.ja}
                  </p>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{example.en}</p>
                  {example.id ? <p className="text-[11.5px] text-muted">{example.id}</p> : null}
                </li>
              ))}
            </ul>
          </section>

          {entry.readingExample ? (
            <section>
              <SectionHeading title="As it appears in reading" hint="dense, written register" />
              <p lang="ja" className="pt-2 text-[15.5px] leading-loose text-foreground">
                {entry.readingExample}
              </p>
            </section>
          ) : null}

          {entry.commonMistakes.length > 0 ? (
            <section>
              <SectionHeading title="Common mistakes" hint="the shape exam writers exploit" />
              <div className="pt-3">
                <Table>
                  <thead>
                    <tr>
                      <th className="w-[32%]">Often written</th>
                      <th className="w-[32%]">Correct</th>
                      <th>Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entry.commonMistakes.map((mistake) => (
                      <tr key={mistake.wrong}>
                        <td lang="ja" className="text-danger">
                          {mistake.wrong}
                        </td>
                        <td lang="ja" className="text-success">
                          {mistake.right}
                        </td>
                        <td className="text-muted-foreground">{mistake.why}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </section>
          ) : null}

          {similar.length > 0 ? (
            <section>
              <SectionHeading
                title="Patterns it competes with"
                action={
                  <Link
                    href={`/grammar/compare?a=${entry.id}&b=${similar[0].id}`}
                    className="text-[12px] text-primary hover:underline"
                  >
                    Open comparison
                  </Link>
                }
              />
              <div className="pt-3">
                <Table>
                  <thead>
                    <tr>
                      <th className="w-[26%]">Pattern</th>
                      <th className="w-[34%]">Difference</th>
                      <th>Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    {similar.map((other) => (
                      <tr key={other.id}>
                        <td>
                          <Link href={`/grammar/${other.id}`} lang="ja" className="text-foreground hover:text-primary">
                            {other.pattern}
                          </Link>
                          <span className="mt-0.5 block text-[11px] text-muted">{other.meaning}</span>
                        </td>
                        <td className="text-muted-foreground">{other.contrastNote ?? other.nuance}</td>
                        <td lang="ja" className="text-muted-foreground">
                          {other.examples[0]?.ja}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              {entry.contrastNote ? (
                <p className="mt-3 border-l-2 border-l-primary bg-surface-secondary/50 px-3 py-2 text-[13px] leading-relaxed text-foreground">
                  {entry.contrastNote}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Quick facts" />
            <div className="pt-3">
              <FactGrid
                columns={1}
                items={[
                  { label: 'Function', value: GRAMMAR_FAMILY_LABELS[entry.family].en },
                  { label: 'Level', value: entry.jlptLevel },
                  { label: 'Register', value: entry.register.join(', ') || 'neutral' },
                  { label: 'Structure', value: <span lang="ja">{entry.formation}</span> },
                ]}
              />
            </div>
          </section>

          {relatedVocab.length > 0 ? (
            <section>
              <SectionHeading title="Vocabulary in these examples" />
              <ul className="divide-y divide-border pt-1">
                {relatedVocab.map((word) => (
                  <li key={word!.id}>
                    <Link
                      href={`/vocabulary/${encodeURIComponent(word!.id)}`}
                      className="flex items-baseline justify-between gap-3 py-2 text-[13.5px] hover:text-primary"
                    >
                      <span lang="ja">{word!.japanese}</span>
                      <span className="text-[11.5px] text-muted">{word!.jlptLevel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Divider />

          <section>
            <SectionHeading title="Drill it" />
            <div className="flex flex-wrap gap-2 pt-3">
              <LinkButton href="/review?deck=grammar" size="sm" variant="secondary">
                Review grammar
              </LinkButton>
              <LinkButton href="/grammar/compare" size="sm" variant="ghost">
                Compare two patterns
              </LinkButton>
            </div>
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
