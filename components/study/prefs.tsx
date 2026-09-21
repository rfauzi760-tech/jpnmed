'use client';

import { kanaToRomaji } from '@/lib/utils/romaji';
import { useStudy } from '@/lib/store/provider';

/* ------------------------------------------------------------------
   Preference-aware display.

   Romaji is off by default: an N2 reader should be reading kana. The
   toggle lives in Settings, and these components are the only place
   that reads it, so romaji never leaks into a page by accident.
------------------------------------------------------------------ */

export function RomajiLine({ kana, className }: { kana?: string; className?: string }) {
  const { state } = useStudy();
  if (!state.settings.showRomaji || !kana) return null;
  return <p className={`font-mono text-[11.5px] tracking-wide text-muted ${className ?? ''}`}>{kanaToRomaji(kana)}</p>;
}

export function RomajiInline({ kana }: { kana?: string }) {
  const { state } = useStudy();
  if (!state.settings.showRomaji || !kana) return null;
  return <span className="font-mono text-[11px] text-muted"> {kanaToRomaji(kana)}</span>;
}
