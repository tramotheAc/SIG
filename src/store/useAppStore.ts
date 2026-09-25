/**
 * État applicatif (Zustand). Ne contient que des objets du modèle normalisé et des réglages d'affichage.
 */
import { create } from 'zustand';
import { basemaps, referenceLayers } from '../config/layers.config';
import { siteConfig } from '../config/siteConfig';
import type { PatrimoineIndex, Filters } from '../domain/patrimoineIndex';
import { EMPTY_FILTERS } from '../domain/patrimoineIndex';
import type { EntityRef, GeoPoint, PatrimoineDataset, RoleKey } from '../domain/model';
import type { ColorBy, SizeMode } from '../domain/symbology';
import type { SearchIndex } from '../domain/search';

export type LayerStatus = 'idle' | 'loading' | 'ready' | 'unavailable' | 'error';

export interface LayerState {
  visible: boolean;
  opacity: number;
  color: string;
  width: number;
  size: number;
  labels: boolean;
  /** Communes / EPCI : n'afficher que ceux où le bailleur a du patrimoine. */
  patrimoineOnly: boolean;
  /** Communes / EPCI : colorer par agence. */
  colorByAgence: boolean;
  status: LayerStatus;
  message?: string;
}

export type Representation = 'auto' | 'commune' | 'residence' | 'batiment' | 'logement';

export interface PatrimoineStyle {
  visible: boolean;
  opacity: number;
  colorBy: ColorBy;
  sizeMode: SizeMode;
  sizeScale: number;
  representation: Representation;
  /** Catégories masquées par critère de coloration. */
  hidden: Partial<Record<ColorBy, string[]>>;
  labels: boolean;
}

export type LeftTab = 'couches' | 'patrimoine' | 'filtres' | 'analyse';

export interface FlyTarget {
  position?: GeoPoint;
  bounds?: [[number, number], [number, number]];
  zoom?: number;
  nonce: number;
}

export interface Analysis {
  id: 'commune' | 'epci' | 'agence' | 'qpv' | 'apl' | 'pinel' | 'role';
  role?: RoleKey;
  showOnMap: boolean;
}

interface State {
  status: 'idle' | 'loading' | 'ready' | 'error';
  progress?: string;
  error?: { message: string; detail?: string };
  dataset?: PatrimoineDataset;
  index?: PatrimoineIndex;
  search?: SearchIndex;
  /** Incrémenté à chaque enrichissement géographique (communes, QPV, zonages). */
  geoVersion: number;

  basemap: string;
  layers: Record<string, LayerState>;
  layerOrder: string[];
  patrimoine: PatrimoineStyle;
  filters: Filters;
  selection?: EntityRef;
  leftTab: LeftTab;
  leftOpen: boolean;
  analysis?: Analysis;
  flyTarget?: FlyTarget;
  showImport: boolean;
  zoom: number;
  toast?: { message: string; tone: 'info' | 'error' | 'success'; nonce: number };
}

interface Actions {
  set: (p: Partial<State>) => void;
  setLayer: (id: string, p: Partial<LayerState>) => void;
  moveLayer: (id: string, dir: -1 | 1) => void;
  setPatrimoine: (p: Partial<PatrimoineStyle>) => void;
  toggleHidden: (value: string) => void;
  isolateCategory: (value: string) => void;
  setFilters: (p: Partial<Filters>) => void;
  toggleFilterValue: <K extends Exclude<keyof Filters, 'roles' | 'departements'>>(key: K, value: Filters[K][number]) => void;
  setRoleFilter: (role: RoleKey, values: string[]) => void;
  resetFilters: () => void;
  select: (ref?: EntityRef) => void;
  flyTo: (t: Omit<FlyTarget, 'nonce'>) => void;
  notify: (message: string, tone?: 'info' | 'error' | 'success') => void;
}

const initialLayers: Record<string, LayerState> = Object.fromEntries(
  referenceLayers.map((l) => [
    l.id,
    {
      visible: siteConfig.layers.find((s) => s.id === l.id)?.visible ?? false,
      opacity: l.defaults.opacity,
      color: l.defaults.color,
      width: l.defaults.width ?? 1,
      size: l.defaults.size ?? 4,
      labels: l.defaults.labels ?? false,
      patrimoineOnly: !!l.patrimoineOnlyOption,
      colorByAgence: false,
      status: 'idle' as LayerStatus,
    },
  ]),
);

export const useAppStore = create<State & Actions>((set, get) => ({
  status: 'idle',
  geoVersion: 0,
  basemap: basemaps[0].id,
  layers: initialLayers,
  layerOrder: referenceLayers.map((l) => l.id),
  patrimoine: {
    visible: true,
    opacity: 0.9,
    colorBy: siteConfig.ui.colorBy.includes(siteConfig.ui.defaultColorBy) ? siteConfig.ui.defaultColorBy : (siteConfig.ui.colorBy[0] ?? 'agence'),
    sizeMode: 'logements',
    sizeScale: 1,
    representation: 'auto',
    hidden: {},
    labels: true,
  },
  filters: EMPTY_FILTERS,
  leftTab: ((Object.keys(siteConfig.ui.tabs) as LeftTab[]).find((t) => siteConfig.ui.tabs[t]) ?? 'patrimoine'),
  leftOpen: true,
  showImport: false,
  zoom: 7,

  set: (p) => set(p),
  setLayer: (id, p) => set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], ...p } } })),
  moveLayer: (id, dir) =>
    set((s) => {
      const order = [...s.layerOrder];
      const i = order.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= order.length) return {};
      [order[i], order[j]] = [order[j], order[i]];
      return { layerOrder: order };
    }),
  setPatrimoine: (p) => set((s) => ({ patrimoine: { ...s.patrimoine, ...p } })),
  toggleHidden: (value) =>
    set((s) => {
      const by = s.patrimoine.colorBy;
      const cur = s.patrimoine.hidden[by] ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { patrimoine: { ...s.patrimoine, hidden: { ...s.patrimoine.hidden, [by]: next } } };
    }),
  /** Clic sur une entrée de légende : filtre sur cette catégorie (re-clic : annule). */
  isolateCategory: (value) => {
    const s = get();
    const by = s.patrimoine.colorBy;
    const f = s.filters;
    const apply = (cur: string[]) => (cur.length === 1 && cur[0] === value ? [] : [value]);
    if (by === 'agence') s.setFilters({ agences: apply(f.agences) });
    else if (by === 'qpv') s.setFilters({ qpv: apply(f.qpv) as Filters['qpv'] });
    else if (by === 'zoneApl') s.setFilters({ zonesApl: apply(f.zonesApl) });
    else if (by === 'zonePinel') s.setFilters({ zonesPinel: apply(f.zonesPinel) });
    else s.setRoleFilter(by, apply(f.roles[by] ?? []));
    // Une catégorie masquée qu'on isole redevient visible.
    const hidden = s.patrimoine.hidden[by] ?? [];
    if (hidden.includes(value)) get().toggleHidden(value);
  },
  setFilters: (p) => set((s) => ({ filters: { ...s.filters, ...p } })),
  toggleFilterValue: (key, value) =>
    set((s) => {
      const cur = s.filters[key] as unknown[];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { filters: { ...s.filters, [key]: next } };
    }),
  setRoleFilter: (role, values) => set((s) => ({ filters: { ...s.filters, roles: { ...s.filters.roles, [role]: values } } })),
  resetFilters: () => set((s) => ({ filters: EMPTY_FILTERS, patrimoine: { ...s.patrimoine, hidden: {} } })),
  select: (ref) => set({ selection: ref }),
  flyTo: (t) => set({ flyTarget: { ...t, nonce: Date.now() + Math.random() } }),
  notify: (message, tone = 'info') => set({ toast: { message, tone, nonce: Date.now() } }),
}));
