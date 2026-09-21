import type { Metadata } from 'next';
import { READINGS } from '@/lib/content';
import { buildLinkIndex } from '@/lib/content/links';
import { PageBody } from '@/components/shell/app-shell';
import { Notebook } from '@/components/notebook/notebook';

export const metadata: Metadata = {
  title: 'Notebook',
  description: 'Personal notes, filed reading mistakes, saved items and passage highlights.',
};

export default async function NotebookPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; new?: string }>;
}) {
  const params = await searchParams;

  return (
    <PageBody>
      <Notebook
        linkIndex={buildLinkIndex()}
        passages={READINGS.map((passage) => ({ id: passage.id, title: passage.title }))}
        initialTab={params.tab}
        openNew={params.new === '1'}
      />
    </PageBody>
  );
}
