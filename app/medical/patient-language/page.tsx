import type { Metadata } from 'next';
import Link from 'next/link';
import { MEDICAL_TERMS } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { Badge, PageHeader, SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Patient language and medical onomatopoeia',
  description: 'Natural Japanese symptom expressions, mimetic words and the formal clinical terms they map to.',
};

export default function PatientLanguagePage() {
  const rows = MEDICAL_TERMS.filter((term) => term.tags.includes('patient-language'));

  return (
    <PageBody wide>
      <PageHeader
        eyebrow="Patient language · 患者さんの言い方"
        title="Medical onomatopoeia and natural symptom wording"
        description="These are the words patients and parents actually use. Read the clinical meaning, then follow the related technical term instead of treating the expression as a diagnosis by itself."
        meta={<><span>{rows.length} patient expressions</span><span>{rows.filter((term) => term.tags.includes('onomatopoeia')).length} mimetic expressions</span></>}
      />

      <div className="mt-5 divide-y divide-border border-y border-border">
        {rows.map((term) => (
          <article key={term.id} className="grid gap-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <div>
              <div className="flex flex-wrap items-baseline gap-2">
                <Link href={`/medical/terms/${encodeURIComponent(term.id)}`} className="text-[18px] text-foreground hover:text-primary" lang="ja">
                  {term.japanese}
                </Link>
                <Badge tone="outline">{term.tags.includes('onomatopoeia') ? 'onomatopoeia' : 'patient wording'}</Badge>
              </div>
              <p lang="ja" className="mt-1 text-[12px] text-muted">{term.kana}</p>
              <p className="mt-1 text-[12px] text-info">{term.romaji}</p>
              <p className="mt-2 text-[13px] text-foreground">{term.indonesian}</p>
              <p className="text-[12px] text-muted">{term.english}</p>
              {term.relatedIds.length > 0 ? <p className="mt-2 text-[11.5px] text-muted">Formal/related: {term.relatedIds.join(' · ')}</p> : null}
            </div>
            <div className="space-y-2">
              {term.definitionJa ? <p lang="ja" className="text-[13px] leading-relaxed text-foreground">{term.definitionJa}</p> : null}
              {term.usageNote ? <p className="text-[12px] leading-relaxed text-muted-foreground">Nuance: {term.usageNote}</p> : null}
              {term.example ? (
                <div className="rounded-md border border-border bg-surface-secondary/50 p-3">
                  <p className="meta-label">Example</p>
                  <p lang="ja" className="mt-1 text-[14px] text-foreground">{term.example.japanese}</p>
                  <p lang="ja" className="text-[11.5px] text-muted">{term.example.kana}</p>
                  <p className="text-[11.5px] text-info">{term.example.romaji}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">{term.example.indonesian}</p>
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6"><SafetyNote /></div>
    </PageBody>
  );
}
