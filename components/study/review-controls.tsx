'use client';

import { useState } from 'react';
import { BookmarkCheck, Bookmark, Check, Layers, Plus, Trash2, X } from 'lucide-react';
import type { ContentType, Note } from '@/lib/content/schema';
import { MASTERY_LABELS, masteryOf } from '@/lib/srs/queue';
import { useStudy } from '@/lib/store/provider';
import { makeReviewKey } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { formatRelative, intervalLabel } from '@/lib/utils/format';
import { Badge, Button, Field, Input, Textarea } from '@/components/ui/primitives';
import { Dialog } from '@/components/ui/interactive';

/* ------------------------------------------------------------------
   Learning-state controls.

   Every content surface reuses these, so "add to review", mastery and
   personal notes behave identically whether the learner is on a
   vocabulary entry, a disease page or inside Quick Clinical Mode.
------------------------------------------------------------------ */

const MASTERY_TONE = {
  new: 'neutral',
  learning: 'warning',
  familiar: 'info',
  strong: 'success',
  mastered: 'success',
} as const;

export function MasteryBadge({ contentType, contentId }: { contentType: ContentType; contentId: string }) {
  const { state, ready } = useStudy();
  if (!ready) return null;
  const key = makeReviewKey(contentType, contentId);
  const item = state.reviews[key];
  const level = masteryOf(item);
  if (level === 'new' && !item) return null;

  return (
    <Badge tone={MASTERY_TONE[level]} title={item ? `Due ${intervalLabel(item.due)} from now` : undefined}>
      {MASTERY_LABELS[level]}
      {item && item.reps > 0 ? <span className="ml-1 font-mono tabular-nums opacity-70">{item.reps}</span> : null}
    </Badge>
  );
}

export function AddToReviewButton({
  contentType,
  contentId,
  size = 'sm',
  className,
}: {
  contentType: ContentType;
  contentId: string;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const { state, actions, ready } = useStudy();
  const key = makeReviewKey(contentType, contentId);
  const tracked = Boolean(state.reviews[key]);

  if (!ready) {
    return (
      <Button size={size} variant="secondary" disabled className={className}>
        Add to review
      </Button>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <Button
        size={size}
        variant={tracked ? 'ghost' : 'secondary'}
        onClick={() =>
          tracked ? actions.removeFromReview(key) : actions.addToReview({ contentType, contentId })
        }
        title={tracked ? 'Remove from the review queue' : 'Add to the spaced repetition queue'}
      >
        {tracked ? <Check className="h-3.5 w-3.5 text-success" /> : <Plus className="h-3.5 w-3.5" />}
        {tracked ? 'In review' : 'Add to review'}
      </Button>
      <MasteryBadge contentType={contentType} contentId={contentId} />
    </span>
  );
}

export function BookmarkButton({ contentKey, label = 'Save' }: { contentKey: string; label?: string }) {
  const { state, actions, ready } = useStudy();
  const saved = state.bookmarks.includes(contentKey);
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={!ready}
      aria-pressed={saved}
      onClick={() => actions.toggleBookmark(contentKey)}
      title={saved ? 'Remove from the notebook' : 'Save to the notebook'}
    >
      {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Bookmark className="h-3.5 w-3.5" />}
      {saved ? 'Saved' : label}
    </Button>
  );
}

/* ------------------------------- Notes ------------------------------------ */

export function NoteButton({
  contentType,
  contentId,
  defaultTitle,
  label = 'Note',
  className,
}: {
  contentType: ContentType | 'note';
  contentId: string;
  defaultTitle: string;
  label?: string;
  className?: string;
}) {
  const { state, actions, ready } = useStudy();
  const [open, setOpen] = useState(false);
  const link = `${contentType}:${contentId}`;
  const existing = state.notes.find((note) => note.links.includes(link));

  const [title, setTitle] = useState(existing?.title ?? defaultTitle);
  const [body, setBody] = useState(existing?.body ?? '');
  const [tags, setTags] = useState((existing?.tags ?? []).join(', '));

  const noteKind: Note['kind'] =
    contentType === 'vocabulary'
      ? 'vocabulary'
      : contentType === 'grammar'
        ? 'grammar'
        : contentType === 'clinical-phrase'
          ? 'phrase'
          : contentType === 'disease'
            ? 'disease'
            : 'custom';

  const save = () => {
    actions.saveNote({
      id: existing?.id,
      kind: noteKind,
      title: title.trim() || defaultTitle,
      body,
      tags: tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      links: [link],
      createdAt: existing?.createdAt,
    });
    setOpen(false);
  };

  return (
    <>
      <Button size="sm" variant="ghost" disabled={!ready} onClick={() => setOpen(true)} className={className}>
        {existing ? <BookmarkCheck className="h-3.5 w-3.5 text-primary" /> : <Plus className="h-3.5 w-3.5" />}
        {existing ? 'Edit note' : label}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={existing ? 'Edit note' : 'Add a note'}
        description={`Attached to ${link}`}
        footer={
          <>
            {existing ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  actions.deleteNote(existing.id);
                  setOpen(false);
                }}
                className="mr-auto"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={save}>
              Save note
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title" htmlFor="note-title">
            <Input id="note-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </Field>
          <Field label="Body" hint="Markdown: #, -, **bold**, `code`, links" htmlFor="note-body">
            <Textarea id="note-body" rows={7} value={body} onChange={(event) => setBody(event.target.value)} />
          </Field>
          <Field label="Tags" hint="Comma separated" htmlFor="note-tags">
            <Input id="note-tags" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="cardiology, mixing-up" />
          </Field>
          {existing ? (
            <p className="text-[11.5px] text-muted">Last updated {formatRelative(existing.updatedAt)}</p>
          ) : null}
        </div>
      </Dialog>
    </>
  );
}

/** One-line state summary used in detail page headers. */
export function ReviewStateLine({ contentType, contentId }: { contentType: ContentType; contentId: string }) {
  const { state, ready } = useStudy();
  if (!ready) return null;
  const item = state.reviews[makeReviewKey(contentType, contentId)];
  if (!item) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
        <Layers className="h-3.5 w-3.5" />
        Not in the review queue
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] text-muted">
      <Layers className="h-3.5 w-3.5" />
      {item.state === 'new' ? 'New card' : `Due in ${intervalLabel(item.due)}`} · {item.reps} review
      {item.reps === 1 ? '' : 's'}
      {item.lastReviewedAt ? ` · last ${formatRelative(item.lastReviewedAt)}` : ''}
    </span>
  );
}
