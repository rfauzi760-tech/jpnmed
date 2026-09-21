import type { ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Badge } from '@/components/ui/primitives';

/* ------------------------------------------------------------------
   Charts.

   No chart library and no decorative graphs. Every figure below maps to
   a stored study event, and each one is labelled with what it measures
   (prompt: "do not add graphs simply to make the page look analytical").
------------------------------------------------------------------ */

export type GridDay = {
  key: string;
  label: string;
  reviews: number;
  readingMinutes: number;
  isToday: boolean;
};

function intensityClass(value: number, max: number) {
  if (value <= 0) return 'bg-surface-secondary';
  const ratio = max <= 0 ? 0 : value / max;
  if (ratio >= 0.75) return 'bg-primary';
  if (ratio >= 0.45) return 'bg-primary/70';
  if (ratio >= 0.2) return 'bg-primary/45';
  return 'bg-primary/25';
}

export function ConsistencyGrid({ days, weeks = 12 }: { days: GridDay[]; weeks?: number }) {
  const cells = days.slice(-weeks * 7);
  const max = Math.max(1, ...cells.map((day) => day.reviews + day.readingMinutes));
  const totals = cells.reduce(
    (acc, day) => ({
      reviews: acc.reviews + day.reviews,
      minutes: acc.minutes + day.readingMinutes,
      activeDays: acc.activeDays + (day.reviews + day.readingMinutes > 0 ? 1 : 0),
    }),
    { reviews: 0, minutes: 0, activeDays: 0 },
  );

  return (
    <div>
      <div className="flex gap-[3px] overflow-x-auto pb-1 scroll-thin">
        {Array.from({ length: Math.ceil(cells.length / 7) }, (_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((day) => (
              <div
                key={day.key}
                title={`${day.label} · ${day.reviews} reviews · ${day.readingMinutes} min reading`}
                className={cn(
                  'h-[11px] w-[11px] rounded-[2px]',
                  intensityClass(day.reviews + day.readingMinutes, max),
                  day.isToday && 'outline outline-1 outline-offset-1 outline-primary',
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-muted">
        {totals.activeDays} active days in the last {cells.length} · {totals.reviews} reviews · {totals.minutes} min reading
      </p>
    </div>
  );
}

export function ForecastBars({ days, max, overdue }: { days: { key: string; count: number }[]; max: number; overdue: number }) {
  return (
    <div>
      <div className="flex h-16 items-end gap-[3px]">
        {days.map((day) => (
          <div key={day.key} className="group flex flex-1 flex-col justify-end" title={`${day.key}: ${day.count} due`}>
            <div
              className={cn('w-full rounded-t-[2px]', day.count === 0 ? 'bg-surface-secondary' : 'bg-primary/70')}
              style={{ height: `${Math.max(2, (day.count / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10.5px] text-muted">
        <span>today</span>
        <span>+{days.length - 1}d</span>
      </div>
      {overdue > 0 ? (
        <p className="mt-1.5 text-[11.5px] text-warning">
          {overdue} review{overdue === 1 ? '' : 's'} already overdue
        </p>
      ) : null}
    </div>
  );
}

export function MasteryBar({ counts, total }: { counts: Record<string, number>; total: number }) {
  const order: [string, string, string][] = [
    ['mastered', 'Mastered', 'bg-success'],
    ['strong', 'Strong', 'bg-primary'],
    ['familiar', 'Familiar', 'bg-primary/45'],
    ['learning', 'Learning', 'bg-warning/70'],
    ['new', 'Not started', 'bg-surface-secondary'],
  ];
  const safeTotal = Math.max(1, total);

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-surface-secondary">
        {order.map(([key, , color]) => {
          const value = counts[key] ?? 0;
          if (value === 0) return null;
          return <div key={key} className={cn('h-full', color)} style={{ width: `${(value / safeTotal) * 100}%` }} />;
        })}
      </div>
      <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[11.5px] text-muted sm:grid-cols-3">
        {order.map(([key, label, color]) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={cn('h-2 w-2 rounded-[2px]', color)} />
            <span className="text-muted-foreground">{label}</span>
            <span className="ml-auto font-mono tabular-nums">{counts[key] ?? 0}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({
  items,
  emptyLabel,
  tone = 'primary',
}: {
  items: { label: string; value: number; total: number; hint?: string }[];
  emptyLabel: string;
  tone?: 'primary' | 'warning' | 'danger';
}) {
  if (items.length === 0) return <p className="py-3 text-[12.5px] text-muted">{emptyLabel}</p>;
  const color = tone === 'danger' ? 'bg-danger' : tone === 'warning' ? 'bg-warning' : 'bg-primary';
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className="truncate text-foreground">{item.label}</span>
            <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-muted">
              {item.value}
              {item.total > 0 ? <span className="text-muted">/{item.total}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
            <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max(3, Math.min(1, item.total > 0 ? item.value / item.total : 0) * 100)}%` }} />
          </div>
          {item.hint ? <p className="mt-0.5 text-[11px] text-muted">{item.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
  if (points.length < 2) return null;
  const max = Math.max(1, ...points);
  const path = points
    .map((value, index) => `${(index / (points.length - 1)) * 100},${28 - (value / max) * 26}`)
    .join(' ');
  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn('h-7 w-full', className)} aria-hidden>
      <polyline points={path} fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" className="text-primary" />
    </svg>
  );
}

export function MetricLine({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="border-b border-border py-2 last:border-b-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-muted-foreground">{label}</span>
        <span
          className={cn(
            'font-mono text-[13px] tabular-nums',
            tone === 'success' ? 'text-success' : tone === 'warning' ? 'text-warning' : tone === 'danger' ? 'text-danger' : 'text-foreground',
          )}
        >
          {value}
        </span>
      </div>
      {hint ? <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export function StageProgress({ stages }: { stages: { id: string; label: string; covered: number; total: number }[] }) {
  return (
    <ul className="space-y-1.5">
      {stages.map((stage) => {
        const ratio = stage.total === 0 ? 0 : stage.covered / stage.total;
        return (
          <li key={stage.id} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-[12px] text-muted-foreground">{stage.label}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
              <span
                className={cn('block h-full rounded-full', ratio >= 0.6 ? 'bg-success' : ratio >= 0.3 ? 'bg-primary' : 'bg-warning/80')}
                style={{ width: `${Math.max(2, ratio * 100)}%` }}
              />
            </span>
            <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
              {stage.covered}/{stage.total}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Legend({ items }: { items: { label: string; tone?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map((item) => (
        <Badge key={item.label} tone={item.tone ?? 'outline'}>
          {item.label}
        </Badge>
      ))}
    </div>
  );
}
