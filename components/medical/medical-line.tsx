'use client';

import type { ClinicalLine } from '@/lib/content/schema';
import { useStudy } from '@/lib/store/provider';

export function MedicalLine({ label, line }: { label: string; line: ClinicalLine }) {
  const { state } = useStudy();
  const display = state.settings.medicalDisplay;
  const showKana = display.furigana === 'always' || (display.furigana === 'difficult' && /[\u3400-\u9fff]/.test(line.japanese));
  const romaji = display.romaji === 'always' ? <p className="mt-0.5 text-[12px] text-info">{line.romaji}</p> : display.romaji === 'hover' ? <p className="mt-0.5 text-[12px] text-info opacity-0 transition-opacity group-hover:opacity-100">{line.romaji}</p> : null;
  return <div className="group rounded-md border border-border bg-surface p-3"><div className="meta-label">{label}</div><p lang="ja" className="mt-1 text-[16px] leading-relaxed text-foreground">{line.japanese}</p>{showKana ? <p lang="ja" className="mt-0.5 text-[12px] text-muted">{line.kana}</p> : null}{romaji}{display.indonesian ? <p className="mt-2 text-[13px] leading-relaxed text-foreground">{line.indonesian}</p> : null}{display.english ? <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{line.english}</p> : null}</div>;
}
