'use client';

import { Fragment, useMemo } from 'react';
import { parseFurigana } from '@/components/japanese';
import type { GlossaryEntry } from '@/lib/content/lookup';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------
   Passage rendering.

   Paragraphs are tokenised once against the passage dictionary, so a
   word becomes clickable, connectors can be underlined, highlights can
   be kept, and the evidence sentence can be marked — all without
   touching the stored text.

   Typography uses the .passage rules in globals.css: size, leading and
   measure are CSS variables the learner controls from the toolbar.
------------------------------------------------------------------ */

export type PassageParagraph = { index: number; text: string; role: string };

export type Token = {
  text: string;
  reading?: string;
  entry?: GlossaryEntry;
  connector?: boolean;
};

const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff々]/;

function matchLongest(
  text: string,
  surfaces: string[],
  lookup: Map<string, GlossaryEntry>,
  furigana: Record<string, string>,
  connectors: Set<string>,
): Token[] {
  const tokens: Token[] = [];
  let buffer = '';
  let i = 0;
  const maxLength = surfaces.reduce((max, surface) => Math.max(max, surface.length), 1);

  const flush = () => {
    if (buffer) {
      tokens.push({ text: buffer });
      buffer = '';
    }
  };

  while (i < text.length) {
    let matched = false;
    const limit = Math.min(maxLength, text.length - i);
    for (let length = limit; length >= 1; length -= 1) {
      const candidate = text.slice(i, i + length);
      const entry = lookup.get(candidate);
      const reading = furigana[candidate];
      if (!entry && !reading) continue;
      if (!entry && !KANJI.test(candidate)) continue;
      flush();
      tokens.push({ text: candidate, reading, entry, connector: connectors.has(candidate) });
      i += length;
      matched = true;
      break;
    }
    if (!matched) {
      buffer += text[i];
      i += 1;
    }
  }
  flush();
  return tokens;
}

/** Tokenises one paragraph, honouring explicit {漢字|よみ} annotations. */
export function tokenizeParagraph(
  text: string,
  glossary: Record<string, GlossaryEntry>,
  furigana: Record<string, string>,
  connectors: string[],
): Token[] {
  const lookup = new Map(Object.entries(glossary));
  const connectorSet = new Set(connectors);
  const surfaces = [...new Set([...Object.keys(glossary), ...Object.keys(furigana)])].sort((a, b) => b.length - a.length);

  const annotated = parseFurigana(text);
  if (annotated.some((token) => token.reading)) {
    const tokens: Token[] = [];
    for (const token of annotated) {
      if (token.reading) {
        tokens.push({
          text: token.text,
          reading: token.reading,
          entry: lookup.get(token.text),
          connector: connectorSet.has(token.text),
        });
      } else {
        tokens.push(...matchLongest(token.text, surfaces, lookup, furigana, connectorSet));
      }
    }
    return tokens;
  }

  return matchLongest(text, surfaces, lookup, furigana, connectorSet);
}

export function PassageView({
  paragraphs,
  glossary,
  furigana,
  connectors,
  furiganaMode,
  showConnectors,
  marks,
  selected,
  evidence,
  showRoles,
  fontSize,
  leading,
  measureRem,
  serif,
  onSelect,
}: {
  paragraphs: PassageParagraph[];
  glossary: Record<string, GlossaryEntry>;
  furigana: Record<string, string>;
  connectors: string[];
  furiganaMode: 'hidden' | 'hover' | 'always';
  showConnectors: boolean;
  marks: string[];
  selected?: string;
  /** Evidence sentence and paragraph to mark once answers are analysed. */
  evidence?: { paragraph: number; sentence: string };
  showRoles: boolean;
  fontSize: number;
  leading: number;
  measureRem: number;
  serif: boolean;
  onSelect: (surface: string) => void;
}) {
  const tokenised = useMemo(
    () =>
      paragraphs.map((paragraph) => {
        const parts: { tokens: Token[]; evidence: boolean }[] = [];
        if (evidence && evidence.paragraph === paragraph.index && paragraph.text.includes(evidence.sentence)) {
          const [before, , after] = paragraph.text.split(evidence.sentence);
          parts.push({ tokens: tokenizeParagraph(before ?? '', glossary, furigana, connectors), evidence: false });
          parts.push({ tokens: tokenizeParagraph(evidence.sentence, glossary, furigana, connectors), evidence: true });
          if (after) parts.push({ tokens: tokenizeParagraph(after, glossary, furigana, connectors), evidence: false });
        } else {
          parts.push({ tokens: tokenizeParagraph(paragraph.text, glossary, furigana, connectors), evidence: false });
        }
        return { paragraph, parts };
      }),
    [connectors, evidence, furigana, glossary, paragraphs],
  );

  const passageStyle = {
    '--reading-size': `${fontSize}px`,
    '--reading-leading': String(leading),
    '--reading-width': `${measureRem}rem`,
  } as React.CSSProperties;

  return (
    <article className="space-y-4">
      {tokenised.map(({ paragraph, parts }) => (
        <div key={paragraph.index} className="flex items-start gap-3">
          <span className="mt-[5px] w-5 shrink-0 select-none text-right font-mono text-[10.5px] text-muted">
            {paragraph.index + 1}
          </span>
          <p
            lang="ja"
            data-furigana={furiganaMode}
            data-type={serif ? 'serif' : 'sans'}
            style={passageStyle}
            className="passage min-w-0 flex-1 tracking-[0.01em] text-foreground"
          >
            {parts.map((part, partIndex) => (
              <span key={partIndex} className={cn(part.evidence && 'mark-evidence')}>
                {part.tokens.map((token, tokenIndex) => {
                  if (!token.reading && !token.entry) return <Fragment key={tokenIndex}>{token.text}</Fragment>;
                  const isMarked = marks.includes(token.text);
                  const isSelected = selected === token.text;
                  return (
                    <span
                      key={tokenIndex}
                      role="button"
                      tabIndex={-1}
                      onClick={() => onSelect(token.text)}
                      title={token.entry ? token.entry.en : token.reading}
                      className={cn(
                        'word-tap',
                        isMarked && 'mark-highlight',
                        isSelected && 'bg-primary-muted ring-1 ring-primary/40',
                        token.connector && showConnectors && !isMarked && !isSelected && 'mark-connector',
                      )}
                    >
                      {token.reading ? (
                        <ruby>
                          {token.text}
                          <rt>{token.reading}</rt>
                        </ruby>
                      ) : (
                        token.text
                      )}
                    </span>
                  );
                })}
              </span>
            ))}
          </p>
          {showRoles ? (
            <span className="mt-[7px] hidden w-28 shrink-0 text-right text-[10.5px] leading-tight text-muted lg:block">
              {paragraph.role}
            </span>
          ) : null}
        </div>
      ))}
    </article>
  );
}
