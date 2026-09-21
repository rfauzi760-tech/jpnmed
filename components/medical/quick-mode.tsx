'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Copy, Search, Stethoscope, TriangleAlert } from 'lucide-react';
import {
  QUICK_KIND_LABELS,
  QUICK_STARTERS,
  searchQuickIndex,
  type QuickEntry,
} from '@/lib/content/quick';
import { cn } from '@/lib/utils/cn';
import { Badge, Button, EmptyState, Kbd, PageHeader, SafetyNote, SectionHeading } from '@/components/ui/primitives';
import { CopyButton } from '@/components/ui/interactive';
import { AddToReviewButton } from '@/components/study/review-controls';
import { VerificationBadge } from '@/components/ui/primitives';

/* ------------------------------------------------------------------
   Quick Clinical Mode.

   Built for the thirty seconds before you walk into a room: one input,
   instant results, and a panel of the exact sentences and terms you
   need. No navigation, no tabs, no scrolling through text.
------------------------------------------------------------------ */

const RECENT_KEY = 'jmed.quick.recent';

export function QuickClinicalMode({ entries }: { entries: QuickEntry[] }) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedAll, setCopiedAll] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => searchQuickIndex(entries, query), [entries, query]);
  const selected = selectedId ? entries.find((entry) => entry.id === selectedId) ?? null : null;

  // Autofocus on arrival: this screen exists to be typed into.
  useEffect(() => {
    inputRef.current?.focus();
    try {
      const raw = sessionStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (parsed.length > 0) setRecentIds(parsed);
      }
    } catch {
      // Recent lookups are a convenience; failing to read them is harmless.
    }
  }, []);

  const remember = (id: string) => {
    const next = [id, ...recentIds.filter((item) => item !== id)].slice(0, 5);
    setRecentIds(next);
    try {
      sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
        inputRef.current?.focus();
        return;
      }
      if (selected) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, results.length - 1));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
      }
      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault();
        select(results[activeIndex]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const select = (entry: QuickEntry) => {
    setSelectedId(entry.id);
    remember(entry.id);
    setQuery(entry.ja);
    setActiveIndex(0);
  };

  const recentEntries = recentIds
    .map((id) => entries.find((entry) => entry.id === id))
    .filter((entry): entry is QuickEntry => Boolean(entry));

  const copyAllQuestions = async (lines: string[]) => {
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1400);
    } catch {
      setCopiedAll(false);
    }
  };

  const contentTypeFor = (entry: QuickEntry) =>
    entry.kind === 'symptom' ? 'symptom' : entry.kind === 'disease' ? 'disease' : entry.kind === 'term' ? 'medical-term' : null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Quick clinical mode · すぐ使える"
        title={<span className="inline-flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" />Look up before you walk in</span>}
        description="Type a symptom, a disease, a test or a stage of the encounter. Results appear as you type."
        meta={
          <>
            <span>{entries.length} lookup entries</span>
            <span className="hidden sm:inline">
              <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move · <Kbd>↵</Kbd> to open · <Kbd>esc</Kbd> to clear
            </span>
          </>
        }
        actions={
          <span className="flex items-center gap-3"><Link href="/medical/j-unit" className="text-[12px] text-primary hover:underline">J-Unit Mode</Link><Link href="/medical/phrases" className="text-[12px] text-primary hover:underline">Full phrasebook</Link></span>
        }
      />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId(null);
            setActiveIndex(0);
          }}
          placeholder="胸痛 · きょうつう · chest pain · nyeri dada · how to ask about allergy"
          aria-label="Quick clinical lookup"
          className="h-11 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-[15px] text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none"
        />
        {query.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedId(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11.5px] text-muted hover:text-foreground"
          >
            clear
          </button>
        ) : null}
      </div>

      {/* Suggestions / results */}
      {!selected ? (
        <div className="space-y-3">
          {results.length > 0 ? (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {results.map((entry, index) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => select(entry)}
                    className={cn(
                      'flex w-full items-baseline gap-3 px-3 py-2 text-left transition-colors',
                      index === activeIndex ? 'bg-primary-muted' : 'hover:bg-surface-secondary',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span lang="ja" className="text-[15.5px] text-foreground">
                        {entry.ja}
                      </span>
                      {entry.kana ? (
                        <span lang="ja" className="ml-2 text-[11.5px] text-muted">
                          {entry.kana}
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                        {entry.en}
                        {entry.idn ? ` · ${entry.idn}` : ''}
                      </span>
                    </span>
                    <Badge tone={entry.severity === 'emergency' ? 'danger' : entry.severity === 'urgent' ? 'warning' : 'outline'}>
                      {QUICK_KIND_LABELS[entry.kind]}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length > 0 ? (
            <EmptyState
              compact
              title="Nothing matched"
              description="Try the Japanese term, its kana reading, or the English name. Full-text search is on ⌘K."
            />
          ) : (
            <div className="space-y-3">
              <div>
                <div className="meta-label mb-1.5">Frequent in the ward</div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      lang="ja"
                      onClick={() => setQuery(starter)}
                      className="rounded-[5px] border border-border px-2.5 py-1 text-[13px] text-foreground transition-colors hover:border-border-strong hover:text-primary"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
              {recentEntries.length > 0 ? (
                <div>
                  <div className="meta-label mb-1.5">Recent lookups</div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        onClick={() => select(entry)}
                        className="rounded-[5px] border border-border px-2.5 py-1 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <span lang="ja">{entry.ja}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Panel */}
      {selected ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to search
            </Button>
            <div className="min-w-0">
              <h2 lang="ja" className="text-xl tracking-tight text-foreground">
                {selected.ja}
              </h2>
              <p className="text-[12px] text-muted-foreground">
                {selected.en}
                {selected.idn ? ` · ${selected.idn}` : ''}
              </p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-1.5">
              {selected.severity ? (
                <Badge tone={selected.severity === 'emergency' ? 'danger' : selected.severity === 'urgent' ? 'warning' : 'outline'}>
                  {selected.severity}
                </Badge>
              ) : null}
              <Link href={selected.url} className="text-[11.5px] text-primary hover:underline">
                Full page
              </Link>
              {contentTypeFor(selected) ? (
                <AddToReviewButton contentType={contentTypeFor(selected)!} contentId={selected.id.split(':')[1]} />
              ) : null}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-5">
              {selected.panel.keyQuestions.length > 0 ? (
                <section>
                  <SectionHeading
                    title="Key questions"
                    hint="ask these first"
                    action={
                      <Button variant="ghost" size="sm" onClick={() => copyAllQuestions(selected.panel.keyQuestions)}>
                        <Copy className="h-3.5 w-3.5" />
                        {copiedAll ? 'Copied' : 'Copy all'}
                      </Button>
                    }
                  />
                  <ul className="divide-y divide-border pt-1">
                    {selected.panel.keyQuestions.map((question) => (
                      <li key={question} className="flex items-start gap-3 py-1.5">
                        <span lang="ja" className="min-w-0 flex-1 text-[15px] leading-relaxed text-foreground">
                          {question}
                        </span>
                        <CopyButton text={question} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.panel.redFlags.length > 0 ? (
                <section>
                  <SectionHeading title="Red flags" hint="do not miss" />
                  <ul className="space-y-1.5 pt-2">
                    {selected.panel.redFlags.map((flag) => (
                      <li
                        key={flag}
                        lang="ja"
                        className="flex items-start gap-2 border-l-2 border-l-danger bg-danger-muted/40 px-3 py-1.5 text-[14px] leading-relaxed text-foreground"
                      >
                        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.panel.patientFriendly ? (
                <section>
                  <SectionHeading title="Patient-friendly explanation" hint="in the patient's language" />
                  {selected.panel.patientFriendlySupport ? (
                    <div className="mt-2 border-l-2 border-l-info pl-3">
                      <p lang="ja" className="text-[15px] leading-loose text-foreground">{selected.panel.patientFriendlySupport.japanese}</p>
                      <p lang="ja" className="text-[12px] leading-relaxed text-muted">{selected.panel.patientFriendlySupport.kana}</p>
                      <p className="text-[12px] leading-relaxed text-info">{selected.panel.patientFriendlySupport.romaji}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-foreground">{selected.panel.patientFriendlySupport.indonesian}</p>
                      <p className="text-[12px] leading-relaxed text-muted-foreground">{selected.panel.patientFriendlySupport.english}</p>
                      {selected.panel.patientFriendlySupport.verificationStatus === 'draft' ? <div className="mt-1"><VerificationBadge status="draft" /></div> : null}
                    </div>
                  ) : (
                    <p lang="ja" className="mt-2 border-l-2 border-l-info pl-3 text-[15px] leading-loose text-foreground">{selected.panel.patientFriendly}</p>
                  )}
                  <div className="mt-1.5">
                    <CopyButton text={selected.panel.patientFriendly} label="Copy explanation" />
                  </div>
                </section>
              ) : null}

              {selected.panel.exchanges.length > 0 ? (
                <section>
                  <SectionHeading title="Patient says → you respond" hint="paired drills" />
                  <div className="mt-2 space-y-3">
                    {selected.panel.exchanges.map((pair, index) => (
                      <div key={index} className="border-l-2 border-l-border-strong pl-3">
                        <div className="flex items-start gap-2.5">
                          <span className="meta-label w-12 shrink-0 pt-0.5 text-danger">Patient</span>
                          <span lang="ja" className="min-w-0 flex-1 text-[14px] leading-relaxed text-foreground">
                            {pair.patient}
                          </span>
                        </div>
                        <div className="mt-1 flex items-start gap-2.5">
                          <span className="meta-label w-12 shrink-0 pt-0.5 text-primary">You</span>
                          <span lang="ja" className="min-w-0 flex-1 text-[14px] leading-relaxed text-foreground">
                            {pair.doctor}
                          </span>
                          <CopyButton text={`${pair.patient}\n→ ${pair.doctor}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {selected.panel.patientWording.length > 0 ? (
                <section>
                  <SectionHeading title="What the patient may say" hint="be ready to parse this" />
                  <ul className="pt-1">
                    {selected.panel.patientWording.map((line, index) => (
                      <li key={line} className="border-b border-border/70 py-1.5 text-[14px] leading-relaxed text-muted-foreground">
                        <span lang="ja" className="block">{line}</span>
                        {selected.panel.patientWordingSupport?.[index] ? (
                          <span className="block text-[11px]">
                            <span lang="ja" className="block">{selected.panel.patientWordingSupport[index].kana}</span>
                            <span className="block text-info">{selected.panel.patientWordingSupport[index].romaji}</span>
                            <span className="block text-foreground">{selected.panel.patientWordingSupport[index].indonesian}</span>
                            <span className="block text-muted">{selected.panel.patientWordingSupport[index].english}</span>
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.panel.examination.length > 0 ? (
                <section>
                  <SectionHeading title="Examination language" />
                  <ul className="pt-1">
                    {selected.panel.examination.map((line) => (
                      <li key={line} lang="ja" className="border-b border-border/70 py-1.5 text-[14px] leading-relaxed text-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.panel.investigations.length > 0 ? (
                <section>
                  <SectionHeading title="Investigations and how to explain them" />
                  <ul className="pt-1">
                    {selected.panel.investigations.map((line) => (
                      <li key={line} lang="ja" className="border-b border-border/70 py-1.5 text-[14px] leading-relaxed text-foreground">
                        {line}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>

            <aside className="space-y-5 lg:border-l lg:border-border lg:pl-5">
              {selected.panel.relatedSymptoms.length > 0 ? (
                <section>
                  <SectionHeading title="Related symptoms" />
                  <ul className="pt-2">
                    {selected.panel.relatedSymptoms.map((item) => (
                      <li key={item.ja}>
                        {item.url ? (
                          <Link href={item.url} className="group flex items-baseline justify-between gap-3 py-1 text-[13.5px] hover:text-primary">
                            <span lang="ja" className="min-w-0">
                              {item.ja}
                            </span>
                            <span className="shrink-0 text-[10.5px] text-muted">{item.en}</span>
                          </Link>
                        ) : (
                          <span lang="ja" className="flex items-baseline justify-between gap-3 py-1 text-[13.5px] text-foreground">
                            {item.ja}
                            <span className="text-[10.5px] text-muted">{item.en}</span>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {selected.panel.terms.length > 0 ? (
                <section>
                  <SectionHeading title="Common terms" />
                  <ul className="pt-2">
                    {selected.panel.terms.map((item) => (
                      <li key={item.ja}>
                        <Link href={item.url ?? '/medical/terms'} className="group flex items-baseline justify-between gap-3 py-1 text-[13.5px] hover:text-primary">
                          <span lang="ja" className="min-w-0 truncate">
                            {item.ja}
                          </span>
                          <span className="shrink-0 text-[10.5px] text-muted">{item.en}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section>
                <SectionHeading title="Other lookups" />
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {QUICK_STARTERS.slice(0, 8)
                    .filter((starter) => starter !== selected.ja)
                    .map((starter) => (
                      <button
                        key={starter}
                        type="button"
                        lang="ja"
                        onClick={() => setQuery(starter)}
                        className="rounded-[5px] border border-border px-2 py-0.5 text-[12.5px] text-muted-foreground hover:text-foreground"
                      >
                        {starter}
                      </button>
                    ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      ) : null}

      <SafetyNote className="border-t border-border pt-3" />
    </div>
  );
}
