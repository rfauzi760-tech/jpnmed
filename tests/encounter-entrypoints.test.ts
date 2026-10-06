import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { encounterSubjectHref } from '@/lib/content/encounter-route';
import { PHRASE_STAGES } from '@/lib/content/taxonomy';

const source = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('structured encounter entry points', () => {
  it('places a dedicated Indonesian-first entry near the top of the Medical hub', () => {
    const hub = source('app/medical/page.tsx');
    expect(hub).toContain('Alur Klinis Lengkap');
    expect(hub).toContain('href="/medical/encounter"');
    expect(hub.indexOf('Alur Klinis Lengkap')).toBeLessThan(hub.indexOf('RFSmed coverage dashboard'));
  });

  it('offers the flow separately from the Phrasebook stage taxonomy', () => {
    const phrasebook = source('components/medical/phrasebook.tsx');
    expect(phrasebook).toContain('href={encounterSubjectHref(selectedHpiSymptom?.id)}');
    expect(phrasebook).toContain('Alur klinis lengkap');
    expect(PHRASE_STAGES.map((stage) => stage.id)).not.toContain('encounter');
  });

  it('adds a J-Unit shortcut and carries the selected symptom when present', () => {
    const junit = source('components/medical/j-unit-mode.tsx');
    expect(junit).toContain('href={encounterSubjectHref(selectedSymptom?.id)}');
    expect(junit).toContain('Buka Alur Klinis');
  });

  it.each([
    ['symptom', 'app/medical/symptoms/[id]/page.tsx', 'symptom.id'],
    ['disease', 'app/medical/diseases/[id]/page.tsx', 'disease.id'],
  ])('links a %s detail page to its exact selected subject', (_kind, path, subject) => {
    const detail = source(path);
    expect(detail).toContain(`encounterSubjectHref(${subject})`);
    expect(detail).toContain('Buka Alur Klinis');
  });

  it('opens the exact encoded stable subject ID at HPI', () => {
    expect(encounterSubjectHref()).toBe('/medical/encounter');
    expect(encounterSubjectHref('lumbar-disc-herniation')).toBe(
      '/medical/encounter?subject=lumbar-disc-herniation&step=hpi',
    );
    expect(encounterSubjectHref('knee osteoarthritis')).toBe(
      '/medical/encounter?subject=knee%20osteoarthritis&step=hpi',
    );
  });
});
