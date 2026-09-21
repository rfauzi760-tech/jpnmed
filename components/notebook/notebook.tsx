'use client';

import Link from 'next/link';
import { useDeferredValue, useMemo, useState } from 'react';
import { Bookmark, Plus, Search, Star, Trash2, X } from 'lucide-react';
import type { Note } from '@/lib/content/schema';
import type { LinkTarget } from '@/lib/content/links';
import { CONTENT_TYPE_LABELS, MISTAKE_LABELS } from '@/lib/content/taxonomy';
import { mistakeInsights } from '@/lib/store/selectors';
import { useStudy } from '@/lib/store/provider';
import { cn } from '@/lib/utils/cn';
import { formatRelative } from '@/lib/utils/format';
import { Badge, Button, EmptyState, Field, Input, PageHeader, SectionHeading, Select, Textarea } from '@/components/ui/primitives';
import { Tabs } from '@/components/ui/interactive';
import { Markdown } from './markdown';

/* ------------------------------------------------------------------
   Notebook.

   Three personal collections share one workspace: notes, mistakes and
   saved items. Everything cross-links into the content database through
   the link index, but the content database itself never enters the
   bundle.
------------------------------------------------------------------ */

const NOTE_KINDS: Note['kind'][] = ['custom', 'vocabulary', 'grammar', 'phrase', 'reading', 'disease'];

export function Notebook({
  linkIndex,
  passages,
  initialTab,
  openNew,
}: {
  linkIndex: Record<string, LinkTarget>;
  /** Passage titles, so highlights can be grouped without the content database. */
  passages: { id: string; title: string }[];
  initialTab?: string;
  openNew?: boolean;
}) {
  const { state, actions, ready } = useStudy();
  const [tab, setTab] = useState(initialTab === 'mistakes' || initialTab === 'saved' || initialTab === 'highlights' ? initialTab : 'notes');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('all');
  const [editing, setEditing] = useState<Note | 'new' | null>(openNew ? 'new' : null);
  const [draft, setDraft] = useState({ title: '', body: '', tags: '', kind: 'custom' as Note['kind'] });
  const deferred = useDeferredValue(query);

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of state.notes) for (const item of note.tags) counts.set(item, (counts.get(item) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [state.notes]);

  const filteredNotes = useMemo(() => {
    const needle = deferred.trim().toLowerCase();
    return state.notes
      .filter((note) => (tag === 'all' ? true : note.tags.includes(tag)))
      .filter((note) =>
        needle
          ? [note.title, note.body, note.tags.join(' '), ...note.links.map((link) => linkIndex[link]?.label ?? link)]
              .join(' ')
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [deferred, linkIndex, state.notes, tag]);

  const openEditor = (note: Note | 'new') => {
    if (note === 'new') {
      setDraft({ title: '', body: '', tags: '', kind: 'custom' });
    } else {
      setDraft({ title: note.title, body: note.body, tags: note.tags.join(', '), kind: note.kind });
    }
    setEditing(note);
  };

  const commit = () => {
    if (draft.title.trim().length === 0 && draft.body.trim().length === 0) return;
    actions.saveNote({
      id: editing && editing !== 'new' ? editing.id : undefined,
      kind: draft.kind,
      title: draft.title.trim() || 'Untitled note',
      body: draft.body,
      tags: draft.tags
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      links: editing && editing !== 'new' ? editing.links : [],
      favorite: editing && editing !== 'new' ? editing.favorite : false,
      createdAt: editing && editing !== 'new' ? editing.createdAt : undefined,
    });
    setEditing(null);
  };

  const highlights = useMemo(
    () =>
      passages
        .map((passage) => ({ passageId: passage.id, title: passage.title, words: state.readingMarks[passage.id] ?? [] }))
        .filter((entry) => entry.words.length > 0),
    [passages, state.readingMarks],
  );

  const insights = mistakeInsights(state);
  const mistakeCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mistake of state.mistakes) counts.set(mistake.category, (counts.get(mistake.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [state.mistakes]);
  const [mistakeFilter, setMistakeFilter] = useState('all');

  const filteredMistakes = state.mistakes
    .filter((mistake) => (mistakeFilter === 'all' ? true : mistake.category === mistakeFilter))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Notebook · ノート"
        title="Personal knowledge"
        description="Notes, filed mistakes, saved items and passage highlights — the part of the system that belongs only to you."
        meta={
          <>
            <span>{state.notes.length} notes</span>
            <span>{state.mistakes.filter((mistake) => !mistake.resolved).length} open mistakes</span>
            <span>{state.bookmarks.length} saved</span>
            <span>{highlights.reduce((sum, item) => sum + item.words.length, 0)} highlighted words</span>
          </>
        }
        actions={
          <Button variant="primary" size="sm" disabled={!ready} onClick={() => openEditor('new')}>
            <Plus className="h-3.5 w-3.5" />
            New note
          </Button>
        }
      />

      <Tabs
        items={[
          { id: 'notes', label: 'Notes', count: state.notes.length },
          { id: 'mistakes', label: 'Mistakes', count: state.mistakes.length },
          { id: 'saved', label: 'Saved', count: state.bookmarks.length },
          { id: 'highlights', label: 'Highlights', count: highlights.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {/* Editor */}
      {editing ? (
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
              {editing === 'new' ? 'New note' : 'Edit note'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)} aria-label="Close editor">
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="space-y-3">
              <Field label="Title" htmlFor="nb-title">
                <Input id="nb-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
              </Field>
              <Field label="Body" hint="Markdown: #, -, 1., **bold**, `code`, > quote, links" htmlFor="nb-body">
                <Textarea id="nb-body" rows={10} value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tags" hint="Comma separated" htmlFor="nb-tags">
                  <Input id="nb-tags" value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} />
                </Field>
                <Field label="Kind" htmlFor="nb-kind">
                  <Select id="nb-kind" value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value as Note['kind'] })}>
                    {NOTE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {kind}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={commit}>
                  Save note
                </Button>
                {editing !== 'new' ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      actions.deleteNote(editing.id);
                      setEditing(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="rounded-md border border-border bg-background p-3">
              <div className="meta-label mb-2">Preview</div>
              <Markdown source={draft.body || '_Nothing to preview yet._'} />
              {editing !== 'new' && editing.links.length > 0 ? (
                <div className="mt-3 border-t border-border pt-2">
                  <div className="meta-label mb-1">Linked content</div>
                  <ul className="space-y-1">
                    {editing.links.map((link) => {
                      const target = linkIndex[link];
                      return (
                        <li key={link}>
                          {target ? (
                            <Link href={target.url} className="text-[13px] text-primary hover:underline" lang="ja">
                              {target.label}
                            </Link>
                          ) : (
                            <span className="text-[12px] text-muted">{link}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Notes tab */}
      {tab === 'notes' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes, tags and linked content"
                className="pl-8"
                aria-label="Search notes"
              />
            </div>
            <Select value={tag} onChange={(event) => setTag(event.target.value)} className="w-auto min-w-[150px]" aria-label="Tag">
              <option value="all">Any tag</option>
              {tags.map(([id, count]) => (
                <option key={id} value={id}>
                  {id} ({count})
                </option>
              ))}
            </Select>
          </div>

          {filteredNotes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Notes are added from any entry page (Note button) or written here. Attach a note to a term while you study and it becomes searchable next time."
              action={
                <Button size="sm" variant="secondary" onClick={() => openEditor('new')}>
                  Write the first note
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-3 lg:grid-cols-2">
              {filteredNotes.map((note) => (
                <li key={note.id} className="rounded-lg border border-border bg-surface p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-[14.5px] font-medium text-foreground">{note.title}</h3>
                      <p className="text-[11px] text-muted">
                        {note.kind} · updated {formatRelative(note.updatedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        aria-label={note.favorite ? 'Remove from favourites' : 'Mark as favourite'}
                        onClick={() => actions.saveNote({ ...note, favorite: !note.favorite })}
                        className={note.favorite ? 'text-warning' : 'text-muted hover:text-foreground'}
                      >
                        <Star className={cn('h-3.5 w-3.5', note.favorite && 'fill-current')} />
                      </button>
                      <button
                        type="button"
                        aria-label="Edit note"
                        onClick={() => openEditor(note)}
                        className="text-[11.5px] text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 max-h-56 overflow-hidden">
                    <Markdown source={note.body} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border pt-2">
                    {note.tags.map((item) => (
                      <Badge key={item} tone="neutral">
                        {item}
                      </Badge>
                    ))}
                    {note.links.map((link) => {
                      const target = linkIndex[link];
                      return target ? (
                        <Link key={link} href={target.url} lang="ja" className="text-[11.5px] text-primary hover:underline">
                          {target.label}
                        </Link>
                      ) : null;
                    })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {/* Mistakes tab */}
      {tab === 'mistakes' ? (
        <div className="space-y-4">
          {insights.length > 0 ? (
            <section className="rounded-lg border border-border bg-surface p-3.5">
              <SectionHeading title="What the pattern looks like" hint="derived from filed mistakes" />
              <ul className="mt-2 space-y-1">
                {insights.map((insight) => (
                  <li key={insight} className="text-[12.5px] leading-relaxed text-muted-foreground">
                    {insight}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Select value={mistakeFilter} onChange={(event) => setMistakeFilter(event.target.value)} className="w-auto min-w-[190px]" aria-label="Mistake category">
              <option value="all">All categories</option>
              {mistakeCategories.map(([id, count]) => (
                <option key={id} value={id}>
                  {MISTAKE_LABELS[id as keyof typeof MISTAKE_LABELS]?.en ?? id} ({count})
                </option>
              ))}
            </Select>
            <Button
              variant="danger"
              size="sm"
              disabled={!ready || state.mistakes.length === 0}
              onClick={() => actions.clearMistakes()}
            >
              Clear filed mistakes
            </Button>
            <span className="text-[11.5px] text-muted">Mistakes are filed automatically when a reading answer is wrong.</span>
          </div>

          {filteredMistakes.length === 0 ? (
            <EmptyState
              title="Nothing filed"
              description="Answer a reading question incorrectly and the reason is categorised here — vocabulary, negation, inference, contrast or rushed reading."
            />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {filteredMistakes.map((mistake) => {
                const target = mistake.passageId ? linkIndex[`reading:${mistake.passageId}`] : undefined;
                return (
                  <li key={mistake.id} className="flex flex-wrap items-start gap-3 py-2.5">
                    <Badge tone={mistake.resolved ? 'success' : 'warning'} className="mt-0.5 shrink-0">
                      {MISTAKE_LABELS[mistake.category].en}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-relaxed text-foreground">{mistake.note ?? mistake.contentId}</p>
                      <p className="text-[11px] text-muted">
                        {CONTENT_TYPE_LABELS[mistake.contentType]?.en ?? mistake.contentType} · {formatRelative(mistake.createdAt)}
                        {mistake.questionId ? ` · ${mistake.questionId}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {target ? (
                        <Link href={target.url} className="text-[11.5px] text-primary hover:underline">
                          Re-read passage
                        </Link>
                      ) : null}
                      {!mistake.resolved ? (
                        <Button variant="ghost" size="sm" onClick={() => actions.resolveMistake(mistake.id)}>
                          Mark understood
                        </Button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* Saved tab */}
      {tab === 'saved' ? (
        <div className="space-y-4">
          {state.bookmarks.length === 0 ? (
            <EmptyState
              title="Nothing saved yet"
              description="The Save button on any entry keeps it here without adding it to the spaced repetition queue."
            />
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {state.bookmarks.map((key) => {
                const target = linkIndex[key];
                return (
                  <li key={key} className="flex flex-wrap items-center gap-3 py-2.5">
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      {target ? (
                        <Link href={target.url} className="block" lang="ja">
                          <span className="block truncate text-[14px] text-foreground hover:text-primary">{target.label}</span>
                          <span className="block truncate text-[11.5px] text-muted">{target.sub}</span>
                        </Link>
                      ) : (
                        <span className="text-[13px] text-muted">{key}</span>
                      )}
                    </div>
                    {target ? <Badge tone="neutral">{target.contentType}</Badge> : null}
                    <button
                      type="button"
                      onClick={() => actions.toggleBookmark(key)}
                      className="text-[11.5px] text-muted hover:text-danger"
                    >
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}

      {/* Highlights tab */}
      {tab === 'highlights' ? (
        <div className="space-y-4">
          {highlights.length === 0 ? (
            <EmptyState
              title="No highlights yet"
              description="While reading, click a word and choose Highlight. Marked words collect here per passage."
            />
          ) : (
            <ul className="space-y-4">
              {highlights.map((entry) => {
                const target = linkIndex[`reading:${entry.passageId}`];
                return (
                  <li key={entry.passageId} className="rounded-lg border border-border bg-surface p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={target?.url ?? `/reading/${entry.passageId}`} lang="ja" className="text-[14.5px] text-foreground hover:text-primary">
                        {entry.title}
                      </Link>
                      <span className="text-[11px] text-muted">{entry.words.length} words</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.words.map((word) => (
                        <span
                          key={word}
                          lang="ja"
                          className="rounded-[5px] border border-border bg-primary-muted/40 px-2 py-0.5 text-[13px] text-foreground"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
