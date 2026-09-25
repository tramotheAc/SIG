import { useMemo, useRef, useState, type ReactNode } from 'react';
import {
  CATALOG,
  CONTROL_LABELS,
  DEFAULT_SITE_CONFIG,
  FILTER_LABELS,
  SITE_JSON_URL,
  TAB_LABELS,
  clearDraft,
  downloadJson,
  mergeConfig,
  publishedConfig,
  saveDraft,
  siteConfig,
  siteConfigOrigin,
  type Control,
  type FilterKey,
  type LayerSetting,
  type SiteConfig,
  type TabKey,
  type ExportTemplate,
  type ZoneType,
  type TemplateOutput,
  ZONE_LABELS,
  EMBED_KIND_LABELS,
} from '../config/siteConfig';
import type { SourceMeta } from '../config/layers.config';
import { COLOR_BY_OPTIONS } from '../domain/symbology';
import { DataSourcePanel } from '../ui/DataSourcePanel';
import { describeResponse, modernizeIgnUrl, parseWms, parseWmts, type OgcLayer } from './ogcCapabilities';
import type { CustomLayer } from '../config/siteConfig';
import { DabDataProvider, discoverEntities } from '../data/api/DabDataProvider';
import { loadData } from '../store/bootstrap';
import { Icon } from '../ui/components/Icon';
import { MetaCard } from '../ui/panels/LayersPanel';
import './admin.css';
import { useAppStore } from '../store/useAppStore';
import { buildEmbedUrl, entityValues } from '../ui/embed';
import type { EntityRef } from '../domain/model';

type Section = 'donnees' | 'fonds' | 'couches' | 'exports' | 'tableaux' | 'interface' | 'services' | 'publication';
const SECTIONS: { id: Section; label: string; icon: string; help: string }[] = [
  { id: 'donnees', label: 'Données patrimoine', icon: 'database', help: 'Source Excel publiée, import et contrôle d’un fichier.' },
  { id: 'fonds', label: 'Fonds de carte', icon: 'image', help: 'Fonds proposés aux utilisateurs et fond par défaut.' },
  { id: 'couches', label: 'Couches', icon: 'layers', help: 'Sources (fichiers, API), style par défaut et réglages laissés aux utilisateurs.' },
  { id: 'exports', label: 'Exports types', icon: 'image', help: 'Modèles de cartes et d’images proposés aux utilisateurs : zone, couches, symbologie, format, cadrage.' },
  { id: 'tableaux', label: 'Tableaux de bord', icon: 'chart', help: 'Page web (rapport Power BI…) ouverte depuis la fiche d’un objet, filtrée sur cet objet.' },
  { id: 'interface', label: 'Interface', icon: 'sliders', help: 'Onglets, filtres, critères de couleur, exports et recherche.' },
  { id: 'services', label: 'Services & API', icon: 'external', help: 'Adresses des API et des fichiers de référence.' },
  { id: 'publication', label: 'Publication', icon: 'upload', help: 'Prévisualiser, télécharger et publier la configuration.' },
];

const GROUP_LABELS: Record<string, string> = { limites: 'Limites', zonages: 'Zonages', referentiels: 'Référentiels' };

/**
 * Page d'administration (experts) : paramètre ce qui est proposé côté utilisateur.
 * Les modifications sont d'abord un BROUILLON local (prévisualisable dans ce navigateur),
 * puis publiées en remplaçant config/site.json sur le serveur.
 */
export function AdminPage() {
  const [cfg, setCfg] = useState<SiteConfig>(() => structuredClone(siteConfig));
  const [section, setSection] = useState<Section>('couches');
  const [saved, setSaved] = useState(JSON.stringify(siteConfig));
  const dirty = JSON.stringify(cfg) !== saved;
  const current = SECTIONS.find((s) => s.id === section)!;

  const update = (fn: (c: SiteConfig) => void) =>
    setCfg((c) => {
      const n = structuredClone(c);
      fn(n);
      return n;
    });

  const preview = () => {
    saveDraft(cfg);
    setSaved(JSON.stringify(cfg));
    window.location.hash = '';
    window.location.reload();
  };

  return (
    <div className="admin">
      <aside className="admin-rail">
        <div className="admin-brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <div className="admin-brand-name">Administration</div>
            <div className="admin-brand-sub">Atlas Patrimoine</div>
          </div>
        </div>
        <nav>
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" className={`admin-nav ${section === s.id ? 'is-active' : ''}`} onClick={() => setSection(s.id)}>
              <Icon name={s.icon} size={18} />
              {s.label}
            </button>
          ))}
        </nav>
        <a className="admin-nav admin-back" href="#/">
          <Icon name="chevronLeft" size={18} /> Retour à la carte
        </a>
      </aside>

      <main className="admin-main">
        <header className="admin-head">
          <div>
            <h1>{current.label}</h1>
            <p className="muted">{current.help}</p>
          </div>
          <div className="admin-head-actions">
            <span className={`badge ${siteConfigOrigin === 'brouillon' ? 'badge-warn' : 'badge-info'}`} title="Configuration actuellement appliquée dans ce navigateur">
              Config. {siteConfigOrigin}
            </span>
            {dirty && <span className="badge badge-warn">Modifications non enregistrées</span>}
            <button type="button" className="btn btn-primary" onClick={preview} disabled={!dirty && siteConfigOrigin === 'brouillon'}>
              <Icon name="eye" size={16} /> Prévisualiser
            </button>
            <button type="button" className="btn" onClick={() => downloadJson(cfg)}>
              <Icon name="download" size={16} /> site.json
            </button>
          </div>
        </header>

        <div className="admin-body">
          {section === 'donnees' && <DonneesSection cfg={cfg} update={update} />}
          {section === 'fonds' && <FondsSection cfg={cfg} update={update} />}
          {section === 'couches' && <CouchesSection cfg={cfg} update={update} />}
          {section === 'exports' && <ExportsSection cfg={cfg} update={update} />}
          {section === 'tableaux' && <TableauxSection cfg={cfg} update={update} />}
          {section === 'interface' && <InterfaceSection cfg={cfg} update={update} />}
          {section === 'services' && <ServicesSection cfg={cfg} update={update} />}
          {section === 'publication' && <PublicationSection cfg={cfg} setCfg={setCfg} />}
        </div>
      </main>
    </div>
  );
}

type Props = { cfg: SiteConfig; update: (fn: (c: SiteConfig) => void) => void };

/* ------------------------------ Briques ------------------------------ */

function Card({ title, children, right, muted }: { title: ReactNode; children?: ReactNode; right?: ReactNode; muted?: boolean }) {
  return (
    <section className={`admin-card ${muted ? 'is-muted' : ''}`}>
      <header className="admin-card-head">
        <h2>{title}</h2>
        {right}
      </header>
      {children && <div className="admin-card-body">{children}</div>}
    </section>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden="true"><span className="toggle-thumb" /></span>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}

function Field({ label, children, hint, wide }: { label: string; children: ReactNode; hint?: string; wide?: boolean }) {
  return (
    <label className={`admin-field ${wide ? 'is-wide' : ''}`}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && <span className="admin-hint">{hint}</span>}
    </label>
  );
}

/** Teste une URL depuis le navigateur (GeoJSON, CSV, API ou tuile). */
function TestUrl({ url }: { url: string }) {
  const [state, setState] = useState<{ status: 'idle' | 'loading' | 'ok' | 'ko'; msg?: string }>({ status: 'idle' });
  const run = async () => {
    const u = url
      .replace('{z}', '7').replace('{x}', '62').replace('{y}', '44')
      .replace('TILEMATRIX={z}', 'TILEMATRIX=7')
      .replace('{bbox-epsg-3857}', '-222638,6106854,-189548,6139944');
    if (!u || u.includes('{')) return setState({ status: 'ko', msg: 'URL incomplète.' });
    setState({ status: 'loading' });
    try {
      const res = await fetch(new URL(u, window.location.href).href, { cache: 'no-cache' });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok) return setState({ status: 'ko', msg: `Erreur HTTP ${res.status}` });
      if (type.includes('text/html') && !/\.html?$/.test(u)) return setState({ status: 'ko', msg: 'Fichier introuvable (page HTML reçue).' });
      let info = type.split(';')[0] || 'réponse reçue';
      if (/json/.test(type) || /\.(geo)?json$/i.test(u)) {
        const j = await res.json();
        info = Array.isArray(j?.features) ? `${j.features.length} objets GeoJSON` : Array.isArray(j) ? `${j.length} éléments` : 'JSON valide';
      } else if (/csv|text\/plain/.test(type) || /\.csv$/i.test(u)) {
        info = `${(await res.text()).split(/\r?\n/).filter(Boolean).length} lignes`;
      }
      setState({ status: 'ok', msg: info });
    } catch {
      setState({ status: 'ko', msg: 'Inaccessible depuis le navigateur (réseau, CORS ou URL).' });
    }
  };
  return (
    <span className="admin-test">
      <button type="button" className="btn btn-sm" onClick={run} disabled={state.status === 'loading'}>
        {state.status === 'loading' ? 'Test…' : 'Tester'}
      </button>
      {state.status === 'ok' && <span className="admin-ok"><Icon name="check" size={14} /> {state.msg}</span>}
      {state.status === 'ko' && <span className="admin-ko"><Icon name="warning" size={14} /> {state.msg}</span>}
    </span>
  );
}

/* ------------------------------ Sections ------------------------------ */

function DonneesSection({ cfg, update }: Props) {
  const api = cfg.data.api;
  const [entities, setEntities] = useState<string[]>();
  const [discover, setDiscover] = useState<string>();
  const [testing, setTesting] = useState(false);
  const setSource = (source: 'excel' | 'api') =>
    update((c) => {
      c.data.source = source;
      if (source === 'api') {
        c.data.synthetic = false;
        if (/démonstration/i.test(c.data.label)) c.data.label = 'Entrepôt de données (API)';
      }
    });
  const runDiscover = async () => {
    setDiscover('Lecture de l’OpenAPI…');
    try {
      const list = await discoverEntities(api.baseUrl, api.authHeader && api.authValue ? { [api.authHeader]: api.authValue } : {});
      setEntities(list);
      setDiscover(`${list.length} entités exposées.`);
    } catch {
      setDiscover('OpenAPI inaccessible depuis ce navigateur (réseau, VPN, CORS ou URL).');
    }
  };
  const testLoad = async () => {
    setTesting(true);
    await loadData(new DabDataProvider(api, cfg.data.label));
    setTesting(false);
  };
  const TABLES: { key: keyof typeof api.entities; label: string; hint: string }[] = [
    { key: 'patrimoine', label: 'Patrimoine (obligatoire)', hint: 'DWH.Patrimoine : ensembles, adresses, cages' },
    { key: 'organisation', label: 'Organisation', hint: 'DWH.Organisation : agences' },
    { key: 'lot', label: 'Lot', hint: 'DWH.Lot : logements' },
    { key: 'client', label: 'Client', hint: 'DWH.Client : occupation, conseiller social' },
    { key: 'affectations', label: 'Affectations (facultatif)', hint: 'Gérant, commercial, travailleur social' },
  ];
  return (
    <>
      <Card title="Source des données patrimoine">
        <div className="segmented" role="radiogroup" aria-label="Source">
          {(['excel', 'api'] as const).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={cfg.data.source === s} className={cfg.data.source === s ? 'is-active' : ''} onClick={() => setSource(s)}>
              {s === 'excel' ? 'Fichier Excel' : 'API de l’entrepôt'}
            </button>
          ))}
        </div>
        <div className="admin-grid">
          <Field label="Libellé affiché" wide>
            <input className="input" value={cfg.data.label} onChange={(e) => update((c) => void (c.data.label = e.target.value))} />
          </Field>
          <Switch checked={cfg.data.synthetic} onChange={(v) => update((c) => void (c.data.synthetic = v))} label="Données de démonstration (affiche le bandeau « synthétique »)" />
        </div>
      </Card>

      {cfg.data.source === 'excel' ? (
        <Card title="Fichier Excel publié">
          <Field label="Fichier Excel (URL ou chemin)" hint="Chemin relatif à l’application (ex. demo/patrimoine.xlsx) ou URL renvoyant un .xlsx." wide>
            <div className="admin-inline">
              <input className="input" value={cfg.data.excelUrl} onChange={(e) => update((c) => void (c.data.excelUrl = e.target.value))} />
              <TestUrl url={cfg.data.excelUrl} />
            </div>
          </Field>
        </Card>
      ) : (
        <Card title="API de l’entrepôt (Data API Builder)">
          <div className="admin-grid">
            <Field label="URL de base REST" hint="Ex. https://…azurecontainerapps.io/rest — l’OpenAPI est lu sur {base}/openapi." wide>
              <div className="admin-inline">
                <input className="input mono" value={api.baseUrl} onChange={(e) => update((c) => void (c.data.api.baseUrl = e.target.value))} />
                <button type="button" className="btn btn-sm" onClick={runDiscover}>Découvrir les entités</button>
              </div>
            </Field>
            {discover && <p className="admin-hint is-wide">{discover}</p>}
          </div>
          <datalist id="dab-entities">{entities?.map((e) => <option key={e} value={e} />)}</datalist>
          <div className="admin-sub">Entité exposée pour chaque table</div>
          <div className="admin-grid">
            {TABLES.map((t) => (
              <Field key={t.key} label={t.label} hint={t.hint}>
                <input className="input mono" list="dab-entities" value={api.entities[t.key]} placeholder="(non chargée)" onChange={(e) => update((c) => void (c.data.api.entities[t.key] = e.target.value))} />
                <input className="input mono admin-filter" value={api.filters[t.key]} placeholder="Filtre OData facultatif, ex. Indicateur_annulation eq 0" onChange={(e) => update((c) => void (c.data.api.filters[t.key] = e.target.value))} />
              </Field>
            ))}
          </div>
          <div className="admin-sub">Options</div>
          <div className="admin-grid">
            <Field label="Taille de page ($first)">
              <input className="input" type="number" min={100} max={100000} value={api.pageSize} onChange={(e) => update((c) => void (c.data.api.pageSize = Number(e.target.value)))} />
            </Field>
            <Field label="En-tête d’authentification (facultatif)" hint="Visible dans le navigateur : ne jamais y mettre de secret. Préférer l’authentification SSO / EasyAuth.">
              <input className="input mono" value={api.authHeader} placeholder="ex. X-API-Key" onChange={(e) => update((c) => void (c.data.api.authHeader = e.target.value))} />
            </Field>
            <Field label="Valeur">
              <input className="input mono" value={api.authValue} onChange={(e) => update((c) => void (c.data.api.authValue = e.target.value))} />
            </Field>
          </div>
          <div className="admin-checks">
            <button type="button" className="btn btn-primary btn-sm" disabled={testing || !api.entities.patrimoine} onClick={testLoad}>
              {testing ? 'Chargement…' : 'Tester le chargement (cette session)'}
            </button>
            <span className="admin-hint">Le rapport de contrôle apparaît ci-dessous.</span>
          </div>
        </Card>
      )}

      <Card title="Données chargées dans cette session">
        <p className="admin-hint">
          Contrôle d’un fichier Excel ou résultat du test API. Pour publier la source aux utilisateurs : Prévisualiser puis publier site.json.
        </p>
        <div className="admin-datasource">
          <DataSourcePanel />
        </div>
      </Card>
    </>
  );
}

function FondsSection({ cfg, update }: Props) {
  return (
    <>
      {cfg.basemaps.map((b, i) => {
        const meta = CATALOG.basemaps.find((x) => x.id === b.id)?.meta as SourceMeta | undefined;
        return (
          <Card
            key={b.id}
            muted={!b.enabled}
            title={
              <span className="admin-title-row">
                <Switch checked={b.enabled} onChange={(v) => update((c) => void (c.basemaps[i].enabled = v))} />
                {b.label}
              </span>
            }
            right={
              <label className="admin-radio">
                <input type="radio" name="defaultBasemap" checked={cfg.defaultBasemap === b.id} disabled={!b.enabled} onChange={() => update((c) => void (c.defaultBasemap = b.id))} />
                Fond par défaut
              </label>
            }
          >
            <div className="admin-grid">
              <Field label="Libellé">
                <input className="input" value={b.label} onChange={(e) => update((c) => void (c.basemaps[i].label = e.target.value))} />
              </Field>
              {b.tiles.length > 0 && (
                <Field label="URL des tuiles ({z} {x} {y})" wide>
                  <div className="admin-inline">
                    <input className="input mono" value={b.tiles[0]} onChange={(e) => update((c) => void (c.basemaps[i].tiles = [e.target.value]))} />
                    <TestUrl url={b.tiles[0]} />
                  </div>
                </Field>
              )}
            </div>
            {meta && <details className="admin-meta"><summary>Fiche source</summary><MetaCard meta={meta} /></details>}
          </Card>
        );
      })}
    </>
  );
}

function CouchesSection({ cfg, update }: Props) {
  const groups = useMemo(() => [...new Set(CATALOG.layers.map((l) => l.group))], []);
  return (
    <>
      <CustomLayersBlock cfg={cfg} update={update} />
      {groups.map((g) => (
        <div key={g} className="admin-group">
          <h2 className="admin-group-title">{GROUP_LABELS[g] ?? g}</h2>
          {cfg.layers
            .map((l, i) => ({ l, i, cat: CATALOG.layers.find((x) => x.id === l.id)! }))
            .filter(({ cat }) => cat?.group === g)
            .map(({ l, i, cat }) => (
              <LayerCard key={l.id} layer={l} available={cat.controls as Control[]} meta={cat.meta as SourceMeta} geometry={cat.geometry} set={(fn) => update((c) => fn(c.layers[i]))} />
            ))}
        </div>
      ))}
    </>
  );
}

function LayerCard({ layer: l, available, meta, geometry, set }: { layer: LayerSetting; available: Control[]; meta: SourceMeta; geometry: string; set: (fn: (l: LayerSetting) => void) => void }) {
  const has = (c: Control) => available.includes(c);
  return (
    <Card
      muted={!l.enabled}
      title={
        <span className="admin-title-row">
          <Switch checked={l.enabled} onChange={(v) => set((x) => void (x.enabled = v))} />
          {l.label}
          <span className="badge badge-muted">{l.sourceType === 'geojson' ? 'Fichier / API GeoJSON' : l.sourceType === 'tuiles' ? 'Tuiles WMTS / WMS' : 'Service intégré'}</span>
        </span>
      }
      right={<Switch checked={l.visible} onChange={(v) => set((x) => void (x.visible = v))} label="Affichée au démarrage" />}
    >
      {l.enabled && (
        <>
          <div className="admin-grid">
            <Field label="Libellé affiché">
              <input className="input" value={l.label} onChange={(e) => set((x) => void (x.label = e.target.value))} />
            </Field>
            <Field label="Millésime / date de mise à jour">
              <input className="input" value={l.millesime} onChange={(e) => set((x) => void (x.millesime = e.target.value))} />
            </Field>
            {l.sourceType !== 'service' ? (
              <Field
                label={l.sourceType === 'geojson' ? 'Source GeoJSON (chemin ou URL d’API)' : 'URL des tuiles'}
                hint={l.sourceType === 'geojson' ? 'Ex. referentiels/qpv.geojson ou https://…/wfs?…&outputFormat=application/json. Lambert-93 accepté.' : 'Variables : {z} {x} {y} (WMTS) ou {bbox-epsg-3857} (WMS).'}
                wide
              >
                <div className="admin-inline">
                  <input className="input mono" value={l.url} onChange={(e) => set((x) => void (x.url = e.target.value))} />
                  <TestUrl url={l.url} />
                </div>
              </Field>
            ) : (
              <p className="admin-hint is-wide">Source calculée ou issue des services configurés dans « Services & API ».</p>
            )}
          </div>

          <div className="admin-sub">Style par défaut</div>
          <div className="admin-grid admin-style">
            {has('color') && (
              <Field label="Couleur">
                <input type="color" className="color-input" value={l.color} onChange={(e) => set((x) => void (x.color = e.target.value))} />
              </Field>
            )}
            <Field label={`Opacité : ${Math.round(l.opacity * 100)} %`}>
              <input type="range" min={0} max={1} step={0.05} value={l.opacity} onChange={(e) => set((x) => void (x.opacity = Number(e.target.value)))} />
            </Field>
            {(has('width') || geometry === 'line' || geometry === 'fill') && (
              <Field label={`Épaisseur : ${l.width} px`}>
                <input type="range" min={0.25} max={5} step={0.25} value={l.width} onChange={(e) => set((x) => void (x.width = Number(e.target.value)))} />
              </Field>
            )}
            {has('size') && (
              <Field label={`Taille : ${l.size} px`}>
                <input type="range" min={2} max={10} step={0.5} value={l.size} onChange={(e) => set((x) => void (x.size = Number(e.target.value)))} />
              </Field>
            )}
            {has('labels') && <Switch checked={l.labels} onChange={(v) => set((x) => void (x.labels = v))} label="Libellés affichés" />}
          </div>

          <div className="admin-sub">Réglages laissés à l’utilisateur</div>
          <div className="admin-checks">
            {available.map((c) => (
              <label key={c} className="chip-toggle">
                <input
                  type="checkbox"
                  checked={l.controls.includes(c)}
                  onChange={(e) => set((x) => void (x.controls = e.target.checked ? [...x.controls, c] : x.controls.filter((k) => k !== c)))}
                />
                {CONTROL_LABELS[c]}
              </label>
            ))}
            {!l.controls.length && <span className="admin-hint">Aucun : l’utilisateur peut seulement afficher / masquer.</span>}
          </div>
          <details className="admin-meta"><summary>Fiche source</summary><MetaCard meta={meta} /></details>
        </>
      )}
    </Card>
  );
}

function InterfaceSection({ cfg, update }: Props) {
  return (
    <>
      <Card title="Onglets du panneau latéral">
        <div className="admin-checks">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
            <Switch key={t} checked={cfg.ui.tabs[t]} onChange={(v) => update((c) => void (c.ui.tabs[t] = v))} label={TAB_LABELS[t]} />
          ))}
        </div>
      </Card>
      <Card title="Filtres proposés">
        <div className="admin-checks">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((f) => (
            <Switch key={f} checked={cfg.ui.filters[f]} onChange={(v) => update((c) => void (c.ui.filters[f] = v))} label={FILTER_LABELS[f]} />
          ))}
        </div>
      </Card>
      <Card title="Critères de coloration du patrimoine">
        <div className="admin-checks">
          {COLOR_BY_OPTIONS.map((o) => (
            <label key={o.key} className="chip-toggle">
              <input
                type="checkbox"
                checked={cfg.ui.colorBy.includes(o.key)}
                onChange={(e) => update((c) => void (c.ui.colorBy = e.target.checked ? [...c.ui.colorBy, o.key] : c.ui.colorBy.filter((k) => k !== o.key)))}
              />
              {o.label}
            </label>
          ))}
        </div>
        <Field label="Critère par défaut">
          <select className="select" value={cfg.ui.defaultColorBy} onChange={(e) => update((c) => void (c.ui.defaultColorBy = e.target.value as typeof c.ui.defaultColorBy))}>
            {COLOR_BY_OPTIONS.filter((o) => cfg.ui.colorBy.includes(o.key)).map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
      </Card>
      <Card title="Exports et recherche">
        <div className="admin-checks">
          <Switch checked={cfg.ui.exportExcel} onChange={(v) => update((c) => void (c.ui.exportExcel = v))} label="Export Excel" />
          <Switch checked={cfg.ui.exportImage} onChange={(v) => update((c) => void (c.ui.exportImage = v))} label="Export image" />
          <Switch checked={cfg.ui.exportTemplates} onChange={(v) => update((c) => void (c.ui.exportTemplates = v))} label="Exports types" />
          <Switch checked={cfg.ui.searchBan} onChange={(v) => update((c) => void (c.ui.searchBan = v))} label="Recherche d’adresses BAN" />
        </div>
      </Card>
    </>
  );
}

function ServicesSection({ cfg, update }: Props) {
  const rows: { key: keyof SiteConfig['services']; label: string; hint: string; test?: (u: string) => string }[] = [
    { key: 'geoApi', label: 'API Découpage administratif', hint: 'Communes, EPCI et contours. Défaut : https://geo.api.gouv.fr', test: (u) => `${u}/communes?nom=Rennes&fields=nom,codeEpci` },
    { key: 'geocodage', label: 'Géocodage BAN', hint: 'Recherche d’adresses. Défaut : https://data.geopf.fr/geocodage', test: (u) => `${u}/search?q=rennes&limit=1` },
    { key: 'zonageApl', label: 'Zonage APL (CSV)', hint: 'Fichier ou API (ex. Tabular API data.gouv) : colonnes code INSEE + zone.' },
    { key: 'zonagePinel', label: 'Zonage ABC / Pinel (CSV)', hint: 'Fichier ou API : colonnes code INSEE + zone.' },
  ];
  return (
    <Card title="Adresses des services">
      <div className="admin-grid">
        {rows.map((r) => (
          <Field key={r.key} label={r.label} hint={r.hint} wide>
            <div className="admin-inline">
              <input className="input mono" value={cfg.services[r.key]} onChange={(e) => update((c) => void (c.services[r.key] = e.target.value))} />
              <TestUrl url={r.test ? r.test(cfg.services[r.key]) : cfg.services[r.key]} />
            </div>
          </Field>
        ))}
      </div>
    </Card>
  );
}

function PublicationSection({ cfg, setCfg }: { cfg: SiteConfig; setCfg: (c: SiteConfig) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string>();
  const onFile = async (f?: File) => {
    if (!f) return;
    try {
      setCfg(mergeConfig(JSON.parse(await f.text())));
      setMsg(`« ${f.name} » chargé : vérifiez puis prévisualisez.`);
    } catch {
      setMsg('Fichier JSON invalide.');
    }
  };
  return (
    <>
      <Card title="Comment publier">
        <ol className="admin-steps">
          <li><strong>Prévisualiser</strong> : la configuration est enregistrée comme brouillon dans <em>ce navigateur uniquement</em>, et la carte s’ouvre avec ces réglages.</li>
          <li><strong>Télécharger site.json</strong> quand le résultat convient.</li>
          <li>Déposer le fichier dans <code>public/config/site.json</code> (ou <code>app-statique/config/site.json</code>) puis committer : tous les utilisateurs reçoivent la configuration au prochain chargement.</li>
        </ol>
        <p className="admin-hint">Fichier lu au démarrage : <code>{SITE_JSON_URL}</code></p>
      </Card>
      <Card title="Actions">
        <div className="admin-checks">
          <button type="button" className="btn btn-primary" onClick={() => downloadJson(cfg)}><Icon name="download" size={16} /> Télécharger site.json</button>
          <button type="button" className="btn" onClick={() => input.current?.click()}><Icon name="upload" size={16} /> Charger un site.json</button>
          <input ref={input} type="file" accept=".json,application/json" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button type="button" className="btn" onClick={() => { clearDraft(); setCfg(structuredClone(publishedConfig)); setMsg('Brouillon supprimé : configuration publiée rechargée (prévisualisez pour l’appliquer).'); }}>
            <Icon name="reset" size={16} /> Revenir à la configuration publiée
          </button>
          <button type="button" className="btn" onClick={() => { setCfg(structuredClone(DEFAULT_SITE_CONFIG)); setMsg('Valeurs d’usine chargées.'); }}>
            Valeurs d’usine
          </button>
        </div>
        {msg && <p className="admin-hint">{msg}</p>}
      </Card>
      <Card title="Sécurité">
        <p className="admin-hint">
          Le site étant statique, cette page ne modifie rien sur le serveur : seul le dépôt du fichier site.json publie la configuration.
          L’accès à la page (#/admin) n’est pas protégé par l’application ; à restreindre par le serveur web ou le SSO de l’intranet lors du déploiement.
        </p>
      </Card>
    </>
  );
}

/* ------------------------------ Exports types ------------------------------ */

const FORMATS: { label: string; w: number; h: number }[] = [
  { label: 'A4 paysage', w: 1600, h: 1131 },
  { label: 'A4 portrait', w: 1131, h: 1600 },
  { label: '16:9 (diaporama)', w: 1920, h: 1080 },
  { label: 'Carré', w: 1200, h: 1200 },
];
const REPRESENTATIONS = [
  ['auto', 'Automatique (selon le zoom)'],
  ['commune', 'Agrégats par commune'],
  ['residence', 'Résidences'],
  ['batiment', 'Bâtiments'],
  ['logement', 'Logements'],
] as const;

function ExportsSection({ cfg, update }: Props) {
  const add = (from?: ExportTemplate) =>
    update((c) => {
      const base = from ?? DEFAULT_SITE_CONFIG.exportTemplates[0] ?? c.exportTemplates[0];
      c.exportTemplates.push({ ...structuredClone(base), id: `modele-${Date.now().toString(36)}`, name: from ? `${from.name} (copie)` : 'Nouveau modèle' });
    });
  return (
    <>
      {cfg.exportTemplates.map((t, i) => (
        <TemplateCard
          key={t.id}
          t={t}
          cfg={cfg}
          set={(fn) => update((c) => fn(c.exportTemplates[i]))}
          onDuplicate={() => add(t)}
          onDelete={() => update((c) => void c.exportTemplates.splice(i, 1))}
        />
      ))}
      <div>
        <button type="button" className="btn btn-primary" onClick={() => add()}>+ Ajouter un modèle</button>
      </div>
    </>
  );
}

function TemplateCard({ t, cfg, set, onDuplicate, onDelete }: { t: ExportTemplate; cfg: SiteConfig; set: (fn: (t: ExportTemplate) => void) => void; onDuplicate: () => void; onDelete: () => void }) {
  const fmt = FORMATS.find((f) => f.w === t.width && f.h === t.height)?.label ?? 'Personnalisé';
  const toggle = <T,>(arr: T[], v: T, on: boolean) => (on ? [...arr, v] : arr.filter((x) => x !== v));
  return (
    <Card
      title={t.name}
      right={
        <span className="admin-checks">
          <button type="button" className="btn btn-sm" onClick={onDuplicate}>Dupliquer</button>
          <button type="button" className="btn btn-sm" onClick={onDelete}>Supprimer</button>
        </span>
      }
    >
      <div className="admin-grid">
        <Field label="Nom"><input className="input" value={t.name} onChange={(e) => set((x) => void (x.name = e.target.value))} /></Field>
        <Field label="Titre de l’image" hint="{zone} = nom de la zone choisie"><input className="input" value={t.title} onChange={(e) => set((x) => void (x.title = e.target.value))} /></Field>
        <Field label="Description" wide><input className="input" value={t.description} onChange={(e) => set((x) => void (x.description = e.target.value))} /></Field>
      </div>

      <div className="admin-sub">Zones que l’utilisateur peut choisir</div>
      <div className="admin-checks">
        {(Object.keys(ZONE_LABELS) as ZoneType[]).map((z) => (
          <label key={z} className="chip-toggle">
            <input type="checkbox" checked={t.zoneTypes.includes(z)} onChange={(e) => set((x) => void (x.zoneTypes = toggle(x.zoneTypes, z, e.target.checked)))} />
            {ZONE_LABELS[z]}
          </label>
        ))}
        <Switch checked={t.restrictToZone} onChange={(v) => set((x) => void (x.restrictToZone = v))} label="Afficher uniquement le patrimoine de la zone" />
      </div>

      <div className="admin-sub">Contenu de la carte</div>
      <div className="admin-grid">
        <Field label="Fond de carte">
          <select className="select" value={t.basemap} onChange={(e) => set((x) => void (x.basemap = e.target.value))}>
            {cfg.basemaps.filter((b) => b.enabled).map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </Field>
        <Field label="Représentation du patrimoine">
          <select className="select" value={t.representation} onChange={(e) => set((x) => void (x.representation = e.target.value as ExportTemplate['representation']))}>
            {REPRESENTATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Couleur par">
          <select className="select" value={t.colorBy} onChange={(e) => set((x) => void (x.colorBy = e.target.value as ExportTemplate['colorBy']))}>
            {COLOR_BY_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </Field>
        <Field label="Taille des points">
          <select className="select" value={t.sizeMode} onChange={(e) => set((x) => void (x.sizeMode = e.target.value as ExportTemplate['sizeMode']))}>
            <option value="logements">Nombre de logements</option>
            <option value="fixe">Fixe</option>
          </select>
        </Field>
        <Field label={`Taille des éléments : ×${t.sizeScale.toFixed(1)}`}>
          <input type="range" min={0.5} max={3} step={0.1} value={t.sizeScale} onChange={(e) => set((x) => void (x.sizeScale = Number(e.target.value)))} />
        </Field>
        <Switch checked={t.labels} onChange={(v) => set((x) => void (x.labels = v))} label="Libellés du patrimoine" />
      </div>
      <div className="admin-checks">
        {[...cfg.layers, ...cfg.customLayers].filter((l) => l.enabled).map((l) => (
          <label key={l.id} className="chip-toggle">
            <input type="checkbox" checked={t.layers.includes(l.id)} onChange={(e) => set((x) => void (x.layers = toggle(x.layers, l.id, e.target.checked)))} />
            {l.label}
          </label>
        ))}
      </div>

      <div className="admin-sub">Cadrage et format</div>
      <div className="admin-grid">
        <Field label="Format">
          <select className="select" value={fmt} onChange={(e) => { const f = FORMATS.find((x) => x.label === e.target.value); if (f) set((x) => { x.width = f.w; x.height = f.h; }); }}>
            {FORMATS.map((f) => <option key={f.label}>{f.label}</option>)}
            <option>Personnalisé</option>
          </select>
        </Field>
        <Field label="Largeur × hauteur (px)">
          <div className="admin-inline">
            <input className="input" type="number" min={400} max={4000} value={t.width} onChange={(e) => set((x) => void (x.width = Number(e.target.value)))} />
            <input className="input" type="number" min={400} max={4000} value={t.height} onChange={(e) => set((x) => void (x.height = Number(e.target.value)))} />
          </div>
        </Field>
        <Field label="Résolution">
          <select className="select" value={t.pixelRatio} onChange={(e) => set((x) => void (x.pixelRatio = Number(e.target.value)))}>
            <option value={1}>Écran (×1)</option>
            <option value={2}>Impression (×2)</option>
            <option value={3}>Haute définition (×3)</option>
          </select>
        </Field>
        <Field label={`Marge autour de la zone : ${t.padding} px`}>
          <input type="range" min={0} max={300} step={10} value={t.padding} onChange={(e) => set((x) => void (x.padding = Number(e.target.value)))} />
        </Field>
        <Field label={`Zoom maximal : ${t.maxZoom}`} hint="Limite le zoom sur les petites zones (une résidence isolée).">
          <input type="range" min={8} max={19} step={0.5} value={t.maxZoom} onChange={(e) => set((x) => void (x.maxZoom = Number(e.target.value)))} />
        </Field>
        <Field label="Résultat proposé par défaut">
          <select className="select" value={t.output} onChange={(e) => set((x) => void (x.output = e.target.value as TemplateOutput))}>
            <option value="carte">Carte dynamique</option>
            <option value="image">Image</option>
            <option value="les-deux">Carte + image</option>
          </select>
        </Field>
      </div>
    </Card>
  );
}

/* ------------------------------ Couches créées ------------------------------ */

const TYPE_LABELS: Record<CustomLayer['type'], string> = { wmts: 'WMTS', wms: 'WMS', xyz: 'Tuiles XYZ', geojson: 'GeoJSON (fichier / API)' };

function newCustomLayer(): CustomLayer {
  return {
    id: `perso-${Date.now().toString(36)}`,
    label: 'Nouvelle couche',
    group: 'referentiels',
    type: 'wmts',
    url: '',
    capabilitiesUrl: '',
    geometry: 'fill',
    labelProp: 'nom',
    enabled: true,
    visible: false,
    color: '#1971c2',
    opacity: 0.7,
    width: 1,
    size: 4,
    labels: false,
    minzoom: 0,
    controls: ['opacity'],
    source: '',
    millesime: '',
    attribution: '',
  };
}

function CustomLayersBlock({ cfg, update }: Props) {
  return (
    <div className="admin-group">
      <h2 className="admin-group-title">Couches créées</h2>
      {cfg.customLayers.map((c, i) => (
        <CustomLayerCard
          key={c.id}
          layer={c}
          set={(fn) => update((x) => fn(x.customLayers[i]))}
          onDelete={() => update((x) => void x.customLayers.splice(i, 1))}
        />
      ))}
      <div>
        <button type="button" className="btn btn-primary" onClick={() => update((x) => void x.customLayers.push(newCustomLayer()))}>
          + Créer une couche
        </button>
      </div>
    </div>
  );
}

function CustomLayerCard({ layer: c, set, onDelete }: { layer: CustomLayer; set: (fn: (l: CustomLayer) => void) => void; onDelete: () => void }) {
  const [caps, setCaps] = useState<{ status: 'idle' | 'loading' | 'ok' | 'ko'; layers?: OgcLayer[]; msg?: string }>({ status: 'idle' });
  const [q, setQ] = useState('');
  const ogc = c.type === 'wmts' || c.type === 'wms';

  const readCaps = async () => {
    const { url, changed } = modernizeIgnUrl(c.capabilitiesUrl ?? '');
    if (changed) set((x) => void (x.capabilitiesUrl = url));
    setCaps({ status: 'loading' });
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setCaps({ status: 'ko', msg: `Le service répond « HTTP ${res.status} » : adresse incorrecte ou service indisponible.` });
        return;
      }
      const xml = await res.text();
      // Type détecté d'après le document (évite l'erreur « WMTS » choisi pour une adresse WMS et inversement).
      const isWmts = /<(\w+:)?Capabilities[\s>]/.test(xml) && /wmts/i.test(xml.slice(0, 2000));
      const detected: 'wmts' | 'wms' = isWmts ? 'wmts' : /WMS_Capabilities|WMT_MS_Capabilities/.test(xml.slice(0, 3000)) ? 'wms' : c.type === 'wms' ? 'wms' : 'wmts';
      if (detected !== c.type) set((x) => void (x.type = detected));
      const layers = detected === 'wmts' ? parseWmts(xml, url) : parseWms(xml, url);
      setCaps({
        status: layers.length ? 'ok' : 'ko',
        layers,
        msg: layers.length
          ? `${changed ? 'Ancienne adresse wxs.ign.fr remplacée par la Géoplateforme. ' : ''}${detected !== c.type ? `Type corrigé en ${detected.toUpperCase()}. ` : ''}${layers.length} couche(s) trouvée(s).`
          : describeResponse(xml),
      });
    } catch {
      setCaps({ status: 'ko', msg: 'GetCapabilities inaccessible depuis le navigateur (URL, réseau ou CORS).' });
    }
  };
  const pick = (l: OgcLayer) =>
    set((x) => {
      x.url = l.url;
      if (x.label === 'Nouvelle couche') x.label = l.title;
      x.source = `${TYPE_LABELS[x.type]} — ${l.id}`;
    });
  const list = (caps.layers ?? []).filter((l) => !q || `${l.title} ${l.id}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60);

  return (
    <Card
      muted={!c.enabled}
      title={
        <span className="admin-title-row">
          <Switch checked={c.enabled} onChange={(v) => set((x) => void (x.enabled = v))} />
          {c.label}
          <span className="badge badge-muted">{TYPE_LABELS[c.type]}</span>
        </span>
      }
      right={
        <span className="admin-checks">
          <Switch checked={c.visible} onChange={(v) => set((x) => void (x.visible = v))} label="Affichée au démarrage" />
          <button type="button" className="btn btn-sm" onClick={onDelete}>Supprimer</button>
        </span>
      }
    >
      <div className="admin-grid">
        <Field label="Type de source">
          <select className="select" value={c.type} onChange={(e) => set((x) => { x.type = e.target.value as CustomLayer['type']; x.url = ''; })}>
            {(Object.keys(TYPE_LABELS) as CustomLayer['type'][]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </Field>
        <Field label="Libellé affiché">
          <input className="input" value={c.label} onChange={(e) => set((x) => void (x.label = e.target.value))} />
        </Field>
        <Field label="Rubrique">
          <select className="select" value={c.group} onChange={(e) => set((x) => void (x.group = e.target.value as CustomLayer['group']))}>
            <option value="referentiels">Référentiels</option>
            <option value="limites">Limites</option>
            <option value="zonages">Zonages</option>
          </select>
        </Field>

        {ogc && (
          <Field label="Adresse GetCapabilities" hint="Ex. https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities" wide>
            <div className="admin-inline">
              <input className="input mono" value={c.capabilitiesUrl ?? ''} onChange={(e) => set((x) => void (x.capabilitiesUrl = e.target.value))} />
              <button type="button" className="btn btn-sm" disabled={!c.capabilitiesUrl || caps.status === 'loading'} onClick={readCaps}>
                {caps.status === 'loading' ? 'Lecture…' : 'Lister les couches'}
              </button>
            </div>
          </Field>
        )}
        {ogc && caps.msg && <p className={`admin-hint is-wide ${caps.status === 'ko' ? 'admin-ko' : ''}`}>{caps.msg}</p>}
        {ogc && caps.layers && caps.layers.length > 0 && (
          <div className="is-wide">
            <input className="input" placeholder="Filtrer les couches…" value={q} onChange={(e) => setQ(e.target.value)} />
            <ul className="tpl-zones admin-caps">
              {list.map((l) => (
                <li key={l.id}>
                  <button type="button" disabled={!l.url} className={c.url === l.url ? 'is-selected' : ''} onClick={() => pick(l)} title={l.warning ?? l.id}>
                    <span className="grow">{l.title}</span>
                    <span className="muted small mono">{l.warning ? '⚠ non Web Mercator' : l.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Field
          label={c.type === 'geojson' ? 'URL GeoJSON (fichier ou API)' : 'Modèle d’URL des tuiles'}
          hint={c.type === 'xyz' ? 'Ex. https://…/{z}/{x}/{y}.png' : c.type === 'geojson' ? 'Chemin relatif (referentiels/…) ou URL ; Lambert-93 accepté.' : 'Rempli automatiquement en choisissant une couche ci-dessus.'}
          wide
        >
          <div className="admin-inline">
            <input className="input mono" value={c.url} onChange={(e) => set((x) => void (x.url = e.target.value))} />
            <TestUrl url={c.url} />
          </div>
        </Field>

        {c.type === 'geojson' && (
          <>
            <Field label="Représentation">
              <select className="select" value={c.geometry} onChange={(e) => set((x) => void (x.geometry = e.target.value as CustomLayer['geometry']))}>
                <option value="fill">Surfaces</option>
                <option value="line">Lignes / contours</option>
                <option value="circle">Points</option>
              </select>
            </Field>
            <Field label="Propriété du libellé"><input className="input mono" value={c.labelProp} onChange={(e) => set((x) => void (x.labelProp = e.target.value))} /></Field>
          </>
        )}
        <Field label="Millésime"><input className="input" value={c.millesime} onChange={(e) => set((x) => void (x.millesime = e.target.value))} /></Field>
        <Field label="Attribution / source"><input className="input" value={c.attribution} placeholder="ex. © IGN" onChange={(e) => set((x) => void (x.attribution = e.target.value))} /></Field>
        <Field label={`Zoom minimal d’affichage : ${c.minzoom}`}>
          <input type="range" min={0} max={18} step={1} value={c.minzoom} onChange={(e) => set((x) => void (x.minzoom = Number(e.target.value)))} />
        </Field>
      </div>

      <div className="admin-sub">Style par défaut et réglages laissés à l’utilisateur</div>
      <div className="admin-grid admin-style">
        {c.type === 'geojson' && (
          <Field label="Couleur"><input type="color" className="color-input" value={c.color} onChange={(e) => set((x) => void (x.color = e.target.value))} /></Field>
        )}
        <Field label={`Opacité : ${Math.round(c.opacity * 100)} %`}>
          <input type="range" min={0} max={1} step={0.05} value={c.opacity} onChange={(e) => set((x) => void (x.opacity = Number(e.target.value)))} />
        </Field>
        {c.type === 'geojson' && c.geometry !== 'circle' && (
          <Field label={`Épaisseur : ${c.width} px`}>
            <input type="range" min={0.25} max={5} step={0.25} value={c.width} onChange={(e) => set((x) => void (x.width = Number(e.target.value)))} />
          </Field>
        )}
        {c.type === 'geojson' && c.geometry === 'circle' && (
          <Field label={`Taille : ${c.size} px`}>
            <input type="range" min={2} max={10} step={0.5} value={c.size} onChange={(e) => set((x) => void (x.size = Number(e.target.value)))} />
          </Field>
        )}
        {c.type === 'geojson' && <Switch checked={c.labels} onChange={(v) => set((x) => void (x.labels = v))} label="Libellés affichés" />}
      </div>
      <div className="admin-checks">
        {(c.type === 'geojson' ? (['opacity', 'color', c.geometry === 'circle' ? 'size' : 'width', 'labels'] as Control[]) : (['opacity'] as Control[])).map((k) => (
          <label key={k} className="chip-toggle">
            <input type="checkbox" checked={c.controls.includes(k)} onChange={(e) => set((x) => void (x.controls = e.target.checked ? [...x.controls, k] : x.controls.filter((y) => y !== k)))} />
            {CONTROL_LABELS[k]}
          </label>
        ))}
      </div>
    </Card>
  );
}

/* ------------------------------ Tableaux de bord ------------------------------ */

const VARIABLES: [string, string][] = [
  ['{code}', 'code de l’objet (résidence, bâtiment, logement, INSEE pour une commune…)'],
  ['{nom}', 'nom / libellé'],
  ['{id}', 'identifiant technique (ID_patrimoine, ID_lot…)'],
  ['{insee}', 'code INSEE de la commune'],
  ['{commune}', 'nom de la commune'],
  ['{epci}', 'SIREN de l’EPCI'],
  ['{epciNom}', 'nom de l’EPCI'],
  ['{departement}', 'code département'],
  ['{agence}', 'code agence'],
  ['{agenceNom}', 'nom de l’agence'],
  ['{rpls}', 'identifiant RPLS (logement)'],
];

/** Premier objet de chaque type dans les données chargées, pour l'aperçu. */
function sampleRef(kind: string): EntityRef | undefined {
  const ix = useAppStore.getState().index;
  if (!ix) return undefined;
  const first = <T,>(m: Map<string, T>) => m.keys().next().value as string | undefined;
  const r = [...ix.residences.values()][0];
  const id =
    kind === 'residence' ? first(ix.residences)
    : kind === 'batiment' ? first(ix.batiments)
    : kind === 'logement' ? first(ix.logements)
    : kind === 'agence' ? first(ix.agences)
    : kind === 'commune' ? r?.communeInsee
    : kind === 'epci' ? ix.epciOf(r?.communeInsee).code
    : undefined;
  return id ? { kind: kind as EntityRef['kind'], id } : undefined;
}

function TableauxSection({ cfg, update }: Props) {
  const [preview, setPreview] = useState<string>();
  useAppStore((s) => s.index); // ré-affichage quand les données sont chargées (exemples)
  return (
    <>
      <Card title="Principe">
        <p className="admin-hint">
          Pour chaque type d’objet, indiquez l’adresse de la page à ouvrir. Les variables entre accolades sont remplacées par les
          valeurs de l’objet cliqué : on peut ainsi ouvrir un rapport Power BI déjà filtré. Exemple (filtre d’URL Power BI) :
        </p>
        <code className="admin-code">{'https://app.powerbi.com/reportEmbed?reportId=…&autoAuth=true&ctid=…&filter=Patrimoine/Code_niveau_patrimoine_1 eq \'{code}\''}</code>
        <details className="admin-meta">
          <summary>Variables disponibles</summary>
          <dl className="meta-card">
            {VARIABLES.map(([k, d]) => <div key={k}><dt className="mono">{k}</dt><dd>{d}</dd></div>)}
          </dl>
        </details>
      </Card>
      {cfg.embeds.map((e, i) => {
        const ref = sampleRef(e.kind);
        const ix = useAppStore.getState().index;
        const example = ref && ix && e.url ? buildEmbedUrl(e.url, entityValues(ix, ref)) : '';
        return (
          <Card
            key={e.kind}
            muted={!e.enabled}
            title={
              <span className="admin-title-row">
                <Switch checked={e.enabled} onChange={(v) => update((c) => void (c.embeds[i].enabled = v))} />
                {EMBED_KIND_LABELS[e.kind]}
              </span>
            }
          >
            {e.enabled && (
              <div className="admin-grid">
                <Field label="Texte du bouton">
                  <input className="input" value={e.label} onChange={(ev) => update((c) => void (c.embeds[i].label = ev.target.value))} />
                </Field>
                <Field label="Adresse de la page (avec variables)" wide>
                  <input className="input mono" value={e.url} placeholder="https://app.powerbi.com/reportEmbed?…&filter=Table/Champ eq '{code}'" onChange={(ev) => update((c) => void (c.embeds[i].url = ev.target.value))} />
                </Field>
                {example && (
                  <Field label="Exemple avec un objet des données chargées" wide>
                    <div className="admin-inline">
                      <input className="input mono" readOnly value={example} />
                      <button type="button" className="btn btn-sm" onClick={() => setPreview(example)}>Aperçu</button>
                    </div>
                  </Field>
                )}
              </div>
            )}
          </Card>
        );
      })}
      {preview && (
        <Card title="Aperçu" right={<button type="button" className="btn btn-sm" onClick={() => setPreview(undefined)}>Fermer</button>}>
          <iframe className="admin-preview" src={preview} title="Aperçu du tableau de bord" />
          <p className="admin-hint">Page vide ou refusée ? Le site cible interdit peut-être l’intégration (en-tête X-Frame-Options / CSP), ou demande une connexion.</p>
        </Card>
      )}
    </>
  );
}
