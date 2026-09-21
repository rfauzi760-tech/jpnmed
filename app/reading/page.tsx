import type { Metadata } from 'next';
import { READINGS } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { ReadingIndex, type PassageRow } from '@/components/reading/index-list';

export const metadata: Metadata = {
  title: 'Reading',
  description: 'N2 and N1 reading passages with evidence-based result analysis and mistake categorisation.',
};

export default function ReadingPage() {
  const rows: PassageRow[] = READINGS.map((passage) => ({
    id: passage.id,
    title: passage.title,
    titleEn: passage.titleEn,
    category: passage.category,
    level: passage.level,
    topic: passage.topic,
    characterCount: passage.characterCount,
    estimatedMinutes: passage.estimatedMinutes,
    difficulty: passage.difficulty,
    questionCount: passage.questions.length,
    skills: [...new Set(passage.questions.map((question) => question.skill))],
    verificationStatus: passage.verificationStatus,
  }));

  return (
    <PageBody>
      <ReadingIndex rows={rows} />
    </PageBody>
  );
}
