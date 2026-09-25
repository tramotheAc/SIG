/**
 * Export PNG de la carte courante avec titre, légende, échelle approximative et sources.
 * Composition sur un canvas 2D à partir du canvas WebGL (preserveDrawingBuffer activé).
 */
import { basemaps } from '../config/layers.config';
import type { FilteredView } from '../domain/patrimoineIndex';
import { COLOR_BY_OPTIONS, MISSING } from '../domain/symbology';
import { mapRef } from '../map/mapRef';
import { colorRegistry } from '../store/colorRegistry';
import { useAppStore } from '../store/useAppStore';
import { download } from './excelExport';

export async function exportImage(view: FilteredView) {
  const map = mapRef.current;
  if (!map) throw new Error('Carte non initialisée');
  await new Promise<void>((resolve) => {
    if (map.loaded()) resolve();
    else map.once('idle', () => resolve());
  });
  map.triggerRepaint();
  await new Promise((r) => map.once('render', r));
  const src = map.getCanvas();
  const s = useAppStore.getState();
  const ix = s.index!;
  const by = s.patrimoine.colorBy;
  const ratio = src.width / src.clientWidth;

  const headerH = 56 * ratio;
  const footerH = 26 * ratio;
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height + headerH + footerH;
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  try {
    ctx.drawImage(src, 0, headerH);
  } catch {
    throw new Error('Le fond de carte n’autorise pas l’export (CORS).');
  }

  const px = (n: number) => n * ratio;
  const font = (size: number, weight = 400) => `${weight} ${px(size)}px Inter, system-ui, sans-serif`;

  // En-tête
  ctx.fillStyle = '#29467b'; // --nuit (charte Aiguillon)
  ctx.fillRect(0, 0, out.width, headerH);
  ctx.fillStyle = '#ffffff';
  ctx.font = font(18, 600);
  ctx.textBaseline = 'middle';
  const colorLabel = COLOR_BY_OPTIONS.find((o) => o.key === by)?.label ?? '';
  ctx.fillText(`Patrimoine — ${colorLabel}`, px(16), headerH / 2 - px(8));
  ctx.font = font(12);
  ctx.fillText(
    `${view.totals.residences.toLocaleString('fr-FR')} résidences · ${view.totals.logements.toLocaleString('fr-FR')} logements · ${new Date().toLocaleDateString('fr-FR')}${s.dataset?.source.synthetic ? ' · DONNÉES SYNTHÉTIQUES (démo)' : ''}`,
    px(16),
    headerH / 2 + px(12),
  );

  // Légende
  const entries = view.categories.filter((c) => c.logements + c.residences > 0).slice(0, 18);
  const lineH = px(18);
  const boxW = px(250);
  const boxH = px(34) + entries.length * lineH + (view.categories.length > 18 ? lineH : 0);
  const x0 = px(12);
  const y0 = headerH + src.height - boxH - px(12);
  ctx.fillStyle = 'rgba(255,255,255,0.94)';
  roundRect(ctx, x0, y0, boxW, boxH, px(8));
  ctx.fill();
  ctx.strokeStyle = '#dee2e6';
  ctx.lineWidth = px(1);
  ctx.stroke();
  ctx.fillStyle = '#212529';
  ctx.font = font(12, 600);
  ctx.fillText(`Couleur : ${colorLabel}`, x0 + px(10), y0 + px(16));
  ctx.font = font(11);
  entries.forEach((e, i) => {
    const y = y0 + px(34) + i * lineH;
    ctx.fillStyle = colorRegistry.colorOf(by, e.value);
    ctx.beginPath();
    ctx.arc(x0 + px(16), y, px(5), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#212529';
    const label = e.value === MISSING ? 'Non renseigné' : ix.categoryLabel(by, e.value);
    ctx.fillText(truncate(ctx, label, boxW - px(90)), x0 + px(28), y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#495057';
    ctx.fillText(e.logements.toLocaleString('fr-FR'), x0 + boxW - px(10), y);
    ctx.textAlign = 'left';
  });
  if (view.categories.length > 18) {
    ctx.fillStyle = '#868e96';
    ctx.fillText(`+ ${view.categories.length - 18} autres valeurs`, x0 + px(10), y0 + px(34) + entries.length * lineH);
  }

  // Pied : sources
  const bm = basemaps.find((b) => b.id === s.basemap);
  ctx.fillStyle = '#f1f3f5';
  ctx.fillRect(0, headerH + src.height, out.width, footerH);
  ctx.fillStyle = '#495057';
  ctx.font = font(10);
  ctx.fillText(`Fond : ${bm?.attribution ?? ''} · Patrimoine : ${s.dataset?.source.label ?? ''} · Atlas Patrimoine`, px(12), headerH + src.height + footerH / 2);

  const blob = await new Promise<Blob | null>((r) => out.toBlob(r, 'image/png'));
  if (!blob) throw new Error('Génération PNG impossible');
  download(blob, `carte-patrimoine-${new Date().toISOString().slice(0, 10)}.png`);
}

function truncate(ctx: CanvasRenderingContext2D, s: string, w: number) {
  if (ctx.measureText(s).width <= w) return s;
  let t = s;
  while (t.length > 3 && ctx.measureText(`${t}…`).width > w) t = t.slice(0, -1);
  return `${t}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
