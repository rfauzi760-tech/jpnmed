import type { Metadata } from 'next';
import { PageBody } from '@/components/shell/app-shell';
import { JUnitMode } from '@/components/medical/j-unit-mode';

export const metadata: Metadata = { title: 'J-Unit Mode', description: 'Rapid Japanese clinical communication practice for the full consultation.' };

export default function JUnitPage() {
  return <PageBody wide><JUnitMode /></PageBody>;
}
