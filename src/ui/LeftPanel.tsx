import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate } from 'animejs';
import { activeFilterCount } from '../domain/patrimoineIndex';
import { mapRef } from '../map/mapRef';
import { DUR, popIn, reducedMotion } from './motion';
import { useAppStore, type LeftTab } from '../store/useAppStore';
import { siteConfig } from '../config/siteConfig';
import { Icon } from './components/Icon';
import { AnalysePanel } from './panels/AnalysePanel';
import { FiltersPanel } from './panels/FiltersPanel';
import { LayersPanel } from './panels/LayersPanel';
import { PatrimoinePanel } from './panels/PatrimoinePanel';

const ALL_TABS: { id: LeftTab; label: string; icon: string }[] = [
  { id: 'patrimoine', label: 'Patrimoine', icon: 'building' },
  { id: 'couches', label: 'Couches', icon: 'layers' },
  { id: 'filtres', label: 'Filtres', icon: 'filter' },
  { id: 'analyse', label: 'Analyse', icon: 'chart' },
];
const TABS = ALL_TABS.filter((t) => siteConfig.ui.tabs[t.id]);

export function LeftPanel() {
  const tab = useAppStore((s) => s.leftTab);
  const open = useAppStore((s) => s.leftOpen);
  const set = useAppStore((s) => s.set);
  const panel = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const first = useRef(true);
  // Repli / dépli animés du volet ; la carte suit la largeur à chaque image.
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (open) setMounted(true);
    else if (panel.current) {
      const el = panel.current;
      animate(el, {
        width: [el.offsetWidth, 0],
        opacity: [1, 0],
        duration: reducedMotion() ? 0 : DUR.base,
        ease: 'inOutCubic',
        onUpdate: () => mapRef.current?.resize(),
        onComplete: () => {
          setMounted(false);
          mapRef.current?.resize();
        },
      });
    }
  }, [open]);
  const initialShow = useRef(true);
  useLayoutEffect(() => {
    if (initialShow.current) {
      initialShow.current = false;
      return;
    }
    if (!open || !mounted || !panel.current) return;
    const el = panel.current;
    const w = el.offsetWidth;
    animate(el, {
      width: [0, w],
      opacity: [0, 1],
      duration: reducedMotion() ? 0 : DUR.base,
      ease: 'outCubic',
      onUpdate: () => mapRef.current?.resize(),
      onComplete: () => {
        el.style.width = '';
        el.style.opacity = '';
        mapRef.current?.resize();
      },
    });
  }, [open, mounted]);
  // Changement d'onglet : léger fondu du contenu.
  useEffect(() => {
    if (panel.current) popIn(panel.current.querySelector('.panel-content') as HTMLElement ?? panel.current, 'up');
  }, [tab]);
  if (!TABS.length) return null;
  const nFilters = useAppStore((s) => activeFilterCount(s.filters));
  return (
    <nav className={`left ${open ? '' : 'is-collapsed'}`} aria-label="Panneau de navigation">
      <div className="rail" role="tablist" aria-orientation="vertical">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={open && tab === t.id}
            className={`rail-btn ${open && tab === t.id ? 'is-active' : ''}`}
            onClick={() => set(open && tab === t.id ? { leftOpen: false } : { leftTab: t.id, leftOpen: true })}
            title={t.label}
          >
            <Icon name={t.icon} size={20} />
            <span>{t.label}</span>
            {t.id === 'filtres' && nFilters > 0 && <span className="rail-badge">{nFilters}</span>}
          </button>
        ))}
        <button type="button" className="rail-btn rail-collapse" onClick={() => set({ leftOpen: !open })} aria-label={open ? 'Réduire le panneau' : 'Ouvrir le panneau'}>
          <Icon name={open ? 'chevronLeft' : 'chevronRight'} size={18} />
        </button>
      </div>
      {mounted && (
        <div className="left-panel" role="tabpanel" ref={panel}>
          <h2 className="panel-title">{TABS.find((t) => t.id === tab)?.label}</h2>
          {tab === 'patrimoine' && <PatrimoinePanel />}
          {tab === 'couches' && <LayersPanel />}
          {tab === 'filtres' && <FiltersPanel />}
          {tab === 'analyse' && <AnalysePanel />}
        </div>
      )}
    </nav>
  );
}
