import type { Metadata } from 'next';
import { CONTENT_STATS } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { SettingsPanel } from '@/components/settings/settings-panel';

export const metadata: Metadata = {
  title: 'Settings and data',
  description: 'Theme, reading typography, study scheduling, and export or import of your study profile.',
};

export default function SettingsPage() {
  const contentStats = [
    { label: 'Vocabulary', value: CONTENT_STATS.vocabulary },
    { label: 'Grammar', value: CONTENT_STATS.grammar },
    { label: 'Reading passages', value: CONTENT_STATS.readings },
    { label: 'Reading questions', value: CONTENT_STATS.readingQuestions },
    { label: 'Medical terms', value: CONTENT_STATS.terms },
    { label: 'Clinical phrases', value: CONTENT_STATS.phrases },
    { label: 'Symptoms', value: CONTENT_STATS.symptoms },
    { label: 'Diseases', value: CONTENT_STATS.diseases },
    { label: 'Clinical cases', value: CONTENT_STATS.cases },
    { label: 'Total entries', value: CONTENT_STATS.total },
  ];

  return (
    <PageBody>
      <SettingsPanel contentStats={contentStats} />
    </PageBody>
  );
}
