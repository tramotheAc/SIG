import { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig } from '../config/app.config';
import { geocode } from '../data/referentiels/geocodage';
import { SEARCH_GROUPS, type SearchResult } from '../domain/search';
import { selectAndZoom } from '../store/navigation';
import { useAppStore } from '../store/useAppStore';
import { Icon } from './components/Icon';

/** Recherche globale : patrimoine + référentiels locaux (instantané) + BAN (asynchrone). */
export function SearchBox() {
  const search = useAppStore((s) => s.search);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [ban, setBan] = useState<{ q: string; results: SearchResult[]; status: 'idle' | 'loading' | 'error' }>({ q: '', results: [], status: 'idle' });
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef('');
  const boxRef = useRef<HTMLDivElement>(null);

  const local = useMemo(() => (search && q.trim().length >= 2 ? search.search(q) : []), [search, q]);

  useEffect(() => {
    const query = q.trim();
    latest.current = query;
    if (query.length < 3) {
      setBan({ q: query, results: [], status: 'idle' });
      return;
    }
    setBan((b) => ({ ...b, status: 'loading' }));
    const t = setTimeout(async () => {
      try {
        const results = await geocode(query);
        if (latest.current === query) setBan({ q: query, results, status: 'idle' });
      } catch {
        if (latest.current === query) setBan({ q: query, results: [], status: 'error' });
      }
    }, appConfig.services.geocodageDebounceMs);
    return () => clearTimeout(t);
  }, [q]);

  // Raccourci clavier « / » ou Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if ((e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const results = [...local, ...ban.results];
  const grouped = SEARCH_GROUPS.map((g) => ({ ...g, items: results.filter((r) => r.kind === g.kind) })).filter((g) => g.items.length);
  const flat = grouped.flatMap((g) => g.items);

  const choose = (r: SearchResult) => {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    selectAndZoom({ kind: r.kind, id: r.id, payload: r.kind === 'adresse' ? { label: r.label, position: r.position, ...r.payload } : undefined });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(flat.length - 1, a + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === 'Enter' && flat[active]) {
      choose(flat[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  let idx = -1;
  const showPanel = open && q.trim().length >= 2;
  return (
    <div className="search" ref={boxRef} onBlur={(e) => !boxRef.current?.contains(e.relatedTarget as Node) && setOpen(false)}>
      <Icon name="search" className="search-icon" />
      <input
        ref={inputRef}
        className="search-input"
        placeholder="Rechercher une adresse, résidence, logement, commune, agence…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="search-results"
        aria-label="Recherche globale"
      />
      {q ? (
        <button type="button" className="icon-btn search-clear" aria-label="Effacer la recherche" onClick={() => { setQ(''); inputRef.current?.focus(); }}>
          <Icon name="close" size={16} />
        </button>
      ) : (
        <kbd className="search-kbd">/</kbd>
      )}
      {showPanel && (
        <div className="search-panel" id="search-results" role="listbox">
          {grouped.map((g) => (
            <div key={g.kind} className="search-group">
              <div className="search-group-title">{g.label}</div>
              {g.items.map((r) => {
                idx++;
                const i = idx;
                return (
                  <button
                    key={`${r.kind}-${r.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className={`search-item ${i === active ? 'is-active' : ''}`}
                    onMouseEnter={() => setActive(i)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(r)}
                  >
                    <span className="search-item-label">{r.label}</span>
                    {r.sublabel && <span className="search-item-sub">{r.sublabel}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {ban.status === 'loading' && <div className="search-status">Recherche d’adresses (BAN)…</div>}
          {ban.status === 'error' && <div className="search-status">Service d’adresses (BAN) indisponible — recherche limitée au patrimoine.</div>}
          {!search && <div className="search-status">Données du patrimoine en cours de chargement…</div>}
          {search && !flat.length && ban.status !== 'loading' && <div className="search-status">Aucun résultat pour « {q} ».</div>}
        </div>
      )}
    </div>
  );
}
