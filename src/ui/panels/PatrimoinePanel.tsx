import { ColorBySelect } from '../ColorBySelect';

import { levelForZoom } from '../../map/patrimoineLayers';
import { useAppStore, type Representation } from '../../store/useAppStore';
import { useFilteredView } from '../../store/useFilteredView';
import { AnimatedNumber, Section, Segmented, Slider, Toggle } from '../components/controls';
import { Legend } from '../Legend';

const REPRESENTATIONS: { value: Representation; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'commune', label: 'Communes' },
  { value: 'residence', label: 'Résidences' },
  { value: 'batiment', label: 'Bâtiments' },
  { value: 'logement', label: 'Logements' },
];

export const LEVEL_LABELS = { commune: 'Agrégats par commune', residence: 'Ensembles résidentiels', batiment: 'Bâtiments (adresses)', logement: 'Logements' };

export function PatrimoinePanel() {
  const p = useAppStore((s) => s.patrimoine);
  const setP = useAppStore((s) => s.setPatrimoine);
  const zoom = useAppStore((s) => s.zoom);
  const view = useFilteredView();
  const level = levelForZoom(zoom, p.representation);

  return (
    <div className="panel-content">
      <div className="kpis">
        <div className="kpi"><span className="kpi-value"><AnimatedNumber value={view?.totals.residences} /></span><span className="kpi-label">résidences</span></div>
        <div className="kpi"><span className="kpi-value"><AnimatedNumber value={view?.totals.batiments} /></span><span className="kpi-label">bâtiments</span></div>
        <div className="kpi"><span className="kpi-value"><AnimatedNumber value={view?.totals.logements} /></span><span className="kpi-label">logements</span></div>
      </div>

      <Section title="Affichage">
        <Toggle checked={p.visible} onChange={(v) => setP({ visible: v })} label="Afficher le patrimoine" />
        <div className="field">
          <div className="field-label">Niveau de représentation</div>
          <Segmented label="Niveau de représentation" options={REPRESENTATIONS} value={p.representation} onChange={(v) => setP({ representation: v })} />
          <p className="help">
            {p.representation === 'auto' ? <>Selon le zoom — actuellement : <strong>{LEVEL_LABELS[level]}</strong>.</> : <>Niveau forcé : <strong>{LEVEL_LABELS[level]}</strong> à toutes les échelles.</>}
            {p.representation === 'logement' && zoom < 13 && ' À cette échelle, les logements se superposent : zoomez pour les distinguer.'}
          </p>
        </div>
        <Slider label="Opacité" value={p.opacity} min={0.1} max={1} step={0.05} onChange={(v) => setP({ opacity: v })} format={(v) => `${Math.round(v * 100)} %`} />
        <Toggle checked={p.labels} onChange={(v) => setP({ labels: v })} label="Libellés (noms, adresses)" />
      </Section>

      <Section title="Symbologie">
        <div className="field">
          <label className="field-label" htmlFor="color-by">Couleur par</label>
          <ColorBySelect id="color-by" />
        </div>
        <div className="field">
          <div className="field-label">Taille des points</div>
          <Segmented label="Taille des points" options={[{ value: 'logements', label: 'Nombre de logements' }, { value: 'fixe', label: 'Fixe' }]} value={p.sizeMode} onChange={(v) => setP({ sizeMode: v })} />
          <p className="help">{p.sizeMode === 'logements' ? 'Surface proportionnelle au nombre de logements, plafonnée au 95e percentile pour garder les petites résidences visibles.' : 'Tous les points ont la même taille.'}</p>
        </div>
        <Slider label="Échelle" value={p.sizeScale} min={0.5} max={2} step={0.1} onChange={(v) => setP({ sizeScale: v })} format={(v) => `×${v.toFixed(1)}`} />
      </Section>

      <Section title="Légende">
        <p className="help">Cliquez sur une valeur pour filtrer, sur l’œil pour la masquer.</p>
        <Legend />
      </Section>
    </div>
  );
}
