import { forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

/* ------------------------------------------------------------------
   Design-system primitives.

   Restrained by default: 6–10px radii, thin borders, no shadows unless a
   surface genuinely floats, and accents limited to primary actions and
   semantic states. Sizes are deliberately dense so reference tables and
   study screens show enough information at once.
------------------------------------------------------------------ */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'quiet';
type ButtonSize = 'sm' | 'md' | 'lg';

const BUTTON_BASE =
  'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-medium transition-colors duration-100 disabled:pointer-events-none disabled:opacity-45';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-border bg-surface text-foreground hover:bg-surface-secondary',
  outline: 'border border-border-strong bg-transparent text-foreground hover:bg-surface-secondary',
  ghost: 'text-muted-foreground hover:bg-surface-secondary hover:text-foreground',
  quiet: 'text-foreground hover:text-primary',
  danger: 'border border-danger/40 text-danger hover:bg-danger-muted',
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)} {...props} />
  );
});

export function LinkButton({
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <a className={cn(BUTTON_BASE, BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)} {...props} />;
}

/* --------------------------------- Inputs --------------------------------- */

export const inputClass =
  'h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none focus-visible:outline-none';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(inputClass, 'h-auto min-h-24 resize-y py-2 leading-relaxed', className)}
        {...props}
      />
    );
  },
);

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block', className)} htmlFor={htmlFor}>
      <span className="meta-label mb-1 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-9 w-full appearance-none rounded-md border border-border bg-surface px-2.5 pr-7 text-sm text-foreground',
        "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 12 12%22><path d=%22M2 4.5 6 8l4-3.5%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%221.2%22/></svg>')] bg-[length:12px] bg-[right_0.5rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    />
  );
}

/* --------------------------------- Badges --------------------------------- */

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-secondary text-muted-foreground',
  primary: 'bg-primary-muted text-primary',
  success: 'bg-success-muted text-success',
  warning: 'bg-warning-muted text-warning',
  danger: 'bg-danger-muted text-danger',
  info: 'bg-info-muted text-info',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({
  children,
  tone = 'outline',
  className,
  title,
  lang,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  title?: string;
  /** Set to "ja" for badges whose content is Japanese text. */
  lang?: string;
}) {
  return (
    <span
      title={title}
      lang={lang}
      className={cn(
        'inline-flex items-center rounded-[5px] px-1.5 py-px text-[11px] font-medium leading-5 tracking-tight',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function VerificationBadge({ status }: { status: 'draft' | 'reviewed' | 'verified' }) {
  const tone: BadgeTone = status === 'verified' ? 'success' : status === 'reviewed' ? 'neutral' : 'warning';
  const label = status === 'draft' ? 'Draft — unverified' : status === 'reviewed' ? 'Reviewed' : 'Verified';
  const title =
    status === 'verified'
      ? 'Checked against a clinical source'
      : status === 'reviewed'
        ? 'Reviewed for language accuracy; clinical use is at your discretion'
        : 'Generated or unverified content — do not rely on it clinically';
  return (
    <Badge tone={tone} title={title}>
      {label}
    </Badge>
  );
}

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-secondary px-1 font-mono text-[10.5px] text-muted-foreground',
        className,
      )}
    >
      {children}
    </kbd>
  );
}

/* -------------------------------- Structure ------------------------------- */

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-border', className)} />;
}

export function SectionHeading({
  title,
  hint,
  action,
  className,
}: {
  title: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('section-rule', className)}>
      <div className="flex items-baseline gap-2">
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {hint ? <span className="text-xs text-muted">{hint}</span> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="border-b border-border pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <div className="meta-label mb-1">{eyebrow}</div> : null}
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">{meta}</div> : null}
    </header>
  );
}

export function Progress({ value, tone = 'primary', className }: { value: number; tone?: 'primary' | 'success' | 'warning' | 'danger'; className?: string }) {
  const clamped = Math.max(0, Math.min(1, value));
  const color =
    tone === 'success' ? 'bg-success' : tone === 'warning' ? 'bg-warning' : tone === 'danger' ? 'bg-danger' : 'bg-primary';
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-secondary', className)} role="progressbar" aria-valuenow={Math.round(clamped * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-[width] duration-300', color)} style={{ width: `${clamped * 100}%` }} />
    </div>
  );
}

export function Meter({ value, max, tone = 'primary', className }: { value: number; max: number; tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info'; className?: string }) {
  const ratio = max <= 0 ? 0 : value / max;
  const color =
    tone === 'success'
      ? 'bg-success'
      : tone === 'warning'
        ? 'bg-warning'
        : tone === 'danger'
          ? 'bg-danger'
          : tone === 'info'
            ? 'bg-info'
            : 'bg-primary';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-secondary">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${Math.max(2, Math.min(1, ratio) * 100)}%` }} />
      </div>
      <span className="w-9 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{value}</span>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  compact,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={cn('flex flex-col items-start gap-2 rounded-lg border border-dashed border-border text-left', compact ? 'p-3' : 'p-5')}>
      <div className="flex items-center gap-2">
        {icon ? <span className="text-muted">{icon}</span> : null}
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>
      {description ? <p className="max-w-prose text-[13px] leading-relaxed text-muted-foreground">{description}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-secondary', className)} />;
}

export function StatRow({ items }: { items: { label: string; value: ReactNode; hint?: string }[] }) {
  return (
    <dl className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="meta-label">{item.label}</dt>
          <dd className="mt-0.5 text-lg font-medium tabular-nums tracking-tight text-foreground">
            {item.value}
            {item.hint ? <span className="ml-1.5 text-xs font-normal text-muted">{item.hint}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Definition list used across detail pages instead of stacked cards. */
export function FactGrid({ items, columns = 2 }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={cn('grid gap-x-6 gap-y-3', columns === 1 ? 'grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0 border-b border-border/70 pb-2 last:border-b-0">
          <dt className="meta-label">{item.label}</dt>
          <dd className="mt-0.5 text-sm leading-relaxed text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ListRows({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('divide-y divide-border', className)}>{children}</ul>;
}

export function ListRow({
  children,
  className,
  as = 'li',
  selected,
  ...props
}: React.HTMLAttributes<HTMLElement> & { selected?: boolean; as?: 'li' | 'div' }) {
  const Component = as as 'li';
  return (
    <Component
      className={cn(
        'flex items-center gap-3 px-1.5 py-2 text-sm transition-colors',
        'hover:bg-surface-secondary',
        selected && 'bg-primary-muted',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export function DataTableShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('overflow-x-auto rounded-lg border border-border bg-surface', className)}>{children}</div>;
}

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn('data-table', className)}>{children}</table>;
}

export function Callout({
  tone = 'info',
  title,
  children,
}: {
  tone?: 'info' | 'warning' | 'danger' | 'success';
  title?: string;
  children: ReactNode;
}) {
  const border =
    tone === 'warning'
      ? 'border-l-warning'
      : tone === 'danger'
        ? 'border-l-danger'
        : tone === 'success'
          ? 'border-l-success'
          : 'border-l-info';
  return (
    <div className={cn('border-l-2 bg-surface-secondary/60 px-3 py-2 text-[13px] leading-relaxed text-muted-foreground', border)}>
      {title ? <div className="mb-0.5 font-medium text-foreground">{title}</div> : null}
      {children}
    </div>
  );
}

/** Educational-use disclaimer, present wherever clinical content is shown. */
export function SafetyNote({ className }: { className?: string }) {
  return (
    <p className={cn('text-[11.5px] leading-relaxed text-muted', className)}>
      Educational language reference. Not a diagnostic tool, not a substitute for hospital protocol, and not a substitute for
      professional interpretation where one is required.
    </p>
  );
}
