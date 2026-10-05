'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Search, Stethoscope } from 'lucide-react';
import { phrasesForJUnitStage, JUNIT_STAGES, type JUnitStageId } from '@/lib/content/junit';
import { SYMPTOMS } from '@/lib/content';
import { useStudy } from '@/lib/store/provider';
import { AddToReviewButton } from '@/components/study/review-controls';
import { Badge, Button, PageHeader } from '@/components/ui/primitives';
import { cn } from '@/lib/utils/cn';

function Line({ phrase }: { phrase: ReturnType<typeof phrasesForJUnitStage>[number] }) {
  const { state } = useStudy();
  const display = state.settings.medicalDisplay;
  const showKana = display.furigana === 'always' || (display.furigana === 'difficult' && /[\u3400-\u9fff]/.test(phrase.japanese));
  const showRomaji = display.romaji === 'always';
  return (
    <article className="group rounded-lg border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted">{phrase.intent} · {phrase.speaker}</div>
          <p lang="ja" className="mt-2 text-[20px] leading-relaxed text-foreground">{phrase.japanese}</p>
          {showKana ? <p lang="ja" className="mt-1 text-[13px] text-muted">{phrase.kana}</p> : null}
          {showRomaji ? <p className="mt-1 text-[13px] text-info">{phrase.romaji}</p> : display.romaji === 'hover' ? <p className="mt-1 text-[13px] text-info opacity-0 transition-opacity group-hover:opacity-100">{phrase.romaji}</p> : null}
        </div>
        <AddToReviewButton contentType="clinical-phrase" contentId={phrase.id} />
      </div>
      {display.indonesian ? <p className="mt-3 border-t border-border pt-3 text-[14px] leading-relaxed text-foreground">{phrase.indonesian}</p> : null}
      {display.english ? <p className="mt-1 text-[12px] leading-relaxed text-muted">{phrase.english}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone="outline">{phrase.register}</Badge>
        {phrase.specialtyTags.slice(0, 3).map((tag) => <Badge key={tag} tone="neutral">{tag}</Badge>)}
        {phrase.verificationStatus === 'draft' ? <Badge tone="warning">unverified</Badge> : <Badge tone="success">{phrase.verificationStatus}</Badge>}
      </div>
    </article>
  );
}

export function JUnitMode() {
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedSymptomId, setSelectedSymptomId] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const { state } = useStudy();
  const display = state.settings.medicalDisplay;
  const stage = JUNIT_STAGES[index];
  const isHpi = stage[0] === 'hpi';
  const phrases = useMemo(() => phrasesForJUnitStage(stage[0]), [stage]);
  const selectedSymptom = SYMPTOMS.find((symptom) => symptom.id === selectedSymptomId);
  const symptomOptions = useMemo(() => SYMPTOMS.map((symptom) => ({
    symptom,
    count: phrases.filter((phrase) => phrase.intent.startsWith(`${symptom.japanese} ·`)).length,
  })).filter((option) => option.count > 0), [phrases]);
  const filteredSymptoms = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return symptomOptions.filter(({ symptom }) => !query || [
      symptom.japanese,
      symptom.kana,
      symptom.romaji,
      symptom.indonesian,
      symptom.english,
      ...symptom.patientExpressions,
    ].join(' ').toLocaleLowerCase().includes(query));
  }, [search, symptomOptions]);
  const phraseSource = useMemo(() => isHpi && selectedSymptom
    ? phrases.filter((phrase) => phrase.intent.startsWith(`${selectedSymptom.japanese} ·`))
    : phrases, [isHpi, phrases, selectedSymptom]);
  const visiblePhrases = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (isHpi && !selectedSymptom && !query) return [];
    if (!query) return phraseSource;
    return phraseSource.filter((phrase) => [
      phrase.intent,
      phrase.japanese,
      phrase.kana,
      phrase.romaji,
      phrase.indonesian,
      phrase.english,
      phrase.clinicalContext,
      phrase.nuance ?? '',
    ].join(' ').toLocaleLowerCase().includes(query));
  }, [isHpi, phraseSource, phrases, search, selectedSymptom]);
  const pagePhrases = visiblePhrases.slice(0, visibleCount);
  useEffect(() => {
    setSearch('');
    setSelectedSymptomId('');
    setVisibleCount(30);
  }, [stage]);
  const markDone = () => setDone((current) => new Set(current).add(stage[0]));

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="J-Unit · 実戦モード" title="Alur konsultasi, satu tahap per layar" description="Kalimat Jepang siap digunakan saat bertemu pasien. Pilih tahap untuk melihat pertanyaan dan ungkapan yang khusus untuk situasi tersebut." meta={<><span>{index + 1} / {JUNIT_STAGES.length} tahap</span><span>{done.size} selesai</span></>} actions={<BookOpen className="h-5 w-5 text-primary" />} />
      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {JUNIT_STAGES.map(([id, label], position) => <button key={id} type="button" onClick={() => setIndex(position)} className={cn('shrink-0 rounded-md border px-2.5 py-2 text-left text-[11px]', position === index ? 'border-primary bg-primary-muted text-primary' : 'border-border text-muted hover:text-foreground')}><span className="block">{position + 1}. {label}</span>{done.has(id) ? <span className="mt-0.5 flex items-center gap-1 text-[10px] text-success"><Check className="h-3 w-3" />done</span> : null}</button>)}
      </div>
      <section className="rounded-xl border border-border bg-surface-secondary/40 p-4 sm:p-5">
        <div className="flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary" /><div><div className="text-[12px] text-muted">Stage {index + 1}</div><h2 className="text-xl tracking-tight text-foreground">{stage[1]} <span lang="ja" className="text-muted">{stage[2]}</span></h2></div></div>
        {isHpi && selectedSymptom ? <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2">
          <div><span className="text-sm font-medium text-foreground">{selectedSymptom.indonesian}</span><span className="ml-2 text-xs text-muted">{selectedSymptom.japanese}</span></div>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedSymptomId(''); setSearch(''); setVisibleCount(30); }}>Semua gejala</Button>
        </div> : null}
        <label className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-muted focus-within:border-primary">
          <Search className="h-4 w-4 shrink-0" />
          <input aria-label="Cari frasa pada tahap ini" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(30); }} placeholder={isHpi ? 'Cari gejala, pertanyaan, romaji, atau arti…' : 'Cari frasa, romaji, atau arti…'} className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted" />
          <span className="shrink-0 text-xs">{isHpi && !selectedSymptom ? `${filteredSymptoms.length} gejala · ${visiblePhrases.length} frasa` : `${visiblePhrases.length}/${phraseSource.length} frasa`}</span>
        </label>
        {isHpi && !selectedSymptom ? <div className="mt-3 space-y-2" aria-label="Pilih gejala untuk riwayat terarah">
          <p className="text-sm text-muted">{search.trim() ? 'Gejala yang cocok. Pilih satu untuk membuka pertanyaan HPI dan contoh jawaban pasien.' : 'Pilih keluhan untuk membuka pertanyaan HPI dan contoh jawaban pasien yang sesuai.'}</p>
          {filteredSymptoms.map(({ symptom, count }) => <button key={symptom.id} type="button" onClick={() => { setSelectedSymptomId(symptom.id); setSearch(''); setVisibleCount(30); }} className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-left hover:border-primary">
            <span className="min-w-0"><span className="block truncate text-sm text-foreground">{symptom.indonesian} <span className="text-muted">· {symptom.english}</span></span><span lang="ja" className="mt-1 block truncate text-sm text-muted">{symptom.japanese}{display.furigana !== 'off' ? ` · ${symptom.kana}` : ''}</span>{display.romaji === 'always' ? <span className="mt-0.5 block truncate text-xs text-info">{symptom.romaji}</span> : display.romaji === 'hover' ? <span className="mt-0.5 block truncate text-xs text-info opacity-0 group-hover:opacity-100">{symptom.romaji}</span> : null}</span>
            <span className="shrink-0 text-xs text-muted">{count} frasa</span>
          </button>)}
          {search.trim() && filteredSymptoms.length === 0 ? <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">Tidak ada nama gejala yang cocok; hasil frasa terkait ditampilkan di bawah.</p> : null}
        </div> : null}
        {pagePhrases.length > 0 ? <div className="mt-3 space-y-3">{pagePhrases.map((phrase) => <Line key={phrase.id} phrase={phrase} />)}</div> : isHpi && !selectedSymptom && !search.trim() ? null : <p role="status" className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted">{phraseSource.length ? 'Tidak ada frasa yang cocok pada tahap ini.' : 'Belum ada frasa untuk tahap ini.'}</p>}
        {visiblePhrases.length > pagePhrases.length ? <Button variant="secondary" size="sm" className="mt-3 w-full" onClick={() => setVisibleCount((value) => value + 30)}>Tampilkan 30 frasa lagi ({visiblePhrases.length - pagePhrases.length} tersisa)</Button> : null}
      </section>
      <div className="flex items-center justify-between gap-2">
        <Button variant="secondary" size="sm" disabled={index === 0} onClick={() => setIndex((value) => Math.max(0, value - 1))}><ArrowLeft className="h-3.5 w-3.5" />Previous</Button>
        <Button variant="primary" size="sm" onClick={() => { markDone(); setIndex((value) => Math.min(JUNIT_STAGES.length - 1, value + 1)); }}>{index === JUNIT_STAGES.length - 1 ? 'Finish stage' : 'Mark ready & next'}<ArrowRight className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
