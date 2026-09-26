import { useLayoutEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { popIn } from './motion';
import { Icon } from './components/Icon';

/** Page web intégrée (tableau de bord Power BI…) en grand panneau au-dessus de la carte. */
export function EmbedViewer() {
  const embed = useAppStore((s) => s.embed);
  const set = useAppStore((s) => s.set);
  const panel = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    document.querySelector('.map-area')?.classList.toggle('has-embed', !!embed);
    if (embed && panel.current) popIn(panel.current, 'scale');
  }, [embed]);
  if (!embed) return null;
  return (
    <>
    <div className="embed-backdrop" onClick={() => set({ embed: undefined })} />
    <div ref={panel} className="embed-panel" role="dialog" aria-label={embed.title}>
      <header className="embed-head">
        <strong>{embed.title}</strong>
        <a className="btn btn-ghost btn-sm" href={embed.url} target="_blank" rel="noopener noreferrer">
          <Icon name="external" size={15} /> Nouvel onglet
        </a>
        <button type="button" className="icon-btn" aria-label="Fermer le tableau de bord" onClick={() => set({ embed: undefined })}>
          <Icon name="close" />
        </button>
      </header>
      <iframe className="embed-frame" src={embed.url} title={embed.title} allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
    </div>
    </>
  );
}
