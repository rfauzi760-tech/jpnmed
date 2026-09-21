'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Button, Kbd } from './primitives';

/* ------------------------------------------------------------------
   Interactive primitives.

   Hand-built rather than pulled from a component library so the styling
   stays inside the design system and the client bundle stays small. Each
   one handles Escape, outside clicks, focus restoration and body scroll
   where relevant.
------------------------------------------------------------------ */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

function useDismissable(open: boolean, onClose: () => void, ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };
    const onPointer = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose, ref]);
}

/* --------------------------------- Tooltip -------------------------------- */

export function Tooltip({
  label,
  children,
  side = 'top',
  className,
}: {
  label: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] text-foreground shadow-panel group-hover/tt:block group-focus-within/tt:block',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}

/* -------------------------- Popover and dropdown --------------------------- */

export function Popover({
  trigger,
  children,
  align = 'start',
  className,
  panelClassName,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: ReactNode;
  align?: 'start' | 'end';
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useDismissable(open, () => setOpen(false), ref);

  return (
    <div ref={ref} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          className={cn(
            'absolute z-40 mt-1 min-w-44 origin-top animate-pop rounded-lg border border-border bg-surface p-1.5 shadow-overlay',
            align === 'end' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onSelect,
  icon,
  hint,
  danger,
  selected,
}: {
  children: ReactNode;
  onSelect?: () => void;
  icon?: ReactNode;
  hint?: ReactNode;
  danger?: boolean;
  selected?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
        danger ? 'text-danger hover:bg-danger-muted' : 'text-foreground hover:bg-surface-secondary',
        selected && 'bg-surface-secondary',
      )}
    >
      {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
      {hint ? <span className="shrink-0 text-[11px] text-muted">{hint}</span> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="px-2 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-muted">{children}</div>;
}

/* ---------------------------------- Tabs ---------------------------------- */

export type TabItem = { id: string; label: string; hint?: string; count?: number };

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: React.KeyboardEvent) => {
    const index = items.findIndex((item) => item.id === value);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const delta = event.key === 'ArrowRight' ? 1 : -1;
      const next = items[(index + delta + items.length) % items.length];
      onChange(next.id);
      refs.current[next.id]?.focus();
    }
  };

  return (
    <div role="tablist" onKeyDown={onKeyDown} className={cn('flex items-center gap-0.5 border-b border-border', className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-[13px] transition-colors',
              active
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.label}
            {typeof item.count === 'number' ? (
              <span className="ml-1.5 font-mono text-[11px] tabular-nums text-muted">{item.count}</span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------------------- Dialog --------------------------------- */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !node) return;
      const focusable = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-black/35 backdrop-blur-[1px] animate-fade dark:bg-black/55"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative mt-[6vh] w-full animate-rise rounded-[14px] border border-border bg-surface shadow-overlay',
          size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-3xl' : 'max-w-xl',
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
          <div>
            <h2 id={titleId} className="text-[15px] font-semibold tracking-tight text-foreground">
              {title}
            </h2>
            {description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog" className="-mr-1 -mt-1 h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children ? <div className="px-4 py-3.5">{children}</div> : null}
        {footer ? <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ---------------------------------- Sheet --------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  side = 'right',
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  side?: 'right' | 'bottom';
  footer?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button type="button" aria-label="Close" onClick={onClose} className="flex-1 cursor-default bg-black/35 animate-fade dark:bg-black/55" />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={cn(
          'flex flex-col border-border bg-surface shadow-overlay',
          side === 'right'
            ? 'h-full w-full max-w-md animate-rise border-l'
            : 'mt-auto max-h-[86vh] w-full animate-rise rounded-t-[14px] border-t',
          className,
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close panel" className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 scroll-thin">{children}</div>
        {footer ? <div className="border-t border-border px-4 py-2.5">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------ Smaller inputs ----------------------------- */

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  ariaLabel,
}: {
  options: { value: T; label: ReactNode; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('inline-flex rounded-md border border-border bg-surface p-0.5', className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            title={option.title}
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-[5px] font-medium transition-colors',
              size === 'sm' ? 'px-2 py-1 text-[11.5px]' : 'px-2.5 py-1 text-xs',
              active ? 'bg-surface-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: ReactNode;
  description?: string;
  id?: string;
}) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <label htmlFor={inputId} className="min-w-0">
        <span className="block text-[13.5px] text-foreground">{label}</span>
        {description ? <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{description}</span> : null}
      </label>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-primary bg-primary' : 'border-border-strong bg-surface-secondary',
        )}
      >
        <span
          className={cn(
            'block h-3.5 w-3.5 translate-y-[1.5px] rounded-full bg-surface shadow-sm transition-transform',
            checked ? 'translate-x-[18px] bg-primary-foreground' : 'translate-x-[2px]',
          )}
        />
      </button>
    </div>
  );
}

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  hint,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  hint?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-2 text-left text-[13.5px] text-foreground hover:text-primary"
      >
        <span className="min-w-0">{summary}</span>
        <span className="flex shrink-0 items-center gap-2 text-[11px] text-muted">
          {hint}
          <span className={cn('transition-transform', open && 'rotate-45')}>+</span>
        </span>
      </button>
      {open ? <div className="pb-3 animate-fade">{children}</div> : null}
    </div>
  );
}

export function CopyButton({ text, label = 'Copy', className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <Button variant="ghost" size="sm" onClick={copy} className={cn('text-[11.5px]', className)}>
      {copied ? 'Copied' : label}
    </Button>
  );
}

/** Renders a keyboard hint inline in toolbars. */
export function ShortcutHint({ keys }: { keys: string[] }) {
  return (
    <span className="hidden items-center gap-0.5 sm:inline-flex">
      {keys.map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}
