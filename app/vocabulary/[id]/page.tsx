import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { MEDICAL_TERMS, READINGS, VOCABULARY, getVocab } from '@/lib/content';
import { GRAMMAR } from '@/lib/content';
import { CONTENT_TYPE_LABELS, tagLabel } from '@/lib/content/taxonomy';
import { PageBody } from '@/components/shell/app-shell';
import {
  Badge,
  Divider,
  FactGrid,
  LinkButton,
  PageHeader,
  SectionHeading,
  SafetyNote,
  VerificationBadge,
} from '@/components/ui/primitives';
import { AddToReviewButton, BookmarkButton, NoteButton, ReviewStateLine } from '@/components/study/review-controls';
import { RomajiLine } from '@/components/study/prefs';
import { makeReviewKey } from '@/lib/store/types';

export function generateStaticParams() {
  return VOCABULARY.map((word) => ({ id: word.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const word = getVocab(id);
  if (!word) return { title: 'Vocabulary' };
  return {
    title: word.japanese,
    description: `${word.japanese} (${word.kana ?? ''}) — ${word.meaningsEn.join('; ')}`,
  };
}

export default async function VocabularyEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const word = getVocab(id);
  if (!word) notFound();

  const index = VOCABULARY.findIndex((entry) => entry.id === word.id);
  const previous = VOCABULARY[index - 1];
  const next = VOCABULARY[index + 1];

  const relatedGrammar = GRAMMAR.filter(
    (entry) => (word.relatedGrammarIds ?? []).includes(entry.id) || entry.relatedVocabularyIds.includes(word.id),
  );
  const relatedTerms = MEDICAL_TERMS.filter(
    (term) =>
      term.japanese === word.japanese ||
      term.alternativeNames.includes(word.japanese) ||
      (word.japanese.length > 1 && term.japanese.includes(word.japanese)),
  ).slice(0, 6);
  const appearances = READINGS.filter(
    (passage) => passage.vocabRefs.includes(word.japanese) || passage.text.includes(word.japanese),
  );

  return (
    <PageBody>
      <div className="mb-4 flex items-center justify-between gap-3 text-[11.5px] text-muted">
        <Link href="/vocabulary" className="inline-flex items-center gap-1 hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" />
          All vocabulary
        </Link>
        <div className="flex items-center gap-3">
          {previous ? (
            <Link href={`/vocabulary/${encodeURIComponent(previous.id)}`} className="hover:text-foreground" lang="ja">
              {previous.japanese}
            </Link>
          ) : null}
          {next ? (
            <Link
              href={`/vocabulary/${encodeURIComponent(next.id)}`}
              className="inline-flex items-center gap-1 hover:text-foreground"
              lang="ja"
            >
              {next.japanese}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>
      </div>

      <PageHeader
        eyebrow={`Vocabulary · ${CONTENT_TYPE_LABELS.vocabulary.ja}`}
        title={<span lang="ja">{word.japanese}</span>}
        meta={
          <>
            {word.kana ? (
              <span lang="ja" className="text-muted-foreground">
                {word.kana}
              </span>
            ) : null}
            {word.jlptLevel ? <Badge tone="primary">{word.jlptLevel}</Badge> : null}
            {word.partOfSpeech?.length ? <span>{word.partOfSpeech.join(', ')}</span> : null}
            {word.frequencyRank ? <span className="font-mono">freq {word.frequencyRank}</span> : null}
            <VerificationBadge status={word.verificationStatus} />
            <ReviewStateLine contentType="vocabulary" contentId={word.id} />
          </>
        }
        actions={
          <>
            <AddToReviewButton contentType="vocabulary" contentId={word.id} size="md" />
            <NoteButton contentType="vocabulary" contentId={word.id} defaultTitle={word.japanese} />
            <BookmarkButton contentKey={makeReviewKey('vocabulary', word.id)} />
          </>
        }
      />

      <RomajiLine kana={word.kana} className="mt-3" />

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-7">
          <section>
            <SectionHeading title="Meaning" />
            <div className="pt-3">
              <FactGrid
                items={[
                  { label: 'English', value: word.meaningsEn.join('; ') },
                  { label: 'Indonesian', value: word.meaningsId.join('; ') },
                  ...(word.definitionJa
                    ? [{ label: '定義（日本語）', value: <span lang="ja">{word.definitionJa}</span> }]
                    : []),
                  ...(word.collocations?.length
                    ? [{ label: 'Collocations', value: <span lang="ja">{word.collocations.join(' / ')}</span> }]
                    : []),
                ]}
              />
            </div>
          </section>

          {word.examples.length > 0 ? (
            <section>
              <SectionHeading title="Examples" hint={`${word.examples.length} sentences`} />
              <ul className="divide-y divide-border pt-1">
                {word.examples.map((example, position) => (
                  <li key={example.ja} className="py-2.5">
                    <p lang="ja" className="text-[15px] leading-relaxed text-foreground">
                      {example.ja}
                    </p>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">{example.en}</p>
                    {example.id ? <p className="text-[11.5px] text-muted">{example.id}</p> : null}
                    <span className="mt-1 block font-mono text-[10.5px] text-muted">ex.{position + 1}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {word.synonyms?.length || word.antonyms?.length ? (
            <section>
              <SectionHeading title="Similar and opposite" />
              <div className="pt-3">
                <FactGrid
                  columns={2}
                  items={[
                    ...(word.synonyms?.length
                      ? [{ label: 'Synonyms', value: <span lang="ja">{word.synonyms.join('、')}</span> }]
                      : []),
                    ...(word.antonyms?.length
                      ? [{ label: 'Antonyms', value: <span lang="ja">{word.antonyms.join('、')}</span> }]
                      : []),
                  ]}
                />
              </div>
            </section>
          ) : null}

          {relatedGrammar.length > 0 ? (
            <section>
              <SectionHeading title="Grammar that uses it" />
              <ul className="divide-y divide-border pt-1">
                {relatedGrammar.map((entry) => (
                  <li key={entry.id}>
                    <Link href={`/grammar/${entry.id}`} className="group flex items-baseline justify-between gap-4 py-2">
                      <span className="min-w-0">
                        <span lang="ja" className="text-[14.5px] text-foreground group-hover:text-primary">
                          {entry.pattern}
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{entry.meaning}</span>
                      </span>
                      <Badge>{entry.jlptLevel}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {relatedTerms.length > 0 ? (
            <section>
              <SectionHeading title="Clinical usage" hint="terms that use this word" />
              <ul className="divide-y divide-border pt-1">
                {relatedTerms.map((term) => (
                  <li key={term.id}>
                    <Link href={`/medical/terms/${encodeURIComponent(term.id)}`} className="group flex items-baseline justify-between gap-4 py-2">
                      <span className="min-w-0">
                        <span lang="ja" className="text-[14.5px] text-foreground group-hover:text-primary">
                          {term.japanese}
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{term.english}</span>
                      </span>
                      <Badge tone="neutral">{term.category}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {appearances.length > 0 ? (
            <section>
              <SectionHeading title="Appears in these passages" />
              <ul className="divide-y divide-border pt-1">
                {appearances.map((passage) => (
                  <li key={passage.id}>
                    <Link href={`/reading/${passage.id}`} className="group flex items-baseline justify-between gap-4 py-2">
                      <span className="min-w-0">
                        <span lang="ja" className="text-[14px] text-foreground group-hover:text-primary">
                          {passage.title}
                        </span>
                        <span className="ml-2 text-[12px] text-muted">{passage.topic}</span>
                      </span>
                      <Badge>{passage.level}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {word.notes ? (
            <section>
              <SectionHeading title="Reading note" />
              <p className="pt-2 text-[13px] leading-relaxed text-muted-foreground">{word.notes}</p>
            </section>
          ) : null}
        </div>

        <aside className="space-y-6 lg:border-l lg:border-border lg:pl-6">
          <section>
            <SectionHeading title="Tags" />
            <div className="flex flex-wrap gap-1.5 pt-3">
              {word.tags.length === 0 ? <span className="text-[12.5px] text-muted">No tags</span> : null}
              {word.tags.map((tag) => (
                <Link key={tag} href={`/vocabulary?tag=${tag}`}>
                  <Badge className="hover:border-primary hover:text-primary">{tagLabel(tag)}</Badge>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <SectionHeading title="Source" />
            <div className="pt-3 text-[12.5px] text-muted-foreground">
              {word.source ? (
                <p>
                  {word.source.title ?? word.source.type}
                  {word.source.author ? ` · ${word.source.author}` : ''}
                </p>
              ) : (
                <p>Curated for this curriculum.</p>
              )}
              <p className="mt-1 text-[11.5px] text-muted">
                Added {word.createdAt} · updated {word.updatedAt}
              </p>
            </div>
          </section>

          <Divider />

          <section>
            <SectionHeading title="Study it" />
            <div className="flex flex-wrap gap-2 pt-3">
              <LinkButton href="/review?deck=vocabulary" size="sm" variant="secondary">
                Review queue
              </LinkButton>
              <LinkButton href="/vocabulary" size="sm" variant="ghost">
                Back to the list
              </LinkButton>
            </div>
          </section>

          <SafetyNote />
        </aside>
      </div>
    </PageBody>
  );
}
