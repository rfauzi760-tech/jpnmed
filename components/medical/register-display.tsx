'use client';

import { RegisterBlock } from '@/components/japanese';
import { VerificationBadge } from '@/components/ui/primitives';
import { useStudy } from '@/lib/store/provider';
import type { MedicalRegisterSupport } from '@/lib/content/schema';

/* ------------------------------------------------------------------
   Register display.

   The three registers are always distinct; the only preference is which
   one is read first. A learner who explains more than they chart sees
   the plain-language version at the top.
------------------------------------------------------------------ */

export function RegisterDisplay({
  japanese,
  kana,
  romaji,
  patientFriendly,
  patientExpression,
  patientFriendlySupport,
  patientExpressionSupport,
}: {
  japanese: string;
  kana?: string;
  romaji?: string;
  patientFriendly?: string;
  patientExpression?: string;
  patientFriendlySupport?: MedicalRegisterSupport;
  patientExpressionSupport?: MedicalRegisterSupport;
}) {
  const { state } = useStudy();
  const friendlyFirst = state.settings.patientFriendlyFirst;
  const display = state.settings.medicalDisplay;

  const supportBlock = (label: string, support: MedicalRegisterSupport, tone: 'neutral' | 'info') => (
    <div className={`border-l-2 pl-3 ${tone === 'info' ? 'border-l-info' : 'border-l-border-strong'}`}>
      <div className="flex items-center gap-2">
        <div className="meta-label">{label}</div>
        {support.verificationStatus === 'draft' ? <VerificationBadge status="draft" /> : null}
      </div>
      <p lang="ja" className="mt-0.5 text-[15px] leading-relaxed text-foreground">{support.japanese}</p>
      <p lang="ja" className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{support.kana}</p>
      {display.romaji === 'always' ? <p className="mt-0.5 text-[12px] leading-relaxed text-info">{support.romaji}</p> : display.romaji === 'hover' ? <p className="mt-0.5 text-[12px] leading-relaxed text-info">{support.romaji}</p> : null}
      <p className="mt-1 text-[13px] leading-relaxed text-foreground">{support.indonesian}</p>
      {display.english ? <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">{support.english}</p> : null}
    </div>
  );

  const blocks = [
    <RegisterBlock key="term" label="Medical term · 医療用語" text={japanese} tone="primary" note={[kana, romaji].filter(Boolean).join(' · ')} />,
    patientFriendlySupport ? (
      <div key="friendly">{supportBlock('Patient-friendly · やさしい表現', patientFriendlySupport, 'info')}</div>
    ) : patientFriendly ? (
      <RegisterBlock key="friendly" label="Patient-friendly · やさしい表現" text={patientFriendly} tone="info" />
    ) : null,
    patientExpressionSupport ? (
      <div key="patient">{supportBlock('Typical patient wording · 患者さんの言い方', patientExpressionSupport, 'neutral')}</div>
    ) : patientExpression ? (
      <RegisterBlock key="patient" label="Typical patient wording · 患者さんの言い方" text={patientExpression} />
    ) : null,
  ].filter(Boolean);

  return <div className="space-y-3">{friendlyFirst ? [...blocks].reverse() : blocks}</div>;
}
