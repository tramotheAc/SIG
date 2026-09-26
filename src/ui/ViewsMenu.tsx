import { useEffect, useRef, useState } from 'react';
import { applyView, deleteSavedView, listSavedViews, saveCurrentView, shareUrl, type SavedView } from '../store/viewState';
import { useAppStore } from '../store/useAppStore';
import { Icon } from './components/Icon';

/** Menu « Vues » : copier le lien de la vue actuelle, enregistrer / rouvrir des vues nommées. */
export function ViewsMenu() {
  const notify = useAppStore((s) => s.notify);
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<SavedView[]>([]);
  const [name, setName] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  // Fermeture au clic en dehors du menu ou avec Échap.
  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', down);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('mousedown', down);
      document.removeEventListener('keydown', key);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setViews(listSavedViews());
    setOpen(!open);
  };

  const copy = async () => {
    const url = shareUrl();
    try {
      await navigator.clipboard.writeText(url);
      notify('Lien de la vue copié : collez-le dans un mail ou un message.', 'success');
    } catch {
      window.prompt('Copiez ce lien :', url);
    }
    setOpen(false);
  };

  const save = () => {
    const n = name.trim();
    if (!n) return;
    saveCurrentView(n);
    setViews(listSavedViews());
    setName('');
    notify(`Vue « ${n} » enregistrée dans ce navigateur.`, 'success');
  };

  return (
    <div className="menu-wrap" ref={wrap}>
      <button type="button" className="btn btn-ghost" aria-haspopup="menu" aria-expanded={open} onClick={toggle} title="Partager ou enregistrer la vue">
        <Icon name="bookmark" />
        <span className="hide-sm">Vues</span>
      </button>
      {open && (
        <div className="menu views-menu" role="menu">
          <button type="button" role="menuitem" onClick={copy}>
            <Icon name="link" />
            <span>
              Copier le lien de cette vue
              <small>Filtres, légende, couches, fond et cadrage</small>
            </span>
          </button>
          <div className="views-save">
            <input className="input" placeholder="Nom de la vue à enregistrer…" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} />
            <button type="button" className="btn btn-sm btn-primary" disabled={!name.trim()} onClick={save}>Enregistrer</button>
          </div>
          {views.length > 0 && <div className="menu-sep">Mes vues</div>}
          {views.map((v) => (
            <div key={v.id} className="views-item">
              <button type="button" role="menuitem" className="grow" onClick={() => { applyView(v.view); setOpen(false); }}>
                <Icon name="pin" />
                <span>
                  {v.name}
                  <small>{new Date(v.date).toLocaleDateString('fr-FR')}</small>
                </span>
              </button>
              <button type="button" className="icon-btn" aria-label={`Supprimer la vue ${v.name}`} title="Supprimer" onClick={() => { deleteSavedView(v.id); setViews(listSavedViews()); }}>
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))}
          {!views.length && <p className="help pad">Les vues enregistrées restent dans ce navigateur. Pour partager, utilisez le lien.</p>}
          <div className="menu-foot">
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(false)}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
