'use client';

import { useRef, useState } from 'react';
import { Check, Download, RotateCcw, ShieldCheck, TriangleAlert, Upload } from 'lucide-react';
import { useStudy } from '@/lib/store/provider';
import { exportProfile } from '@/lib/store/storage';
import { DEFAULT_SETTINGS, type AccentPreference } from '@/lib/store/types';
import { cn } from '@/lib/utils/cn';
import { formatDuration, formatRelative } from '@/lib/utils/format';
import {
  Badge,
  Button,
  Callout,
  Divider,
  Field,
  Input,
  PageHeader,
  SafetyNote,
  SectionHeading,
  Select,
  VerificationBadge,
} from '@/components/ui/primitives';
import { Dialog, SegmentedControl, Switch } from '@/components/ui/interactive';

/* ------------------------------------------------------------------
   Settings and data.

   The profile is a single JSON document in this browser. Export is a
   first-class action, not a hidden menu item, because the study history
   is the most valuable thing in the app.
------------------------------------------------------------------ */

const ACCENTS: { id: AccentPreference; label: string; ja: string; description: string }[] = [
  { id: 'teal', label: 'Teal', ja: '青碧', description: 'Cool, neutral default. Quiet under long reading.' },
  { id: 'ai', label: 'Ai', ja: '藍', description: 'Indigo, closer to printed Japanese reference books.' },
  { id: 'shu', label: 'Shu', ja: '朱', description: 'Vermilion, the colour of a correction stamp.' },
  { id: 'sumi', label: 'Sumi', ja: '墨', description: 'Near-monochrome: accent only on active controls.' },
];

type HealthReport = {
  ok: boolean;
  counts: { errors: number; warnings: number };
  issues: { level: string; message: string; where?: string }[];
};

export function SettingsPanel({ contentStats }: { contentStats: { label: string; value: number }[] }) {
  const { state, actions, ready, storageError } = useStudy();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importText, setImportText] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [checking, setChecking] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { settings } = state;
  const update = (patch: Partial<typeof settings>) => {
    actions.updateSettings(patch);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  };

  const download = () => {
    const blob = new Blob([exportProfile(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jmed-profile-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const runImport = (json: string) => {
    const result = actions.importProfile(json);
    setImportMessage(result.ok ? 'Profile imported. Your previous progress was replaced.' : result.error ?? 'Import failed.');
  };

  const runHealthCheck = async () => {
    setChecking(true);
    try {
      const response = await fetch('/api/health');
      const payload = (await response.json()) as HealthReport;
      setHealth(payload);
    } catch {
      setHealth(null);
    } finally {
      setChecking(false);
    }
  };

  const reviewCount = Object.keys(state.reviews).length;
  const profileSize = ready ? `${(JSON.stringify(state).length / 1024).toFixed(1)} kB` : '—';

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Settings · 設定"
        title="Settings and data"
        description="Appearance, reading typography, study scheduling, and the export of everything you have done."
        meta={
          <>
            <span>{reviewCount} items tracked</span>
            <span>{state.notes.length} notes</span>
            <span>{state.attempts.length} reading attempts</span>
            <span>{state.caseAttempts.length} cases</span>
          </>
        }
        actions={savedFlash ? <Badge tone="success">Saved</Badge> : null}
      />

      {storageError ? (
        <Callout tone="warning" title="Local storage problem">
          {storageError}
        </Callout>
      ) : null}

      <div className="grid gap-7 lg:grid-cols-2">
        <div className="space-y-7">
          {/* Appearance */}
          <section>
            <SectionHeading title="Appearance" />
            <div className="space-y-4 pt-3">
              <div>
                <div className="meta-label mb-1.5">Theme</div>
                <SegmentedControl
                  ariaLabel="Theme"
                  value={settings.theme}
                  onChange={(value) => update({ theme: value })}
                  options={[
                    { value: 'light', label: 'Light', title: 'Warm paper' },
                    { value: 'dark', label: 'Dark', title: 'Charcoal, not black' },
                    { value: 'system', label: 'System', title: 'Follow the operating system' },
                  ]}
                />
                <p className="mt-1.5 text-[11.5px] text-muted">
                  Both themes are designed separately: the dark surface is a deep neutral charcoal so long passages stay readable.
                </p>
              </div>

              <div>
                <div className="meta-label mb-1.5">Accent</div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {ACCENTS.map((accent) => (
                    <li key={accent.id}>
                      <button
                        type="button"
                        onClick={() => update({ accent: accent.id })}
                        aria-pressed={settings.accent === accent.id}
                        className={cn(
                          'flex w-full items-start gap-2.5 rounded-md border px-2.5 py-2 text-left transition-colors',
                          settings.accent === accent.id ? 'border-primary bg-primary-muted/40' : 'border-border hover:bg-surface-secondary',
                        )}
                      >
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-surface">
                          {settings.accent === accent.id ? <Check className="h-2.5 w-2.5 text-primary" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] text-foreground">
                            {accent.label} <span lang="ja" className="text-muted">{accent.ja}</span>
                          </span>
                          <span className="block text-[11.5px] leading-relaxed text-muted">{accent.description}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <Switch
                label="Patient-friendly wording before the technical term"
                description="Shows the plain-language explanation first on term and disease pages."
                checked={settings.patientFriendlyFirst}
                onChange={(value) => update({ patientFriendlyFirst: value })}
              />
            </div>
          </section>

          {/* Reading */}
          <section>
            <SectionHeading title="Reading typography" hint="applies to every passage" />
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              <Field label="Furigana" htmlFor="set-furigana">
                <Select
                  id="set-furigana"
                  value={settings.furigana}
                  onChange={(event) => update({ furigana: event.target.value as typeof settings.furigana })}
                >
                  <option value="hidden">Hidden</option>
                  <option value="hover">On hover</option>
                  <option value="always">Always visible</option>
                </Select>
              </Field>
              <Field label="Typeface" htmlFor="set-font">
                <Select
                  id="set-font"
                  value={settings.readingFont}
                  onChange={(event) => update({ readingFont: event.target.value as typeof settings.readingFont })}
                >
                  <option value="sans">Gothic (Noto Sans JP)</option>
                  <option value="serif">Mincho (Noto Serif JP)</option>
                </Select>
              </Field>
              <Field label={`Size · ${settings.readingSize}px`} htmlFor="set-size">
                <input
                  id="set-size"
                  type="range"
                  min={15}
                  max={26}
                  step={1}
                  value={settings.readingSize}
                  onChange={(event) => update({ readingSize: Number(event.target.value) })}
                  className="h-1.5 w-full accent-current"
                />
              </Field>
              <Field label={`Line height · ${settings.readingLeading}`} htmlFor="set-leading">
                <input
                  id="set-leading"
                  type="range"
                  min={1.5}
                  max={2.6}
                  step={0.05}
                  value={settings.readingLeading}
                  onChange={(event) => update({ readingLeading: Number(event.target.value) })}
                  className="h-1.5 w-full accent-current"
                />
              </Field>
              <Field label={`Line width · ${settings.readingWidthRem}rem`} htmlFor="set-width">
                <input
                  id="set-width"
                  type="range"
                  min={24}
                  max={46}
                  step={1}
                  value={settings.readingWidthRem}
                  onChange={(event) => update({ readingWidthRem: Number(event.target.value) })}
                  className="h-1.5 w-full accent-current"
                />
              </Field>
              <div className="flex items-end">
                <Switch
                  label="Show romaji"
                  description="Off by default: kana and kanji should be read directly at this level."
                  checked={settings.showRomaji}
                  onChange={(value) => update({ showRomaji: value })}
                />
              </div>
            </div>
            <p lang="ja" className="passage mt-3 text-foreground">
              患者の希望に応じて、治療法を選ぶこともある。
            </p>
            <p className="mt-1 text-[11.5px] text-muted">Live example using the current settings.</p>
          </section>
        </div>

        <div className="space-y-7">
          <section>
            <SectionHeading title="Medical display" hint="Indonesian-first clinical reference" />
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              <Field label="Medical furigana" htmlFor="set-med-furigana">
                <Select id="set-med-furigana" value={settings.medicalDisplay.furigana} onChange={(event) => update({ medicalDisplay: { ...settings.medicalDisplay, furigana: event.target.value as typeof settings.medicalDisplay.furigana } })}>
                  <option value="always">Always</option>
                  <option value="difficult">Difficult kanji</option>
                  <option value="off">Off</option>
                </Select>
              </Field>
              <Field label="Medical romaji" htmlFor="set-med-romaji">
                <Select id="set-med-romaji" value={settings.medicalDisplay.romaji} onChange={(event) => update({ medicalDisplay: { ...settings.medicalDisplay, romaji: event.target.value as typeof settings.medicalDisplay.romaji } })}>
                  <option value="always">Always</option>
                  <option value="hover">On hover</option>
                  <option value="off">Off</option>
                </Select>
              </Field>
              <Switch label="English translation" description="Keep English secondary to Bahasa Indonesia." checked={settings.medicalDisplay.english} onChange={(value) => update({ medicalDisplay: { ...settings.medicalDisplay, english: value } })} />
              <Switch label="Indonesian translation" checked={settings.medicalDisplay.indonesian} onChange={(value) => update({ medicalDisplay: { ...settings.medicalDisplay, indonesian: value } })} />
            </div>
          </section>

          {/* Study */}
          <section>
            <SectionHeading title="Study scheduling" />
            <div className="grid gap-4 pt-3 sm:grid-cols-2">
              <Field label="New cards per day" hint="In addition to due reviews" htmlFor="set-new">
                <Input
                  id="set-new"
                  type="number"
                  min={0}
                  max={100}
                  value={settings.newPerDay}
                  onChange={(event) => update({ newPerDay: Number(event.target.value) })}
                />
              </Field>
              <Field label="Session size" hint="Cards before the summary screen" htmlFor="set-session">
                <Input
                  id="set-session"
                  type="number"
                  min={5}
                  max={300}
                  value={settings.sessionLimit}
                  onChange={(event) => update({ sessionLimit: Number(event.target.value) })}
                />
              </Field>
              <Field label="Daily review goal" hint="Used by the dashboard ring" htmlFor="set-goal">
                <Input
                  id="set-goal"
                  type="number"
                  min={5}
                  max={500}
                  value={settings.dailyReviewGoal}
                  onChange={(event) => update({ dailyReviewGoal: Number(event.target.value) })}
                />
              </Field>
              <Field label="Daily minutes goal" htmlFor="set-minutes">
                <Input
                  id="set-minutes"
                  type="number"
                  min={5}
                  max={300}
                  value={settings.dailyMinutesGoal}
                  onChange={(event) => update({ dailyMinutesGoal: Number(event.target.value) })}
                />
              </Field>
            </div>
            <div className="mt-3 space-y-1">
              <Switch
                label="Reading timer"
                description="Counts elapsed time on a passage and compares it with the estimate."
                checked={settings.timerEnabled}
                onChange={(value) => update({ timerEnabled: value })}
              />
              <Switch
                label="Compact sidebar"
                description="Keep the navigation rail narrow when the window is small."
                checked={settings.compactSidebar}
                onChange={(value) => update({ compactSidebar: value })}
              />
            </div>
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => actions.updateSettings(DEFAULT_SETTINGS)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore defaults
              </Button>
            </div>
          </section>

          {/* Data */}
          <section>
            <SectionHeading title="Your data" hint="stored in this browser only" />
            <dl className="space-y-1.5 pt-3 text-[12.5px]">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Profile size</dt>
                <dd className="font-mono tabular-nums text-foreground">{profileSize}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Study time recorded</dt>
                <dd className="font-mono tabular-nums text-foreground">
                  {formatDuration(Object.values(state.dayStats).reduce((sum, day) => sum + day.readingSeconds, 0))} reading ·{' '}
                  {Object.values(state.dayStats).reduce((sum, day) => sum + day.reviews, 0)} reviews
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Started</dt>
                <dd className="text-foreground">{state.startedAt}</dd>
              </div>
              {state.notes[0] ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Last note</dt>
                  <dd className="text-foreground">{formatRelative(state.notes[0].updatedAt)}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={download} disabled={!ready}>
                <Download className="h-3.5 w-3.5" />
                Export JSON
              </Button>
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} disabled={!ready}>
                <Upload className="h-3.5 w-3.5" />
                Import from file
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  runImport(await file.text());
                  event.target.value = '';
                }}
              />
              <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)} disabled={!ready}>
                Reset everything
              </Button>
            </div>

            <div className="mt-3">
              <Field label="…or paste an exported profile" htmlFor="set-import" hint="Importing replaces the current profile.">
                <textarea
                  id="set-import"
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={3}
                  className="w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 font-mono text-[11.5px] text-foreground focus:border-border-strong focus:outline-none"
                  placeholder='{"version":3,"reviews":{…}}'
                />
              </Field>
              <Button
                variant="ghost"
                size="sm"
                className="mt-1.5"
                disabled={!ready || importText.trim().length === 0}
                onClick={() => runImport(importText)}
              >
                Import pasted profile
              </Button>
              {importMessage ? <p className="mt-1.5 text-[11.5px] text-muted-foreground">{importMessage}</p> : null}
            </div>
          </section>
        </div>
      </div>

      <Divider />

      {/* Content integrity and safety */}
      <section>
        <SectionHeading title="Content verification" hint="what the badges mean" />
        <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <VerificationBadge status="verified" />
              <span className="text-muted-foreground">Checked against a clinical source.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <VerificationBadge status="reviewed" />
              <span className="text-muted-foreground">Reviewed for language accuracy; clinical use is at your discretion.</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
              <VerificationBadge status="draft" />
              <span className="text-muted-foreground">Generated or unverified — do not rely on it clinically.</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-muted">
              Generated content is never silently promoted to verified. Verification status is part of the data, and it is shown
              wherever the content is used.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="secondary" size="sm" onClick={runHealthCheck} disabled={checking}>
                <ShieldCheck className="h-3.5 w-3.5" />
                {checking ? 'Checking…' : 'Run content integrity check'}
              </Button>
              {health ? (
                health.counts.errors === 0 ? (
                  <Badge tone="success">
                    {health.counts.warnings} warnings · no errors
                  </Badge>
                ) : (
                  <Badge tone="danger">{health.counts.errors} errors</Badge>
                )
              ) : null}
            </div>
            {health && health.issues.length > 0 ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto border-t border-border pt-2 text-[11.5px] text-muted-foreground scroll-thin">
                {health.issues.slice(0, 20).map((issue) => (
                  <li key={`${issue.where ?? ''}-${issue.message}`} className="flex items-start gap-2">
                    {issue.level === 'error' ? (
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0 text-danger" />
                    ) : (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <div className="meta-label mb-1.5">Dataset</div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12.5px]">
              {contentStats.map((stat) => (
                <li key={stat.label} className="flex items-baseline justify-between gap-3 border-b border-border/70 py-1">
                  <span className="text-muted-foreground">{stat.label}</span>
                  <span className="font-mono tabular-nums text-foreground">{stat.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4">
          <Callout tone="warning" title="Scope of this application">
            <SafetyNote />
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11.5px]">
              <li>No patient data is entered, stored or transmitted: the profile contains study history only.</li>
              <li>Nothing here is a diagnostic aid or a substitute for an interpreter where one is required.</li>
              <li>Every clinical phrase is a language example, not a protocol. Follow your department&apos;s policy.</li>
            </ul>
          </Callout>
        </div>
      </section>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all progress?"
        description="Review history, notes, mistakes, reading attempts and cases in this browser are permanently deleted. Export first if you may want them."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Keep my progress
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                actions.resetProfile();
                setConfirmReset(false);
              }}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-relaxed text-muted-foreground">
          There is no undo. The content library itself is untouched — only your personal history is removed.
        </p>
      </Dialog>
    </div>
  );
}
