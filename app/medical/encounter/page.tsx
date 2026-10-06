import { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageBody } from '@/components/shell/app-shell';
import { EncounterFlow } from '@/components/medical/encounter-flow';

export const metadata: Metadata = {
  title: 'Alur konsultasi terstruktur',
  description: 'Bahasa Jepang klinis per gejala atau penyakit, dari HPI hingga pemeriksaan, terapi, rujukan, rawat, dan pulang.',
};

export default function EncounterPage() {
  return <PageBody><Suspense fallback={<p role="status" className="p-4 text-sm text-muted">Memuat alur konsultasi…</p>}><EncounterFlow /></Suspense></PageBody>;
}
