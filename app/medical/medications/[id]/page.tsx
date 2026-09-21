import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMedication } from '@/lib/content';
import { PageBody } from '@/components/shell/app-shell';
import { MedicalLine } from '@/components/medical/medical-line';
import { AddToReviewButton } from '@/components/study/review-controls';
import { Badge, PageHeader, SafetyNote } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Medication · Medical Japanese', description: 'Japanese communication for explaining medication to patients.' };

export default async function MedicationPage({ params }: { params: Promise<{ id: string }> }) {
  const medication = getMedication(decodeURIComponent((await params).id));
  if (!medication) notFound();
  return <PageBody wide><PageHeader eyebrow="Medication · 薬剤" title={medication.japanese} description={`${medication.indonesianGeneric} · ${medication.english}`} meta={<><span lang="ja">{medication.kana}</span><span>{medication.romaji}</span><Badge tone="outline">{medication.drugClassJapanese}</Badge></>} actions={<AddToReviewButton contentType="medication" contentId={medication.id} />} /><div className="mt-5 grid gap-4 lg:grid-cols-2"><MedicalLine label="Why it is prescribed" line={medication.whyPrescribed} /><MedicalLine label="Frequency" line={medication.frequencyInstruction} /><MedicalLine label="Meals" line={medication.mealInstruction} /><MedicalLine label="As needed / PRN" line={medication.prnInstruction} /><MedicalLine label="Duration" line={medication.durationInstruction} /><MedicalLine label="Allergy / reaction question" line={medication.allergyQuestion} />{medication.pregnancyWording ? <MedicalLine label="Pregnancy" line={medication.pregnancyWording} /> : null}{medication.reconciliationQuestions.map((line, index) => <MedicalLine key={index} label="Medication reconciliation" line={line} />)}</div><div className="mt-5 flex flex-wrap gap-2">{medication.dosageForms.map((form) => <Badge key={form} tone="neutral">{form}</Badge>)}{medication.aliases.map((alias) => <Badge key={alias} tone="outline">{alias}</Badge>)}</div><div className="mt-6"><SafetyNote /></div></PageBody>;
}
