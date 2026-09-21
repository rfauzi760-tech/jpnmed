'use client';

import { RegisterBlock } from '@/components/japanese';
import { useStudy } from '@/lib/store/provider';

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
}: {
  japanese: string;
  kana?: string;
  romaji?: string;
  patientFriendly?: string;
  patientExpression?: string;
}) {
  const { state } = useStudy();
  const friendlyFirst = state.settings.patientFriendlyFirst;

  const blocks = [
    <RegisterBlock key="term" label="Medical term · 医療用語" text={japanese} tone="primary" note={[kana, romaji].filter(Boolean).join(' · ')} />,
    patientFriendly ? (
      <RegisterBlock key="friendly" label="Patient-friendly · やさしい表現" text={patientFriendly} tone="info" />
    ) : null,
    patientExpression ? (
      <RegisterBlock key="patient" label="Typical patient wording · 患者さんの言い方" text={patientExpression} />
    ) : null,
  ].filter(Boolean);

  return <div className="space-y-3">{friendlyFirst ? [...blocks].reverse() : blocks}</div>;
}
