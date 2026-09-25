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
} from '../config/siteConfig';
import type { SourceMeta } from '../config/layers.config';
import { COLOR_BY_OPTIONS } from '../domain/symbology';
import { DataSourcePanel } from '../ui/DataSourcePanel';
import { Icon } from '../ui/components/Icon';
import { MetaCard } from '../ui/panels/LayersPanel';
import './admin.css';

type Section = 'donnees' | 'fonds' | 'couches' | 'exports' | 'interface' | 'services' | 'publication';
const SECTIONS: { id: Section; label: string; icon: string; help: string }[] = [
  { id: 'donnees', label: 'Données patrimoine', icon: 'database', help: 'Source Excel publiée, import et contrôle d’un fichier.' },
  { id: 'fonds', label: 'Fonds de carte', icon: 'image', help: 'Fonds proposés aux utilisateurs et fond par défaut.' },
  { id: 'couches', label: 'Couches', icon: 'layers', help: 'Sources (fichiers, API), style par défaut et réglages laissés aux utilisateurs.' },
  { id: 'exports', label: 'Exports types', icon: 'image', help: 'Modèles de cartes et d’images proposés aux utilisateurs : zone, couches, symbologie, format, cadrage.' },
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
  return (
    <>
      <Card title="Source publiée pour les utilisateurs">
        <div className="admin-grid">
          <Field label="Fichier Excel (URL ou chemin)" hint="Chemin relatif à l’application (ex. demo/patrimoine.xlsx) ou URL d’une API renvoyant un .xlsx." wide>
            <div className="admin-inline">
              <input className="input" value={cfg.data.excelUrl} onChange={(e) => update((c) => void (c.data.excelUrl = e.target.value))} />
              <TestUrl url={cfg.data.excelUrl} />
            </div>
          </Field>
          <Field label="Libellé affiché" wide>
            <input className="input" value={cfg.data.label} onChange={(e) => update((c) => void (c.data.label = e.target.value))} />
          </Field>
          <Switch checked={cfg.data.synthetic} onChange={(v) => update((c) => void (c.data.synthetic = v))} label="Données de démonstration (affiche le bandeau « synthétique »)" />
        </div>
      </Card>
      <Card title="Contrôler un fichier / charger pour cette session">
        <p className="admin-hint">
          Le fichier est lu dans ce navigateur uniquement. Pour le publier à tous, déposez-le à côté de l’application et renseignez son chemin ci-dessus.
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
    {
      key: 'googleMapsKey',
      label: 'Clé API Google (Map Tiles API) — fond Google 3D',
      hint: 'Clé navigateur restreinte au domaine de l’application dans la console Google Cloud (facturation activée). Vide = fond Google 3D masqué.',
      test: (k) => `https://tile.googleapis.com/v1/3dtiles/root.json?key=${k}`,
    },
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
            {cfg.basemaps.filter((b) => b.enabled && b.id !== 'google3d').map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
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
        {cfg.layers.filter((l) => l.enabled).map((l) => (
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
