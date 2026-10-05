'use client';

import Link from 'next/link';
import type { SymptomHistoryPrompt } from '@/lib/content/schema';
import { MedicalLine } from './medical-line';
import { SectionHeading } from '@/components/ui/primitives';

export type ClinicalHpiGroup = {
  id: string;
  titleIndonesian: string;
  titleEnglish: string;
  prompts: SymptomHistoryPrompt[];
  href?: string;
};

export function ClinicalHpi({
  groups,
  title = 'Anamnesis terarah · Focused history',
  hint = 'Pertanyaan disesuaikan dengan keluhan, bukan daftar onset/durasi yang diulang.',
}: {
  groups: ClinicalHpiGroup[];
  title?: string;
  hint?: string;
}) {
  if (groups.length === 0) return null;

  return (
    <section>
      <SectionHeading title={title} hint={hint} />
      <div className="space-y-5 pt-3">
        {groups.map((group) => (
          <section key={group.id} className="rounded-lg border border-border bg-surface/40 p-3 sm:p-4">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2">
              <div>
                <h3 className="text-[14px] font-semibold text-foreground">{group.titleIndonesian}</h3>
                <p className="text-[11px] text-muted">{group.titleEnglish} · {group.prompts.length} focus questions</p>
              </div>
              {group.href ? <Link href={group.href} className="text-[11px] text-primary hover:underline">Buka halaman gejala →</Link> : null}
            </div>
            <ol className="space-y-4">
              {group.prompts.map((prompt, index) => (
                <li key={`${group.id}-${prompt.id}`} className="space-y-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h4 className="text-[12px] font-semibold text-foreground">{index + 1}. {prompt.focusIndonesian}</h4>
                    <span className="text-[10px] text-muted">{prompt.focusEnglish}</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-muted-foreground">{prompt.clinicalReasonIndonesian}</p>
                  <MedicalLine label="Dokter · pertanyaan" line={prompt.question} />
                  {prompt.patientAnswers.map((answer, answerIndex) => (
                    <MedicalLine key={`${prompt.id}-answer-${answerIndex}`} label="Pasien · contoh jawaban alami" line={answer} />
                  ))}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </section>
  );
}
