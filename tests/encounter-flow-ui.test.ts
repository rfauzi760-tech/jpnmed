import * as React from 'react';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findEncounterSubjects } from '@/lib/content/encounter-flow';
import { EncounterFlow, encounterHref, readEncounterLocation, adjacentEncounterStep, ENCOUNTER_UI_STEPS, filterEncounterItems } from '@/components/medical/encounter-flow';
import { buildEncounterFlow, getCommonEncounterDiseases } from '@/lib/content/encounter-flow';

// The existing Vitest setup uses classic JSX; Next uses automatic JSX.
vi.stubGlobal('React', React);

const state = vi.hoisted(() => ({ query: '', english: false, romaji: 'always', indonesian: true, furigana: 'always' }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(state.query), useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/store/provider', () => ({ useStudy: () => ({ state: { settings: { medicalDisplay: state } } }) }));

const cough = findEncounterSubjects('batuk').find((subject) => subject.english === 'cough')!;
const render = () => renderToStaticMarkup(createElement(EncounterFlow));

describe('encounter pathway navigation and presentation', () => {
  beforeEach(() => { state.query = ''; state.english = false; state.romaji = 'always'; state.indonesian = true; });

  it('offers an actionable search empty state and handles unknown URL subjects', () => {
    expect(render()).toContain('Cari gejala atau penyakit');
    expect(render()).toContain('Jepang, kana, romaji, Indonesia, atau Inggris');
    state.query = 'subject=unknown&step=examination';
    expect(render()).toContain('Subjek tidak ditemukan');
    expect(readEncounterLocation(new URLSearchParams(state.query)).subject).toBeUndefined();
  });

  it('shows 100 common diseases by default and provides a direct HPI link for each', () => {
    const diseases = getCommonEncounterDiseases();
    expect(diseases).toHaveLength(100);
    expect(new Set(diseases.map((disease) => disease.id)).size).toBe(100);
    expect(diseases.every((disease) => disease.kind === 'disease')).toBe(true);
    expect(diseases.every((disease) => [disease.japanese, disease.kana, disease.romaji, disease.indonesian, disease.english].every((value) => value.trim()))).toBe(true);

    const html = render();
    expect(html).toContain('100 penyakit umum');
    for (const disease of diseases) {
      expect(html).toContain(`/medical/encounter?subject=${disease.id}&amp;step=hpi`);
    }
    expect(html).not.toContain('Konteks latihan');
  });

  it('removes the context toggle and drops legacy context from encounter URLs', () => {
    const href = encounterHref(new URLSearchParams('q=batuk&context=inpatient'), { subject: cough.id, step: 'disposition', branch: 'admission' });
    const params = new URLSearchParams(href.split('?')[1]);
    expect(params.get('q')).toBe('batuk');
    expect(params.has('context')).toBe(false);
    expect(readEncounterLocation(params)).toMatchObject({ subject: cough, step: 'disposition', branch: 'admission' });
    expect(readEncounterLocation(params)).not.toHaveProperty('context');
    const next = encounterHref(params, { step: 'follow-up' });
    expect(readEncounterLocation(new URLSearchParams(next.split('?')[1]))).toMatchObject({ subject: cough, step: 'follow-up', branch: 'admission' });
    // Re-reading earlier/later URL states uses no stale local selection.
    expect(readEncounterLocation(params).step).toBe('disposition');
  });

  it('normalizes malformed steps and branches and ignores legacy context parameters', () => {
    const location = readEncounterLocation(new URLSearchParams(`subject=${cough.id}&step=bad&branch=bad&context=emergency`));
    expect(location).toMatchObject({ step: 'hpi', branch: undefined });
    expect(location).not.toHaveProperty('context');
    expect(adjacentEncounterStep('consent', 1)).toBe('disposition');
    expect(adjacentEncounterStep('disposition', 1)).toBe('follow-up');
    expect(adjacentEncounterStep('follow-up', -1)).toBe('disposition');
    expect(adjacentEncounterStep('hpi', -1)).toBeUndefined();
    expect(adjacentEncounterStep('closing', 1)).toBeUndefined();
  });

  it('resets disposition on a new subject and does not open branch language from step alone', () => {
    const url = encounterHref(new URLSearchParams(`subject=${cough.id}&branch=admission`), { subject: findEncounterSubjects('')[0].id, step: 'hpi' });
    expect(new URLSearchParams(url.split('?')[1]).get('branch')).toBeNull();
    state.query = `subject=${cough.id}&step=disposition`;
    const html = render();
    expect(html).toContain('Pilih jalur disposisi');
    expect(html).not.toContain('入院が必要です。');
    state.query += '&branch=admission';
    expect(render()).toContain('Kalimat umum');
  });

  it('renders focused cough questions and patient answers with real language preferences', () => {
    state.query = `subject=${cough.id}&step=hpi`;
    const html = render();
    expect(html).toContain('痰');
    expect(html).toContain('Jawaban pasien');
    expect(html).toContain('aria-current="step"');
    expect(html).toContain('Sekarang');
    const line = cough.romaji;
    expect(html).toContain(line);
    state.romaji = 'off';
    expect(render()).not.toContain(`>${line}</p>`);
    state.english = true;
    expect(render()).toContain('cough');
  });

  it('shows missing coverage beside general content, links the subject, and has no redundant context controls', () => {
    state.query = `subject=${cough.id}&step=results`;
    const html = render();
    expect(html).toContain('Materi spesifik belum tersedia');
    expect(html).toContain('Kalimat umum');
    expect(html).toContain(`/medical/symptoms/${cough.id}`);
    expect(html).toContain('href="/medical/phrases"');
    expect(html).not.toContain('Konteks latihan');
    expect(html).toContain('hasil');
  });

  it('shows exactly 11 stages and three explicit disposition options with no default', () => {
    expect(ENCOUNTER_UI_STEPS).toHaveLength(11);
    expect(ENCOUNTER_UI_STEPS.map((entry) => entry.id)).not.toEqual(expect.arrayContaining(['referral', 'admission', 'discharge']));
    state.query = `subject=${cough.id}&step=disposition`;
    const html = render();
    expect(html.match(/data-disposition-choice=/g)).toHaveLength(3);
    expect(html).not.toContain('aria-pressed="true"');
    for (const branch of ['referral', 'admission', 'discharge']) {
      state.query = `subject=${cough.id}&step=disposition&branch=${branch}`;
      const branchHtml = render();
      expect(branchHtml.match(/aria-pressed="true"/g)).toHaveLength(1);
      expect(branchHtml).toContain('Kalimat umum');
    }
  });

  it('opens searchable general language when specific content is missing and collapses it otherwise', () => {
    state.query = `subject=${cough.id}&step=results`;
    expect(render()).toContain('data-general-phrases="true" open=""');
    expect(render()).toContain('Cari kalimat umum');
    state.query = `subject=${cough.id}&step=hpi`;
    expect(render()).not.toContain('data-general-phrases="true" open=""');
    const items = buildEncounterFlow(cough).find((step) => step.id === 'results')!.general;
    for (const field of ['japanese', 'kana', 'romaji', 'indonesian', 'english'] as const) {
      expect(filterEncounterItems(items, items[0].line[field])).toContain(items[0]);
    }
    expect(filterEncounterItems(items, 'doesnotexist')).toEqual([]);
  });
});
