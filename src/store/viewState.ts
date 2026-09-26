/**
 * Vue partageable : fond, couches, légende, filtres, position de la carte et objet sélectionné,
 * sérialisés dans l'URL (#v=…) ou enregistrés localement sous un nom (« vues enregistrées »).
 */
import { EMPTY_FILTERS, type Filters } from '../domain/patrimoineIndex';
import type { EntityRef } from '../domain/model';
import { mapRef } from '../map/mapRef';
import { useAppStore, type PatrimoineStyle } from './useAppStore';

export interface ViewState {
  b?: string;
  /** Couches visibles (id → opacité). */
  l?: Record<string, number>;
  p?: Partial<Pick<PatrimoineStyle, 'colorBy' | 'uniformColor' | 'representation' | 'sizeMode' | 'labels'>>;
  f?: Partial<Filters>;
  /** Centre [lon, lat] et zoom. */
  c?: [number, number, number];
  s?: { k: EntityRef['kind']; i: string };
}

const SELECTABLE = new Set(['residence', 'batiment', 'cage', 'logement', 'agence', 'commune', 'epci']);

export function captureView(): ViewState {
  const s = useAppStore.getState();
  const v: ViewState = { b: s.basemap };
  const l: Record<string, number> = {};
  for (const [id, st] of Object.entries(s.layers)) if (st.visible) l[id] = Math.round(st.opacity * 100) / 100;
  if (Object.keys(l).length) v.l = l;
  const { colorBy, uniformColor, representation, sizeMode, labels } = s.patrimoine;
  v.p = { colorBy, representation, sizeMode, labels, ...(colorBy === 'uniforme' ? { uniformColor } : {}) };
  const f: Partial<Filters> = {};
  for (const [k, val] of Object.entries(s.filters) as [keyof Filters, unknown][]) {
    if (Array.isArray(val) ? val.length : val && typeof val === 'object' && Object.values(val).some((x) => (x as unknown[])?.length)) {
      (f as Record<string, unknown>)[k] = val;
    }
  }
  if (Object.keys(f).length) v.f = f;
  const m = mapRef.current;
  if (m) {
    const c = m.getCenter();
    v.c = [round(c.lng, 5), round(c.lat, 5), round(m.getZoom(), 2)];
  }
  if (s.selection && SELECTABLE.has(s.selection.kind)) v.s = { k: s.selection.kind, i: s.selection.id };
  return v;
}

export function applyView(v: ViewState) {
  const s = useAppStore.getState();
  const layers = { ...s.layers };
  if (v.l) {
    for (const id of Object.keys(layers)) {
      const on = id in v.l;
      if (layers[id].visible !== on || (on && layers[id].opacity !== v.l[id])) {
        layers[id] = { ...layers[id], visible: on, ...(on ? { opacity: v.l[id] } : {}) };
      }
    }
  }
  useAppStore.setState({
    ...(v.b ? { basemap: v.b } : {}),
    layers,
    patrimoine: { ...s.patrimoine, ...(v.p ?? {}), hidden: {} },
    filters: { ...EMPTY_FILTERS, ...(v.f ?? {}) },
    selection: v.s && s.index ? { kind: v.s.k, id: v.s.i } : undefined,
  });
  if (v.c) s.flyTo({ position: { lon: v.c[0], lat: v.c[1] }, zoom: v.c[2] });
}

/* ---------------- URL ---------------- */

const toB64 = (s: string) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64 = (s: string) => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));

export function encodeView(v: ViewState) {
  return toB64(JSON.stringify(v));
}

export function decodeView(code: string): ViewState | undefined {
  try {
    const v = JSON.parse(fromB64(code));
    return v && typeof v === 'object' ? sanitize(v) : undefined;
  } catch {
    return undefined;
  }
}

/** Lien complet vers la vue actuelle. */
export function shareUrl(): string {
  const u = new URL(window.location.href);
  u.hash = `v=${encodeView(captureView())}`;
  return u.toString();
}

/** Vue contenue dans l'URL d'ouverture (#v=…), s'il y en a une. */
export function viewFromLocation(): ViewState | undefined {
  const m = window.location.hash.match(/^#v=([\w-]+)/);
  return m ? decodeView(m[1]) : undefined;
}

/* ---------------- Vues enregistrées (navigateur) ---------------- */

export interface SavedView {
  id: string;
  name: string;
  date: string;
  view: ViewState;
}

const KEY = 'atlas.savedViews';

export function listSavedViews(): SavedView[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function store(list: SavedView[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* stockage indisponible (navigation privée) */
  }
}

export function saveCurrentView(name: string): SavedView {
  const sv: SavedView = { id: `v${Date.now().toString(36)}`, name, date: new Date().toISOString(), view: captureView() };
  store([sv, ...listSavedViews().filter((x) => x.name !== name)]);
  return sv;
}

export function deleteSavedView(id: string) {
  store(listSavedViews().filter((x) => x.id !== id));
}

/** Lien reçu de l'extérieur : ne garder que des valeurs du bon type. */
function sanitize(v: Record<string, unknown>): ViewState {
  const out: ViewState = {};
  if (typeof v.b === 'string') out.b = v.b;
  if (v.l && typeof v.l === 'object') out.l = Object.fromEntries(Object.entries(v.l).filter(([, o]) => typeof o === 'number' && o >= 0 && o <= 1)) as Record<string, number>;
  if (v.p && typeof v.p === 'object') {
    const p = v.p as Record<string, unknown>;
    out.p = Object.fromEntries(Object.entries(p).filter(([k, x]) => ['colorBy', 'uniformColor', 'representation', 'sizeMode'].includes(k) ? typeof x === 'string' : k === 'labels' && typeof x === 'boolean'));
    if (out.p.uniformColor && !/^#[0-9a-f]{3,8}$/i.test(out.p.uniformColor)) delete out.p.uniformColor;
  }
  if (v.f && typeof v.f === 'object') {
    const f: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v.f)) {
      if (k === 'roles' && x && typeof x === 'object') f.roles = Object.fromEntries(Object.entries(x).filter(([, a]) => Array.isArray(a)).map(([r, a]) => [r, (a as unknown[]).map(String)]));
      else if (k in EMPTY_FILTERS && Array.isArray(x)) f[k] = x.map(String);
    }
    out.f = f as Partial<Filters>;
  }
  if (Array.isArray(v.c) && v.c.length === 3 && v.c.every((n) => typeof n === 'number' && Number.isFinite(n))) out.c = v.c as [number, number, number];
  const s = v.s as { k?: unknown; i?: unknown } | undefined;
  if (s && typeof s.k === 'string' && SELECTABLE.has(s.k) && typeof s.i === 'string') out.s = { k: s.k as EntityRef['kind'], i: s.i };
  return out;
}

function round(n: number, d: number) {
  const k = 10 ** d;
  return Math.round(n * k) / k;
}
