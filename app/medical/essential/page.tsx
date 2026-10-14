import type { Metadata } from 'next';
import { PageBody } from '@/components/shell/app-shell';
import { EssentialCommunication } from '@/components/medical/essential-communication';

export const metadata: Metadata = {
  title: 'Essential J-Unit',
  description: 'Kalimat penting dokter dan pasien Jepang untuk praktik di Indonesia, dengan kana, romaji, dan terjemahan Indonesia.',
};

export default function EssentialPage() {
  return <PageBody><EssentialCommunication /></PageBody>;
}
