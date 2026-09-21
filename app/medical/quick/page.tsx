import type { Metadata } from 'next';
import { buildQuickIndex } from '@/lib/content/quick';
import { PageBody } from '@/components/shell/app-shell';
import { QuickClinicalMode } from '@/components/medical/quick-mode';

export const metadata: Metadata = {
  title: 'Quick clinical mode',
  description: 'Instant bedside lookup: key questions, related symptoms, terms, examination language and patient explanations.',
};

export default function QuickClinicalPage() {
  // The whole index is pre-computed on the server; the client only scores
  // strings, so the panel appears on the first keystroke with no request.
  const entries = buildQuickIndex();
  return (
    <PageBody wide>
      <QuickClinicalMode entries={entries} />
    </PageBody>
  );
}
