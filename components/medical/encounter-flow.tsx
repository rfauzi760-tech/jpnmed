'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { DISEASES, INVESTIGATIONS, MEDICAL_TERMS, PHRASES } from '@/lib/content';
import { buildEncounterFlow, ENCOUNTER_STEPS, findEncounterSubjects, getCommonEncounterDiseases } from '@/lib/content/encounter-flow';
import type { EncounterFlowItem, EncounterStepId, EncounterSubject } from '@/lib/content/encounter-flow';
import { MedicalLine } from './medical-line';
import { VerificationBadge } from '@/components/ui/primitives';

type Branch = 'referral' | 'admission' | 'discharge';
const branches: readonly Branch[] = ['referral', 'admission', 'discharge'];
const touchLink = 'flex min-h-12 items-center justify-center rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-secondary focus-visible:outline focus-visible:outline-primary';
const subjects = findEncounterSubjects('');
const isBranch = (value: string | null | undefined): value is Branch => branches.some((branch) => branch === value);
type UIStepId = Exclude<EncounterStepId, Branch> | 'disposition';
export const ENCOUNTER_UI_STEPS: { id: UIStepId; labelIndonesian: string }[] = ENCOUNTER_STEPS.flatMap((entry) => entry.id === 'referral'
  ? [{ id: 'disposition' as const, labelIndonesian: 'Disposisi' }]
  : isBranch(entry.id) ? [] : [entry as { id: UIStepId; labelIndonesian: string }]);

/** The URL is the only source of truth for subject, step, and disposition. */
export function readEncounterLocation(params: Pick<URLSearchParams, 'get'>) {
  const step = ENCOUNTER_UI_STEPS.find((entry) => entry.id === params.get('step'))?.id ?? 'hpi';
  const branch = params.get('branch');
  return {
    subject: subjects.find((entry) => entry.id === params.get('subject')),
    step,
    branch: isBranch(branch) ? branch : undefined,
  };
}

export function encounterHref(params: { toString(): string }, patch: { subject?: string; step?: UIStepId; branch?: Branch | null }) {
  const next = new URLSearchParams(params.toString());
  next.delete('context');
  if (patch.subject !== undefined && patch.subject !== next.get('subject')) next.delete('branch');
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else if (value !== undefined) next.set(key, value);
  }
  return `/medical/encounter?${next.toString()}`;
}

export function adjacentEncounterStep(step: UIStepId, direction: -1 | 1) {
  const sequence = ENCOUNTER_UI_STEPS.map((entry) => entry.id);
  const index = sequence.indexOf(step);
  return sequence[index + direction];
}

export function filterEncounterItems(items: EncounterFlowItem[], query: string) {
  const normalize = (text: string) => text.normalize('NFKC').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s/g, '');
  const needle = normalize(query);
  return items.filter((item) => [item.line.japanese, item.line.kana, item.line.romaji, item.line.indonesian, item.line.english].some((text) => normalize(text).includes(needle)));
}

const speakers = { doctor: 'Dokter', nurse: 'Perawat', patient: 'Pasien', family: 'Keluarga', staff: 'Staf' };
const commonDiseases = getCommonEncounterDiseases();

function EncounterItem({ item }: { item: EncounterFlowItem }) {
  const phrase = item.source.kind === 'phrase' ? PHRASES.find((entry) => entry.id === item.source.id) : undefined;
  const testLabel = item.source.field === 'patientExplanation' ? 'Tujuan pemeriksaan' : item.source.field === 'preparationInstruction' ? 'Persiapan pemeriksaan' : item.source.field === 'resultDiscussion' ? 'Penjelasan hasil' : undefined;
  return <article className="min-w-0 space-y-2 border-b border-border pb-4 last:border-0">
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>{item.speaker ? speakers[item.speaker] : 'Bahasa klinis'} · {item.labelIndonesian}</span>
      <VerificationBadge status={item.verificationStatus} />
    </div>
    <MedicalLine label={item.focusIndonesian ?? testLabel ?? 'Kalimat siap digunakan'} line={item.line} />
    {item.clinicalReasonIndonesian ? <p className="text-sm text-muted">Fokus klinis: {item.clinicalReasonIndonesian}</p> : null}
    {phrase ? <p className="break-words text-xs text-muted">Konteks frasa: {phrase.clinicalContext} · {phrase.register}</p> : null}
    {item.patientAnswers?.map((answer, index) => <MedicalLine key={`${answer.japanese}-${index}`} label="Jawaban pasien — contoh ungkapan natural" line={answer} />)}
  </article>;
}

function SubjectSearch({ subject }: { subject?: EncounterSubject }) {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const results = useMemo(() => query.trim() ? findEncounterSubjects(query) : [], [query]);
  const contents = <div className="space-y-3">
    <form action="/medical/encounter" method="get" className="space-y-2">
      {['subject', 'step', 'branch'].map((key) => params.get(key) ? <input key={key} type="hidden" name={key} value={params.get(key)!} /> : null)}
      <label htmlFor="encounter-search" className="block text-sm font-medium">Cari gejala atau penyakit</label>
      <div className="flex gap-2"><input id="encounter-search" name="q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Contoh: batuk, sesak, diabetes" className="min-h-12 min-w-0 flex-1 rounded-md border border-border bg-surface px-3 text-base" /><button type="submit" className={touchLink}>Cari</button></div>
      <p className="text-xs text-muted">Jepang, kana, romaji, Indonesia, atau Inggris.</p>
    </form>
    {query.trim() ? <section aria-label="Hasil pencarian" className="space-y-2">
      <p role="status" className="text-sm text-muted">{results.length} hasil</p>
      {results.length ? <ul className="max-h-96 space-y-2 overflow-y-auto">{results.map((result) => <li key={result.id}>
        <Link href={encounterHref(params, { subject: result.id, step: 'hpi' })} className="block rounded-md focus-visible:outline focus-visible:outline-primary">
          <MedicalLine label={`${result.kind === 'symptom' ? 'Gejala' : 'Penyakit'} · pilih untuk membuka alur`} line={result} />
        </Link>
      </li>)}</ul> : <p className="text-sm">Tidak ditemukan. Coba istilah lain atau nama dalam bahasa berbeda.</p>}
    </section> : <section aria-label={`Penyakit umum dan penting (${commonDiseases.length})`} className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-medium">Penyakit umum &amp; penting ({commonDiseases.length})</h2>
        <span className="text-xs text-muted">Daftar praktis lintas spesialisasi</span>
      </div>
      <p className="text-xs text-muted">Pilih penyakit untuk membuka HPI terarah. Gejala dan penyakit lain tetap bisa dicari di atas.</p>
      <ul className="max-h-[65vh] divide-y divide-border overflow-y-auto rounded-md border border-border px-3">
        {commonDiseases.map((disease) => <li key={disease.id}>
          <Link href={encounterHref(params, { subject: disease.id, step: 'hpi' })} className="block py-2 focus-visible:outline focus-visible:outline-primary">
            <MedicalLine label="Penyakit umum · pilih untuk membuka alur" line={disease} />
          </Link>
        </li>)}
      </ul>
    </section>}
  </div>;
  return subject ? <details className="rounded-md border border-border p-3"><summary className="min-h-12 cursor-pointer text-sm">Ganti gejala atau penyakit</summary>{contents}</details> : contents;
}

function GeneralPhrases({ items, expand }: { items: EncounterFlowItem[]; expand: boolean }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => filterEncounterItems(items, query), [items, query]);
  return <details data-general-phrases="true" open={expand || undefined} className="rounded-md border border-border p-3">
    <summary className="min-h-12 cursor-pointer font-medium">Kalimat umum · {items.length} frasa</summary>
    <div className="space-y-4 pt-2">
      <p className="text-xs text-muted">Bahasa umum — bukan materi spesifik kondisi. Sesuaikan dengan kondisi dan rencana pasien.</p>
      <label className="block space-y-1 text-sm"><span>Cari kalimat umum</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-12 w-full rounded-md border border-border bg-surface px-3 text-base" placeholder="Jepang, kana, romaji, Indonesia, Inggris" /></label>
      <p role="status" className="text-xs text-muted">{filtered.length} frasa ditampilkan</p>
      {filtered.length ? filtered.map((item) => <EncounterItem key={`${item.source.id}-${item.line.japanese}`} item={item} />) : <p className="text-sm text-muted">{items.length ? 'Tidak ada kalimat yang cocok. Coba kata lain.' : 'Kalimat umum belum tersedia untuk tahap ini.'}</p>}
    </div>
  </details>;
}

function RelatedContent({ items, subjectId, kind }: { items: EncounterFlowItem[]; subjectId: string; kind: 'symptom' | 'disease' }) {
  const links = new Map<string, string>();
  links.set(`/medical/${kind === 'disease' ? 'diseases' : 'symptoms'}/${subjectId}`, 'Buka materi lengkap kondisi ini');
  for (const item of items) {
    if (item.source.kind === 'investigation') {
      const test = INVESTIGATIONS.find((entry) => entry.id === item.source.id);
      if (test) links.set(`/medical/investigations/${test.id}`, test.indonesian);
    }
    if (item.source.kind === 'symptom-history' && item.source.subjectId) links.set(`/medical/symptoms/${item.source.subjectId}`, item.labelIndonesian);
    const phrase = item.source.kind === 'phrase' ? PHRASES.find((entry) => entry.id === item.source.id) : undefined;
    for (const reference of phrase?.relatedDiseaseIds ?? []) {
      const disease = DISEASES.find((entry) => entry.id === reference || entry.japanese === reference);
      if (disease) links.set(`/medical/diseases/${disease.id}`, disease.indonesian);
    }
    for (const reference of phrase?.relatedTermIds ?? []) {
      const term = MEDICAL_TERMS.find((entry) => entry.id === reference || entry.japanese === reference);
      if (term) links.set(`/medical/terms/${encodeURIComponent(term.id)}`, term.indonesian);
    }
  }
  return <aside className="space-y-2"><h3 className="font-medium">Materi terkait</h3><div className="flex flex-wrap gap-2">
    {[...links].map(([href, label]) => <Link key={href} href={href} className={`${touchLink} text-primary`}>{label}</Link>)}
    <Link href="/medical/phrases" className={touchLink}>Phrasebook</Link>
  </div></aside>;
}

export function EncounterFlow() {
  const params = useSearchParams();
  const router = useRouter();
  const location = readEncounterLocation(params);
  const { subject, step: stepId, branch } = location;
  const flow = useMemo(() => subject ? buildEncounterFlow(subject) : [], [subject]);
  const step = flow.find((entry) => entry.id === (stepId === 'disposition' ? branch : stepId));
  const definition = ENCOUNTER_UI_STEPS.find((entry) => entry.id === stepId)!;
  const position = ENCOUNTER_UI_STEPS.findIndex((entry) => entry.id === stepId);
  const previous = adjacentEncounterStep(stepId, -1);
  const next = adjacentEncounterStep(stepId, 1);
  const chooseStep = (id: UIStepId) => encounterHref(params, { step: id });

  return <div className="min-w-0 space-y-5 pb-8 [overflow-wrap:anywhere]">
    <header className="space-y-2"><p className="meta-label">J-Unit · alur per kondisi</p><h1 className="text-2xl font-semibold">Alur konsultasi terstruktur</h1>
      <p className="text-sm text-muted">Pilih gejala atau penyakit, lalu ikuti bahasa konsultasi dari riwayat hingga kontrol dan pulang.</p>
    </header>
    <SubjectSearch key={subject?.id ?? 'search'} subject={subject} />
    {!subject ? (params.get('subject') ? <p role="status" className="rounded-md border border-border bg-surface p-3 text-sm">Subjek tidak ditemukan. Pilih dari penyakit umum dan penting atau cari nama lain.</p> : null) : <>
      <MedicalLine label={subject.kind === 'symptom' ? 'Gejala terpilih' : 'Penyakit terpilih'} line={subject} />
      <nav aria-label="Tahap konsultasi"><details className="rounded-md border border-border p-3">
        <summary className="min-h-12 cursor-pointer text-sm">Sekarang {position + 1} / {ENCOUNTER_UI_STEPS.length}: {definition.labelIndonesian} · lihat semua tahap</summary>
        <ol className="mt-2 grid gap-2 sm:grid-cols-2">{ENCOUNTER_UI_STEPS.map((entry, index) => <li key={entry.id}><Link href={chooseStep(entry.id)} aria-current={entry.id === stepId ? 'step' : undefined} className={`${touchLink} justify-start ${entry.id === stepId ? 'bg-primary-muted text-primary' : ''}`}>{index + 1}. {entry.labelIndonesian}</Link></li>)}</ol>
      </details></nav>
      <nav aria-label="Maju atau mundur" className="sticky top-14 z-10 grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-2">
        {previous ? <Link href={chooseStep(previous)} className={touchLink}>← Sebelumnya</Link> : <span className={`${touchLink} text-muted`}>Awal alur</span>}
        {next ? <Link href={chooseStep(next)} className={touchLink}>Berikutnya →</Link> : <span className={`${touchLink} text-muted`}>Akhir alur</span>}
      </nav>
      <section className="space-y-4" aria-labelledby="encounter-step-heading">
        <h2 id="encounter-step-heading" className="text-xl font-semibold">{definition.labelIndonesian}{stepId === 'disposition' && step ? ` · ${step.labelIndonesian}` : ''}</h2>
        {step ? <div role="status" className="rounded-md border border-border bg-surface-secondary p-3 text-sm">
          <p>{step.coverage.messageIndonesian}</p><p className="mt-1 text-xs text-muted">{step.coverage.specificCount} materi spesifik · {step.coverage.generalCount} bahasa umum{step.coverage.unsupportedCount ? ` · ${step.coverage.unsupportedCount} celah dukungan bahasa/relasi` : ''}</p>
        </div> : null}
        {stepId === 'disposition' ? <div className="space-y-2 rounded-md border border-border p-3">
          <h3 className="font-medium">Pilih jalur disposisi</h3><p className="text-sm text-muted">Pilih rencana yang sudah Anda tentukan secara klinis untuk membuka bahasa rujukan, rawat inap, atau pulang.</p>
          <div role="group" aria-label="Pilihan disposisi" className="grid gap-2 sm:grid-cols-3">{branches.map((id) => <button key={id} type="button" data-disposition-choice={id} aria-pressed={branch === id} onClick={() => router.push(encounterHref(params, { step: 'disposition', branch: id }))} className={`${touchLink} ${branch === id ? 'bg-primary-muted text-primary' : ''}`}>{id === 'referral' ? 'Rujuk' : id === 'admission' ? 'Rawat inap' : 'Pulang'}</button>)}</div>
        </div> : null}
        {step ? <>
          {step.specific.length ? <section className="space-y-4"><h3 className="font-medium">Materi spesifik kondisi</h3>{step.specific.map((item) => <EncounterItem key={`${item.source.kind}-${item.source.id}-${item.line.japanese}`} item={item} />)}</section> : null}
          <GeneralPhrases key={`${subject.id}-${step.id}`} items={step.general} expand={step.specific.length === 0} />
        </> : <p className="text-sm text-muted">Kalimat disposisi muncul setelah jalur di atas dipilih.</p>}
        <RelatedContent items={step?.specific ?? []} subjectId={subject.id} kind={subject.kind} />
      </section>
    </>}
  </div>;
}
