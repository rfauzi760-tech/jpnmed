import type { ReactNode } from 'react';

/* ------------------------------------------------------------------
   Deliberately small markdown renderer.

   Headings, lists, quotes, rules, bold, italic, inline code and links.
   No raw HTML, no plugins: a personal notebook needs reliable legible
   output, not a full markdown implementation.
------------------------------------------------------------------ */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i}`;
    i += 1;
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key} lang="ja" className="rounded bg-surface-secondary px-1 py-px font-mono text-[12.5px] text-foreground">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('[')) {
      const [, label, url] = /\[([^\]]+)\]\(([^)]+)\)/.exec(token) ?? [];
      nodes.push(
        <a key={key} href={url} className="text-primary hover:underline" rel="noreferrer">
          {label}
        </a>,
      );
    } else {
      nodes.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ source, className }: { source: string; className?: string }) {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let list: string[] = [];
  let listOrdered = false;

  const flushList = (key: string) => {
    if (list.length === 0) return;
    const items = list.map((item, index) => (
      <li key={`${key}-${index}`} lang="ja" className="leading-relaxed">
        {renderInline(item, `${key}-${index}`)}
      </li>
    ));
    blocks.push(
      listOrdered ? (
        <ol key={key} className="ml-4 list-decimal space-y-0.5 text-[13.5px] text-foreground">
          {items}
        </ol>
      ) : (
        <ul key={key} className="ml-4 list-disc space-y-0.5 text-[13.5px] text-foreground">
          {items}
        </ul>
      ),
    );
    list = [];
  };

  lines.forEach((line, index) => {
    const key = `block-${index}`;
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      if (listOrdered) flushList(`${key}-prev`);
      listOrdered = false;
      list.push(trimmed.replace(/^[-*]\s+/, ''));
      return;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      if (!listOrdered) flushList(`${key}-prev`);
      listOrdered = true;
      list.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }
    flushList(`${key}-list`);
    if (trimmed.length === 0) return;
    if (trimmed.startsWith('### ')) {
      blocks.push(
        <h4 key={key} className="mt-1 text-[13px] font-semibold text-foreground">
          {renderInline(trimmed.slice(4), key)}
        </h4>,
      );
      return;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h3 key={key} className="mt-1 text-[14px] font-semibold tracking-tight text-foreground">
          {renderInline(trimmed.slice(3), key)}
        </h3>,
      );
      return;
    }
    if (trimmed.startsWith('# ')) {
      blocks.push(
        <h2 key={key} className="text-[15px] font-semibold tracking-tight text-foreground">
          {renderInline(trimmed.slice(2), key)}
        </h2>,
      );
      return;
    }
    if (trimmed === '---') {
      blocks.push(<hr key={key} className="border-0 border-t border-border" />);
      return;
    }
    if (trimmed.startsWith('> ')) {
      blocks.push(
        <blockquote key={key} lang="ja" className="border-l-2 border-l-border-strong pl-3 text-[13px] leading-relaxed text-muted-foreground">
          {renderInline(trimmed.slice(2), key)}
        </blockquote>,
      );
      return;
    }
    blocks.push(
      <p key={key} lang="ja" className="text-[13.5px] leading-relaxed text-foreground">
        {renderInline(trimmed, key)}
      </p>,
    );
  });
  flushList('tail');

  if (blocks.length === 0) return <p className={className ?? 'text-[13px] text-muted'}>Empty note.</p>;

  return <div className={`space-y-1.5 ${className ?? ''}`}>{blocks}</div>;
}
