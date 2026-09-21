import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getInvestigation } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { MedicalLine } from '@/components/medical/medical-line';
import { AddToReviewButton } from '@/components/study/review-controls';
import { Badge, PageHeader, SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Investigation · Medical Japanese', description: 'Japanese communication for explaining tests and investigations.' };

export default async function InvestigationPage({ params }: { params: Promise<{ id: string }> }) {
  const investigation = getInvestigation(decodeURIComponent((await params).id));
  if (!investigation) notFound();
  return <PageBody wide><PageHeader eyebrow="Investigation · 検査" title={investigation.japanese} description={`${investigation.indonesian} · ${investigation.english}`} meta={<><span lang="ja">{investigation.kana}</span><span>{investigation.romaji}</span><Badge tone="outline">{investigation.category}</Badge></>} actions={<AddToReviewButton contentType="investigation" contentId={investigation.id} />} /><div className="mt-5 grid gap-4 lg:grid-cols-2"><MedicalLine label="Patient explanation" line={investigation.patientExplanation} />{investigation.preparationInstruction ? <MedicalLine label="Before the test" line={investigation.preparationInstruction} /> : null}<MedicalLine label="Discussing the result" line={investigation.resultDiscussion} /></div><div className="mt-6"><SafetyNote /></div></PageBody>;
}
