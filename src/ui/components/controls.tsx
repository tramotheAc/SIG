import { useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { collapse, expand, useAnimatedNumber } from '../motion';
import { Icon } from './Icon';
import { normalize } from '../../domain/search';

export function Slider({ label, value, min, max, step, onChange, format }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="field-value">{format ? format(value) : value}</span>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  return (
    <div className="field-row">
      <label htmlFor={id}>{label}</label>
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="color-input" />
      <span className="field-value mono">{value}</span>
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; disabled?: boolean }) {
  return (
    <label className={`toggle ${disabled ? 'is-disabled' : ''}`}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'is-active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface Option {
  value: string;
  label: string;
  hint?: string;
  color?: string;
}

/** Sélection multiple avec recherche (listes longues : communes, résidences…). */
export function MultiSelect({ label, options, value, onChange, placeholder = 'Rechercher…', max = 60 }: {
  label: string; options: Option[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string; max?: number;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const nq = normalize(q);
    return options.filter((o) => !nq || normalize(`${o.label} ${o.hint ?? ''}`).includes(nq)).slice(0, max);
  }, [options, q, max]);
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  return (
    <div className="multiselect" ref={ref} onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <div className="field-label">{label}</div>
      <div className="chips">
        {value.map((v) => (
          <span key={v} className="chip">
            {byValue.get(v)?.color && <span className="dot" style={{ background: byValue.get(v)!.color }} />}
            {byValue.get(v)?.label ?? v}
            <button type="button" aria-label={`Retirer ${byValue.get(v)?.label ?? v}`} onClick={() => toggle(v)}><Icon name="close" size={12} /></button>
          </span>
        ))}
      </div>
      <input
        className="input"
        value={q}
        placeholder={options.length ? placeholder : 'Aucune valeur disponible'}
        disabled={!options.length}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); if (e.key === 'Enter' && filtered[0]) { toggle(filtered[0].value); setQ(''); } }}
        aria-label={label}
      />
      {open && (
        <ul className="dropdown" role="listbox" aria-multiselectable="true">
          {filtered.length === 0 && <li className="dropdown-empty">Aucun résultat</li>}
          {filtered.map((o) => (
            <li key={o.value}>
              <button type="button" role="option" aria-selected={value.includes(o.value)} className={value.includes(o.value) ? 'is-selected' : ''} onClick={() => toggle(o.value)}>
                <span className="check">{value.includes(o.value) && <Icon name="check" size={14} />}</span>
                {o.color && <span className="dot" style={{ background: o.color }} />}
                <span className="grow">{o.label}</span>
                {o.hint && <span className="muted small">{o.hint}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Section({ title, children, right, defaultOpen = false }: { title: string; children: ReactNode; right?: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(defaultOpen);
  const body = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open && mounted && body.current) expand(body.current);
  }, [open, mounted]);
  const toggle = () => {
    if (open) {
      setOpen(false);
      if (body.current) collapse(body.current, () => setMounted(false));
      else setMounted(false);
    } else {
      setOpen(true);
      setMounted(true);
    }
  };
  return (
    <section className={`section ${open ? 'is-open' : ''}`}>
      <header className="section-header">
        <button type="button" className="section-toggle" aria-expanded={open} onClick={toggle}>
          <Icon name="chevronRight" size={14} className="section-chevron" />
          <h3>{title}</h3>
        </button>
        {right}
      </header>
      {mounted && (
        <div className="section-body" ref={body}>
          {children}
        </div>
      )}
    </section>
  );
}

export function StatusBadge({ status, message }: { status: string; message?: string }) {
  if (status === 'loading') return <span className="badge badge-info" title="Chargement">Chargement…</span>;
  if (status === 'unavailable') return <span className="badge badge-muted" title={message}>Non disponible</span>;
  if (status === 'error') return <span className="badge badge-warn" title={message}>Indisponible</span>;
  return null;
}

export const fmt = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString('fr-FR'));

/** Nombre formaté avec comptage animé. */
export function AnimatedNumber({ value }: { value: number | undefined }) {
  return <>{fmt(useAnimatedNumber(value))}</>;
}
