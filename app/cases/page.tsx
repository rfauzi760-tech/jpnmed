import type { Metadata } from 'next';
import { CASES } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { CaseIndex, type CaseRow } from '@/components/cases/index-list';
import { SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = {
  title: 'Clinical cases',
  description: 'Japanese consultation simulations with hidden diagnoses, red-flag scoring and phrasing feedback.',
};

export default function CasesPage() {
  const rows: CaseRow[] = CASES.map((item) => ({
    id: item.id,
    title: item.title,
    titleJa: item.titleJa,
    specialty: item.specialty,
    difficulty: item.difficulty,
    setting: item.setting,
    chiefComplaint: item.chiefComplaint,
    questionCount: item.requiredQuestions.length,
    redFlagCount: item.requiredQuestions.filter((question) => question.redFlag).length,
    teachingPoints: item.teachingPoints.length,
  }));

  return (
    <PageBody>
      <CaseIndex rows={rows} />
      <div className="mt-6">
        <SafetyNote />
      </div>
    </PageBody>
  );
}
