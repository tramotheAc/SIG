import { useMemo, type ReactNode } from 'react';
import { appConfig } from '../config/app.config';
import type { Batiment, EntityRef, Responsables, GeoContext, GeoPoint, Logement, Residence } from '../domain/model';
import { PatrimoineIndex } from '../domain/patrimoineIndex';
import { QPV_LABELS } from '../domain/symbology';
import { haversine } from '../geo/spatial';
import { colorRegistry } from '../store/colorRegistry';
import { locate, selectAndZoom } from '../store/navigation';
import { useAppStore } from '../store/useAppStore';
import { Icon } from './components/Icon';
import { buildEmbedUrl, embedFor, entityValues } from './embed';
import { fmt } from './components/controls';
import { ROLE_LABELS } from './panels/filterOptions';

const KIND_LABEL: Record<string, string> = {
  residence: 'Ensemble résidentiel',
  batiment: 'Bâtiment / adresse',
  cage: 'Cage d’escalier',
  logement: 'Logement',
  commune: 'Commune',
  epci: 'EPCI',
  agence: 'Agence',
  qpv: 'Quartier prioritaire (QPV)',
  adresse: 'Adresse (BAN)',
};

/** Fiche objet contextualisée (panneau de droite). */
export function DetailPanel() {
  const sel = useAppStore((s) => s.selection);
  const index = useAppStore((s) => s.index);
  const select = useAppStore((s) => s.select);
  useAppStore((s) => s.geoVersion); // re-rendu quand les référentiels arrivent
  if (!sel || !index) return null;
  return (
    <aside className="detail-panel" aria-label={`Fiche ${KIND_LABEL[sel.kind] ?? ''}`}>
      <button type="button" className="icon-btn detail-close" onClick={() => select(undefined)} aria-label="Fermer la fiche">
        <Icon name="close" />
      </button>
      <div className="detail-scroll">
        <EmbedButton sel={sel} index={index} />
        <Fiche sel={sel} index={index} />
      </div>
    </aside>
  );
}

function Fiche({ sel, index }: { sel: EntityRef; index: PatrimoineIndex }) {
  switch (sel.kind) {
    case 'residence': {
      const r = index.residences.get(sel.id);
      return r ? <ResidenceFiche r={r} index={index} /> : <Missing />;
    }
    case 'batiment': {
      const b = index.batiments.get(sel.id);
      return b ? <BatimentFiche b={b} index={index} /> : <Missing />;
    }
    case 'logement': {
      const l = index.logements.get(sel.id);
      return l ? <LogementFiche l={l} index={index} /> : <Missing />;
    }
    case 'commune':
      return <AreaFiche kind="commune" code={sel.id} index={index} />;
    case 'epci':
      return <AreaFiche kind="epci" code={sel.id} index={index} />;
    case 'agence':
      return <AgenceFiche id={sel.id} index={index} />;
    case 'qpv':
      return <QpvFiche sel={sel} index={index} />;
    case 'adresse':
      return <AdresseFiche sel={sel} index={index} />;
    default:
      return <Missing />;
  }
}

function Missing() {
  return (
    <div className="empty">
      <Icon name="warning" />
      <p>Cet objet n’est plus disponible (il a pu être supprimé ou ne fait plus partie des données chargées).</p>
    </div>
  );
}

/* ------------------------------ Briques ------------------------------ */

function Head({ kind, title, subtitle, color }: { kind: string; title: string; subtitle?: ReactNode; color?: string }) {
  return (
    <header className="detail-head">
      <span className="detail-kind">
        {color && <span className="dot" style={{ background: color }} />}
        {KIND_LABEL[kind]}
      </span>
      <h2>{title}</h2>
      {subtitle && <div className="detail-sub">{subtitle}</div>}
    </header>
  );
}

type FieldValue = ReactNode | string | number | undefined | null;
/** Liste de champs : les valeurs vides ne sont pas affichées. */
function Fields({ rows, title }: { rows: [string, FieldValue][]; title?: string }) {
  const visible = rows.filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!visible.length) return null;
  return (
    <div className="detail-block">
      {title && <h3>{title}</h3>}
      <dl className="fields">
        {visible.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Link({ to, children }: { to: EntityRef; children: ReactNode }) {
  return (
    <button type="button" className="link-btn" onClick={() => selectAndZoom(to)}>
      {children}
    </button>
  );
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="kpi">
      <span className="kpi-value">{typeof value === 'number' ? fmt(value) : value}</span>
      <span className="kpi-label">{label}</span>
    </div>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="detail-actions">{children}</div>;
}

function ZoomBtn({ target }: { target: EntityRef }) {
  const index = useAppStore((s) => s.index);
  const flyTo = useAppStore((s) => s.flyTo);
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => index && flyTo(locate(index, target))}>
      <Icon name="zoom" size={15} /> Zoomer
    </button>
  );
}

function AgenceLink({ id, index }: { id?: string; index: PatrimoineIndex }) {
  if (!id) return null;
  return (
    <span className="inline">
      <span className="dot" style={{ background: colorRegistry.colorOf('agence', id) }} />
      <Link to={{ kind: 'agence', id }}>{index.agenceNom(id)}</Link>
    </span>
  );
}

function geoRows(g: GeoContext | undefined, index: PatrimoineIndex, withDistance = true): [string, FieldValue][] {
  const qpvStatus = PatrimoineIndex.qpvStatus(g);
  const layers = useAppStore.getState().layers;
  const qpvKnown = layers.qpv.status === 'ready';
  void index;
  return [
    ['QPV', qpvKnown ? <span className={`badge ${qpvStatus === 'en_qpv' ? 'badge-danger' : qpvStatus === 'moins_300m' ? 'badge-warn' : 'badge-muted'}`}>{QPV_LABELS[qpvStatus]}{g?.qpvNom ? ` — ${g.qpvNom}` : ''}</span> : <span className="muted">Référentiel non disponible</span>],
    [
      'Distance au QPV',
      withDistance && qpvKnown && g?.distanceQpvM !== undefined && g.distanceQpvM > 0
        ? Number.isFinite(g.distanceQpvM)
          ? `${fmt(g.distanceQpvM)} m${g.qpvProcheNom ? ` (${g.qpvProcheNom})` : ''}`
          : '> 3 km'
        : undefined,
    ],
    ['Zone APL', g?.zoneApl ? `Zone ${g.zoneApl}` : layers.apl.status === 'ready' ? 'Non renseignée' : undefined],
    ['Zone Pinel', g?.zonePinel ? `Zone ${g.zonePinel === 'Abis' ? 'A bis' : g.zonePinel}` : layers.pinel.status === 'ready' ? 'Non renseignée' : undefined],
  ];
}

function territoryRows(insee: string | undefined, communeNom: string | undefined, index: PatrimoineIndex): [string, FieldValue][] {
  const epci = index.epciOf(insee);
  return [
    ['Commune', insee ? <Link to={{ kind: 'commune', id: insee }}>{index.communes.get(insee)?.nom ?? communeNom ?? insee}</Link> : communeNom],
    ['EPCI', epci.code ? <Link to={{ kind: 'epci', id: epci.code }}>{epci.nom ?? epci.code}</Link> : undefined],
  ];
}

function roleRows(r: Responsables): [string, FieldValue][] {
  return (Object.keys(ROLE_LABELS) as (keyof typeof ROLE_LABELS)[]).map((k) => [ROLE_LABELS[k], r[k]]);
}

function PositionNote({ source }: { source: string }) {
  if (source === 'source') return null;
  return <p className="help">{source === 'derivee' ? 'Position déduite de l’objet parent ou des objets enfants.' : 'Aucune position connue : objet non affiché sur la carte.'}</p>;
}

function Breadcrumb({ items }: { items: { label: string; to?: EntityRef }[] }) {
  return (
    <nav className="breadcrumb" aria-label="Hiérarchie">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <Icon name="chevronRight" size={12} />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
        </span>
      ))}
    </nav>
  );
}

function ExternalLink({ href }: { href?: string }) {
  if (!href || !/^https?:\/\//i.test(href)) return null;
  return (
    <a className="btn btn-ghost btn-sm" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name="external" size={15} /> Fiche IKOS
    </a>
  );
}

/* ------------------------------ Fiches ------------------------------ */

function ResidenceFiche({ r, index }: { r: Residence; index: PatrimoineIndex }) {
  const bats = r.batimentIds.map((id) => index.batiments.get(id)!).filter(Boolean);
  const g = index.geo.get(r.id);
  const flyTo = useAppStore((s) => s.flyTo);
  return (
    <>
      <Breadcrumb items={[{ label: index.communes.get(r.communeInsee ?? '')?.nom ?? r.communeNom ?? '—', to: r.communeInsee ? { kind: 'commune', id: r.communeInsee } : undefined }, { label: r.nom }]} />
      <Head kind="residence" title={r.nom} subtitle={r.adresse} color={colorRegistry.colorOf('agence', r.agenceId)} />
      <div className="kpis">
        <Stat value={bats.length} label="bâtiments" />
        <Stat value={r.nbLogements} label="logements" />
      </div>
      <Actions>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => flyTo({ ...locate(index, { kind: 'residence', id: r.id }), zoom: appConfig.zoom.flyToBatiment })}>
          <Icon name="building" size={15} /> Voir les bâtiments
        </button>
        <ZoomBtn target={{ kind: 'residence', id: r.id }} />
        <ExternalLink href={r.lienFiche} />
      </Actions>
      <Fields rows={[...territoryRows(r.communeInsee, r.communeNom, index), ['Agence', <AgenceLink id={r.agenceId} index={index} />], ['Code', r.code], ['Quartier', r.quartier], ['Construction', r.dateConstruction?.slice(0, 4)], ['Mode d’acquisition', r.modeAcquisition]]} />
      <Fields title="Situation géographique" rows={geoRows(g, index)} />
      <Fields title="Responsables" rows={roleRows(r.responsables)} />
      <div className="detail-block">
        <h3>Bâtiments ({bats.length})</h3>
        <ul className="child-list">
          {bats.map((b) => (
            <li key={b.id}>
              <button type="button" onClick={() => selectAndZoom({ kind: 'batiment', id: b.id })}>
                <span>{b.adresse ?? b.libelle}</span>
                <span className="muted small">{fmt(b.nbLogements)} lgt</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <PositionNote source={r.positionSource} />
    </>
  );
}

function BatimentFiche({ b, index }: { b: Batiment; index: PatrimoineIndex }) {
  const res = b.residenceId ? index.residences.get(b.residenceId) : undefined;
  const cages = b.cageIds.map((id) => index.cages.get(id)!).filter(Boolean);
  const logements = b.logementIds.map((id) => index.logements.get(id)!).filter(Boolean);
  const flyTo = useAppStore((s) => s.flyTo);
  const byCage = new Map<string, Logement[]>();
  for (const l of logements) {
    const k = l.cageId ?? '';
    byCage.set(k, [...(byCage.get(k) ?? []), l]);
  }
  return (
    <>
      <Breadcrumb items={[{ label: index.communes.get(b.communeInsee ?? '')?.nom ?? b.communeNom ?? '—', to: b.communeInsee ? { kind: 'commune', id: b.communeInsee } : undefined }, ...(res ? [{ label: res.nom, to: { kind: 'residence' as const, id: res.id } }] : []), { label: b.adresse ?? b.libelle }]} />
      <Head kind="batiment" title={b.adresse ?? b.libelle} subtitle={b.codePostal ? `${b.codePostal} ${b.communeNom ?? ''}` : b.communeNom} color={colorRegistry.colorOf('agence', b.agenceId)} />
      <div className="kpis">
        <Stat value={cages.length} label="cages" />
        <Stat value={b.nbLogements} label="logements" />
      </div>
      <Actions>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => flyTo({ position: b.position, zoom: appConfig.zoom.flyToLogement })} disabled={!b.position}>
          <Icon name="home" size={15} /> Voir les logements
        </button>
        <ZoomBtn target={{ kind: 'batiment', id: b.id }} />
      </Actions>
      <Fields rows={[['Résidence', res ? <Link to={{ kind: 'residence', id: res.id }}>{res.nom}</Link> : undefined], ...territoryRows(b.communeInsee, b.communeNom, index), ['Agence', <AgenceLink id={b.agenceId} index={index} />], ['Code', b.code]]} />
      <Fields title="Situation géographique" rows={geoRows(index.geoOf(b), index)} />
      <Fields title="Responsables" rows={roleRows(b.responsables)} />
      <div className="detail-block">
        <h3>Logements ({logements.length})</h3>
        {[...byCage.entries()].map(([cageId, list]) => (
          <div key={cageId} className="cage-group">
            <div className="cage-title">{index.cages.get(cageId)?.libelle ?? 'Sans cage'}</div>
            <ul className="child-list">
              {list.map((l) => (
                <li key={l.id}>
                  <button type="button" onClick={() => selectAndZoom({ kind: 'logement', id: l.id })}>
                    <span>{l.code}</span>
                    <span className="muted small">{[l.typeLot, l.etage !== undefined ? `ét. ${l.etage}` : undefined, l.surfaceHabitable ? `${l.surfaceHabitable} m²` : undefined].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <PositionNote source={b.positionSource} />
    </>
  );
}

function LogementFiche({ l, index }: { l: Logement; index: PatrimoineIndex }) {
  const res = l.residenceId ? index.residences.get(l.residenceId) : undefined;
  const bat = l.batimentId ? index.batiments.get(l.batimentId) : undefined;
  const cage = l.cageId ? index.cages.get(l.cageId) : undefined;
  return (
    <>
      <Breadcrumb items={[...(res ? [{ label: res.nom, to: { kind: 'residence' as const, id: res.id } }] : []), ...(bat ? [{ label: bat.adresse ?? bat.libelle, to: { kind: 'batiment' as const, id: bat.id } }] : []), { label: l.code }]} />
      <Head kind="logement" title={`Logement ${l.code}`} subtitle={l.adresse} color={colorRegistry.colorOf('agence', l.agenceId)} />
      <Actions>
        <ZoomBtn target={{ kind: 'logement', id: l.id }} />
        <ExternalLink href={l.lienFiche} />
      </Actions>
      <Fields
        rows={[
          ['Résidence', res ? <Link to={{ kind: 'residence', id: res.id }}>{res.nom}</Link> : undefined],
          ['Bâtiment', bat ? <Link to={{ kind: 'batiment', id: bat.id }}>{bat.adresse ?? bat.libelle}</Link> : undefined],
          ['Cage', cage?.libelle],
          ...territoryRows(l.communeInsee, l.communeNom, index),
          ['Agence', <AgenceLink id={l.agenceId} index={index} />],
        ]}
      />
      <Fields title="Responsables" rows={roleRows(l.responsables)} />
      <Fields title="Situation géographique" rows={geoRows(index.geoOf(l), index)} />
      <Fields
        title="Caractéristiques"
        rows={[
          ['Identifiant RPLS', l.rpls],
          ['Type', l.typeLot],
          ['Étage', l.etage],
          ['Porte', l.porte],
          ['Surface habitable', l.surfaceHabitable ? `${l.surfaceHabitable} m²` : undefined],
          ['Chambres', l.nbChambres],
          ['Individuel / collectif', l.individuelCollectif],
          ['Financement', l.financement],
          ['État', l.etat],
          ['Occupation', l.occupe === undefined ? undefined : l.occupe ? 'Occupé' : 'Non occupé'],
        ]}
      />
      <p className="help">Sur la carte, les logements d’une même cage sont disposés en spirale autour de sa position (position schématique).</p>
    </>
  );
}

function breakdown(index: PatrimoineIndex, residences: Residence[]) {
  const byAg = new Map<string, number>();
  for (const r of residences) byAg.set(r.agenceId ?? '', (byAg.get(r.agenceId ?? '') ?? 0) + r.nbLogements);
  const total = [...byAg.values()].reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="detail-block">
      <h3>Répartition par agence</h3>
      <div className="stack-bar" aria-hidden="true">
        {[...byAg.entries()].map(([ag, n]) => <span key={ag} style={{ width: `${(n / total) * 100}%`, background: colorRegistry.colorOf('agence', ag || undefined) }} />)}
      </div>
      <ul className="child-list">
        {[...byAg.entries()].sort((a, b) => b[1] - a[1]).map(([ag, n]) => (
          <li key={ag}>
            <button type="button" onClick={() => ag && selectAndZoom({ kind: 'agence', id: ag })}>
              <span className="inline"><span className="dot" style={{ background: colorRegistry.colorOf('agence', ag || undefined) }} />{ag ? index.agenceNom(ag) : 'Non renseignée'}</span>
              <span className="muted small">{fmt(n)} lgt · {Math.round((n / total) * 100)} %</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AreaFiche({ kind, code, index }: { kind: 'commune' | 'epci'; code: string; index: PatrimoineIndex }) {
  const setFilters = useAppStore((s) => s.setFilters);
  const residences = useMemo(
    () => [...index.residences.values()].filter((r) => (kind === 'commune' ? r.communeInsee === code : index.epciOf(r.communeInsee).code === code)),
    [index, kind, code],
  );
  const commune = kind === 'commune' ? index.communes.get(code) : undefined;
  const epciNom = kind === 'epci' ? [...index.communes.values()].find((c) => c.epciCode === code)?.epciNom : undefined;
  const nom = commune?.nom ?? epciNom ?? residences[0]?.communeNom ?? code;
  const logements = residences.reduce((s, r) => s + r.nbLogements, 0);
  const communes = kind === 'epci' ? [...new Set(residences.map((r) => r.communeInsee).filter(Boolean) as string[])] : [];
  return (
    <>
      <Head kind={kind} title={nom} subtitle={kind === 'commune' ? `Code INSEE ${code}` : `SIREN ${code}`} />
      <div className="kpis">
        <Stat value={residences.length} label="résidences" />
        <Stat value={logements} label="logements" />
        {kind === 'epci' && <Stat value={communes.length} label="communes" />}
      </div>
      <Actions>
        <button type="button" className="btn btn-primary btn-sm" disabled={!residences.length} onClick={() => setFilters(kind === 'commune' ? { communes: [code] } : { epcis: [code] })}>
          <Icon name="filter" size={15} /> Filtrer sur {kind === 'commune' ? 'cette commune' : 'cet EPCI'}
        </button>
        <ZoomBtn target={{ kind, id: code }} />
      </Actions>
      {kind === 'commune' && (
        <Fields rows={[['EPCI', commune?.epciCode ? <Link to={{ kind: 'epci', id: commune.epciCode }}>{commune.epciNom ?? commune.epciCode}</Link> : undefined], ['Département', commune?.departement], ['Population (INSEE)', commune?.population ? fmt(commune.population) : undefined]]} />
      )}
      {!residences.length && <p className="empty">Le bailleur ne possède pas de patrimoine connu ici.</p>}
      {residences.length > 0 && breakdown(index, residences)}
      {kind === 'epci' && communes.length > 0 && (
        <div className="detail-block">
          <h3>Communes avec patrimoine</h3>
          <ul className="child-list">
            {communes.map((c) => (
              <li key={c}><button type="button" onClick={() => selectAndZoom({ kind: 'commune', id: c })}><span>{index.communes.get(c)?.nom ?? c}</span><span className="muted small">{fmt(residences.filter((r) => r.communeInsee === c).reduce((s, r) => s + r.nbLogements, 0))} lgt</span></button></li>
            ))}
          </ul>
        </div>
      )}
      {kind === 'commune' && residences.length > 0 && <ResidenceList residences={residences} />}
    </>
  );
}

function ResidenceList({ residences, title = 'Résidences' }: { residences: Residence[]; title?: string }) {
  const sorted = [...residences].sort((a, b) => b.nbLogements - a.nbLogements);
  return (
    <div className="detail-block">
      <h3>{title} ({residences.length})</h3>
      <ul className="child-list">
        {sorted.slice(0, 50).map((r) => (
          <li key={r.id}><button type="button" onClick={() => selectAndZoom({ kind: 'residence', id: r.id })}><span>{r.nom}</span><span className="muted small">{fmt(r.nbLogements)} lgt</span></button></li>
        ))}
      </ul>
      {sorted.length > 50 && <p className="help">Les 50 plus grandes sont listées. Utilisez les filtres pour affiner.</p>}
    </div>
  );
}

function AgenceFiche({ id, index }: { id: string; index: PatrimoineIndex }) {
  const a = index.agences.get(id);
  const setFilters = useAppStore((s) => s.setFilters);
  const residences = useMemo(() => [...index.residences.values()].filter((r) => r.agenceId === id), [index, id]);
  const communes = new Map<string, number>();
  for (const r of residences) if (r.communeInsee) communes.set(r.communeInsee, (communes.get(r.communeInsee) ?? 0) + r.nbLogements);
  if (!a) return <Missing />;
  return (
    <>
      <Head kind="agence" title={a.nom} subtitle={a.adresse} color={colorRegistry.colorOf('agence', a.id)} />
      <div className="kpis">
        <Stat value={residences.length} label="résidences" />
        <Stat value={residences.reduce((s, r) => s + r.nbLogements, 0)} label="logements" />
        <Stat value={communes.size} label="communes" />
      </div>
      <Actions>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setFilters({ agences: [id] })}>
          <Icon name="filter" size={15} /> Filtrer sur cette agence
        </button>
        <ZoomBtn target={{ kind: 'agence', id }} />
      </Actions>
      <Fields rows={[['Code', a.code]]} />
      <div className="detail-block">
        <h3>Communes</h3>
        <ul className="child-list">
          {[...communes.entries()].sort((x, y) => y[1] - x[1]).map(([c, n]) => (
            <li key={c}><button type="button" onClick={() => selectAndZoom({ kind: 'commune', id: c })}><span>{index.communes.get(c)?.nom ?? c}</span><span className="muted small">{fmt(n)} lgt</span></button></li>
          ))}
        </ul>
      </div>
    </>
  );
}

function QpvFiche({ sel, index }: { sel: EntityRef; index: PatrimoineIndex }) {
  const p = sel.payload ?? {};
  const setFilters = useAppStore((s) => s.setFilters);
  const { inside, near } = useMemo(() => {
    const inside: Residence[] = [];
    const near: Residence[] = [];
    for (const r of index.residences.values()) {
      const g = index.geo.get(r.id);
      if (g?.qpvCode === sel.id) inside.push(r);
      else if (g?.qpvProcheCode === sel.id && (g.distanceQpvM ?? Infinity) <= appConfig.qpvBufferMeters) near.push(r);
    }
    return { inside, near };
  }, [index, sel.id]);
  const n = (l: Residence[]) => l.reduce((s, r) => s + r.nbLogements, 0);
  const extra = Object.entries(p).filter(([k, v]) => !['code', 'nom'].includes(k) && typeof v !== 'object' && v !== '' && v !== null).slice(0, 6);
  return (
    <>
      <Head kind="qpv" title={String(p.nom ?? sel.id)} subtitle={`Code ${sel.id}`} />
      <div className="kpis">
        <Stat value={n(inside)} label="logements en QPV" />
        <Stat value={n(near)} label="à moins de 300 m" />
      </div>
      <Actions>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setFilters({ qpv: ['en_qpv', 'moins_300m'] })}>
          <Icon name="filter" size={15} /> Patrimoine en QPV et à moins de 300 m
        </button>
      </Actions>
      <Fields rows={extra.map(([k, v]) => [k, String(v)])} title="Attributs de la source" />
      {inside.length > 0 && <ResidenceList residences={inside} title="Résidences dans le QPV" />}
      {near.length > 0 && <ResidenceList residences={near} title="Résidences à moins de 300 m" />}
    </>
  );
}

function AdresseFiche({ sel, index }: { sel: EntityRef; index: PatrimoineIndex }) {
  const pos = sel.payload?.position as GeoPoint | undefined;
  const nearby = useMemo(() => {
    if (!pos) return [];
    const out: { b: Batiment; d: number }[] = [];
    for (const b of index.batiments.values()) {
      if (!b.position) continue;
      if (Math.abs(b.position.lat - pos.lat) > 0.003 || Math.abs(b.position.lon - pos.lon) > 0.005) continue;
      const d = haversine(pos, b.position);
      if (d <= 200) out.push({ b, d });
    }
    return out.sort((a, b) => a.d - b.d).slice(0, 15);
  }, [index, pos]);
  return (
    <>
      <Head kind="adresse" title={String(sel.payload?.label ?? 'Adresse')} subtitle={sel.payload?.context as string | undefined} />
      <Actions>
        <ZoomBtn target={sel} />
      </Actions>
      <Fields rows={[['Commune', sel.payload?.citycode ? <Link to={{ kind: 'commune', id: String(sel.payload.citycode) }}>{String(sel.payload.city ?? sel.payload.citycode)}</Link> : undefined], ['Identifiant BAN', sel.id]]} />
      <div className="detail-block">
        <h3>Patrimoine à moins de 200 m</h3>
        {!nearby.length && <p className="muted small">Aucun bâtiment du patrimoine à proximité.</p>}
        <ul className="child-list">
          {nearby.map(({ b, d }) => (
            <li key={b.id}><button type="button" onClick={() => selectAndZoom({ kind: 'batiment', id: b.id })}><span>{b.adresse ?? b.libelle}</span><span className="muted small">{Math.round(d)} m · {fmt(b.nbLogements)} lgt</span></button></li>
          ))}
        </ul>
      </div>
    </>
  );
}

/** Bouton « Tableau de bord » : page configurée en administration, filtrée sur l'objet. */
function EmbedButton({ sel, index }: { sel: EntityRef; index: PatrimoineIndex }) {
  const set = useAppStore((s) => s.set);
  const cfg = embedFor(sel.kind);
  if (!cfg) return null;
  const values = entityValues(index, sel);
  const url = buildEmbedUrl(cfg.url, values);
  return (
    <div className="embed-bar">
      <button type="button" className="btn btn-primary btn-sm" onClick={() => set({ embed: { title: `${cfg.label} — ${values.nom ?? values.code ?? sel.id}`, url } })}>
        <Icon name="chart" size={15} /> {cfg.label}
      </button>
    </div>
  );
}
