import { useState } from 'react';
import { basemaps, referenceLayers, type LayerGroup, type ReferenceLayerDef, type SourceMeta } from '../../config/layers.config';
import { useAppStore } from '../../store/useAppStore';
import { Icon } from '../components/Icon';
import { ColorField, Section, Slider, StatusBadge, Toggle } from '../components/controls';

const GROUPS: { id: LayerGroup; label: string }[] = [
  { id: 'limites', label: 'Limites' },
  { id: 'zonages', label: 'Zonages' },
  { id: 'referentiels', label: 'Référentiels' },
];

export function LayersPanel() {
  const basemap = useAppStore((s) => s.basemap);
  const set = useAppStore((s) => s.set);
  const layerOrder = useAppStore((s) => s.layerOrder);
  return (
    <div className="panel-content">
      <Section title="Fond de carte">
        <div className="basemaps">
          {basemaps.map((b) => (
            <button key={b.id} type="button" className={`basemap-card ${basemap === b.id ? 'is-active' : ''}`} onClick={() => set({ basemap: b.id })} aria-pressed={basemap === b.id} title={b.meta.source}>
              <span className={`basemap-thumb thumb-${b.id}`} aria-hidden="true" />
              <span>{b.label}</span>
            </button>
          ))}
        </div>
      </Section>
      {GROUPS.map((g) => (
        <Section key={g.id} title={g.label}>
          {layerOrder
            .map((id) => referenceLayers.find((l) => l.id === id)!)
            .filter((l) => l && l.group === g.id)
            .map((l) => <LayerRow key={l.id} def={l} />)}
        </Section>
      ))}
      <p className="help pad">L’ordre d’affichage se règle avec les flèches ↑ ↓ de chaque couche (la plus haute est dessinée au-dessus). Le patrimoine reste toujours au premier plan.</p>
    </div>
  );
}

function LayerRow({ def }: { def: ReferenceLayerDef }) {
  const st = useAppStore((s) => s.layers[def.id]);
  const setLayer = useAppStore((s) => s.setLayer);
  const move = useAppStore((s) => s.moveLayer);
  const zoom = useAppStore((s) => s.zoom);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState(false);
  const tooFar = st.visible && def.minzoom !== undefined && zoom < def.minzoom;
  return (
    <div className={`layer-row ${st.visible ? 'is-on' : ''}`}>
      <div className="layer-head">
        <Toggle checked={st.visible} onChange={(v) => setLayer(def.id, { visible: v })} label={def.label} />
        <StatusBadge status={st.visible ? st.status : 'idle'} message={st.message} />
        <div className="layer-tools">
          <button type="button" className="icon-btn" aria-label={`Informations sur la source : ${def.label}`} title="Source et millésime" onClick={() => setInfo(!info)}>
            <Icon name="info" size={15} />
          </button>
          <button type="button" className="icon-btn" aria-label={`Réglages : ${def.label}`} aria-expanded={open} title="Réglages" onClick={() => setOpen(!open)}>
            <Icon name="sliders" size={15} />
          </button>
        </div>
      </div>
      {st.visible && st.message && (st.status === 'error' || st.status === 'unavailable') && <p className="layer-msg">{st.message}</p>}
      {tooFar && <p className="layer-msg muted">Visible à partir d’un zoom plus rapproché.</p>}
      {info && <MetaCard meta={def.meta} />}
      {open && (
        <div className="layer-settings">
          {def.controls.includes('opacity') && <Slider label="Opacité" value={st.opacity} min={0} max={1} step={0.05} onChange={(v) => setLayer(def.id, { opacity: v })} format={(v) => `${Math.round(v * 100)} %`} />}
          {def.controls.includes('color') && !st.colorByAgence && <ColorField label="Couleur" value={st.color} onChange={(v) => setLayer(def.id, { color: v })} />}
          {def.controls.includes('width') && <Slider label="Épaisseur" value={st.width} min={0.25} max={5} step={0.25} onChange={(v) => setLayer(def.id, { width: v })} format={(v) => `${v} px`} />}
          {def.controls.includes('size') && <Slider label="Taille" value={st.size} min={2} max={10} step={0.5} onChange={(v) => setLayer(def.id, { size: v })} format={(v) => `${v} px`} />}
          {def.controls.includes('labels') && <Toggle checked={st.labels} onChange={(v) => setLayer(def.id, { labels: v })} label="Libellés" />}
          {def.patrimoineOnlyOption && (
            <>
              <Toggle checked={st.patrimoineOnly} onChange={(v) => setLayer(def.id, { patrimoineOnly: v })} label={`Uniquement ${def.id === 'epci' ? 'les EPCI' : 'les communes'} avec patrimoine`} />
              <Toggle checked={st.colorByAgence} onChange={(v) => setLayer(def.id, { colorByAgence: v })} label="Colorer par agence (hachures = plusieurs agences)" />
            </>
          )}
          <div className="layer-order">
            <span className="muted small">Ordre</span>
            <button type="button" className="icon-btn" aria-label="Monter la couche" onClick={() => move(def.id, -1)}><Icon name="up" size={15} /></button>
            <button type="button" className="icon-btn" aria-label="Descendre la couche" onClick={() => move(def.id, 1)}><Icon name="down" size={15} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

export function MetaCard({ meta }: { meta: SourceMeta }) {
  const rows: [string, string | undefined][] = [
    ['Source', meta.source],
    ['Type', meta.type],
    ['Accès', meta.endpoint],
    ['Millésime', meta.millesime],
    ['Format', meta.format],
    ['Coordonnées', meta.crs],
    ['Mise à jour', meta.frequence],
    ['Licence', meta.licence],
    ['Note', meta.note],
  ];
  return (
    <dl className="meta-card">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
      {meta.aVerifier && <div className="meta-warn"><Icon name="warning" size={14} /> Endpoint à confirmer auprès du fournisseur.</div>}
    </dl>
  );
}
