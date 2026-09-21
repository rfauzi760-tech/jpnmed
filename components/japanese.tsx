import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------
   Japanese typography primitives.

   Furigana is never shown permanently (CONTENT_STYLE_GUIDE §3). Where a
   passage is not hand-annotated, a dictionary built from the content
   database supplies readings by longest-match. Unmatched text simply
   gets no ruby, which is the safe failure mode: a wrong reading would be
   worse than none.
------------------------------------------------------------------ */

const KANJI = /[\u3400-\u4dbf\u4e00-\u9fff々]/;

export type FuriganaMode = 'hidden' | 'hover' | 'always';

export type FuriganaToken = { text: string; reading?: string };

/** Expands `{心臓|しんぞう}` annotations into tokens. */
export function parseFurigana(source: string): FuriganaToken[] {
  const tokens: FuriganaToken[] = [];
  const pattern = /\{([^{}|]+)\|([^{}|]+)\}/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(source))) {
    if (match.index > last) tokens.push({ text: source.slice(last, match.index) });
    tokens.push({ text: match[1], reading: match[2] });
    last = match.index + match[0].length;
  }
  if (last < source.length) tokens.push({ text: source.slice(last) });
  return tokens;
}

export type FuriganaDictionary = Record<string, string>;

/**
 * Longest-match furigana using the content dictionary. Only spans that
 * contain kanji are annotated, and longer matches win, so 心筋梗塞 is
 * preferred over 心.
 */
export function autoFuriganaTokens(source: string, dictionary: FuriganaDictionary, maxLength = 8): FuriganaToken[] {
  const tokens: FuriganaToken[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (buffer) {
      tokens.push({ text: buffer });
      buffer = '';
    }
  };

  while (i < source.length) {
    let matched = false;
    const limit = Math.min(maxLength, source.length - i);
    for (let length = limit; length >= 1; length -= 1) {
      const candidate = source.slice(i, i + length);
      const reading = dictionary[candidate];
      if (reading && KANJI.test(candidate)) {
        flush();
        tokens.push({ text: candidate, reading });
        i += length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      buffer += source[i];
      i += 1;
    }
  }
  flush();
  return tokens;
}

export function tokenizeFurigana(source: string, dictionary?: FuriganaDictionary): FuriganaToken[] {
  // Explicit {漢字|よみ} annotations always win for their span; the rest of the
  // span still goes through the dictionary so ruby coverage stays complete.
  const explicit = parseFurigana(source);
  if (explicit.some((token) => token.reading)) {
    const tokens: FuriganaToken[] = [];
    for (const token of explicit) {
      if (token.reading) {
        tokens.push(token);
      } else if (dictionary) {
        tokens.push(...autoFuriganaTokens(token.text, dictionary));
      } else {
        tokens.push(token);
      }
    }
    return tokens;
  }
  if (!dictionary) return [{ text: source }];
  return autoFuriganaTokens(source, dictionary);
}

export function Ruby({ text, reading }: { text: string; reading?: string }) {
  if (!reading) return <>{text}</>;
  return (
    <ruby>
      {text}
      <rt>{reading}</rt>
    </ruby>
  );
}

export function FuriganaText({
  text,
  mode = 'hover',
  dictionary,
  className,
}: {
  text: string;
  mode?: FuriganaMode;
  dictionary?: FuriganaDictionary;
  className?: string;
}) {
  const tokens = tokenizeFurigana(text, dictionary);
  return (
    <span data-furigana={mode} lang="ja" className={className}>
      {tokens.map((token, index) => (
        <Ruby key={`${token.text}-${index}`} text={token.text} reading={token.reading} />
      ))}
    </span>
  );
}

export function JapaneseText({
  children,
  className,
  serif,
  size = 'base',
  title,
}: {
  children: ReactNode;
  className?: string;
  serif?: boolean;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  title?: string;
}) {
  return (
    <span
      lang="ja"
      title={title}
      className={cn(
        serif && 'font-serif',
        size === 'sm' ? 'text-[13px]' : size === 'lg' ? 'text-lg' : size === 'xl' ? 'text-2xl' : 'text-[14.5px]',
        'leading-relaxed',
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ---------------------------- Reading register ---------------------------- */

export function RegisterBlock({
  label,
  text,
  tone = 'neutral',
  note,
  className,
}: {
  label: string;
  text: string;
  tone?: 'neutral' | 'primary' | 'info';
  note?: string;
  className?: string;
}) {
  return (
    <div className={cn('border-l-2 pl-3', tone === 'primary' ? 'border-l-primary' : tone === 'info' ? 'border-l-info' : 'border-l-border-strong', className)}>
      <div className="meta-label">{label}</div>
      <p lang="ja" className="mt-0.5 text-[15px] leading-relaxed text-foreground">
        {text}
      </p>
      {note ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function MedicalTermDisplay({
  japanese,
  kana,
  patientFriendly,
  patientExpression,
  compact,
  className,
}: {
  japanese: string;
  kana?: string;
  patientFriendly?: string;
  patientExpression?: string;
  compact?: boolean;
  className?: string;
}) {
  const hasRegisters = Boolean(patientFriendly || patientExpression);
  if (!hasRegisters) {
    return (
      <div className={className}>
        <div lang="ja" className="text-xl font-medium tracking-tight text-foreground">
          {japanese}
        </div>
        {kana ? <div lang="ja" className="mt-0.5 text-[13px] text-muted-foreground">{kana}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <RegisterBlock label="Medical term · 医療用語" text={japanese} tone="primary" />
      {!compact && patientFriendly ? <RegisterBlock label="Patient-friendly · やさしい表現" text={patientFriendly} tone="info" /> : null}
      {!compact && patientExpression ? <RegisterBlock label="Typical patient wording · 患者さんの言い方" text={patientExpression} /> : null}
    </div>
  );
}
