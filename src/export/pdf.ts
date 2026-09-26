/**
 * Génération PDF minimale (sans dépendance) : une image JPEG par page, format A4
 * orienté selon l'image (paysage / portrait), image centrée et ajustée.
 */

export interface PdfPage {
  jpeg: Uint8Array;
  width: number;
  height: number;
}

const A4 = { long: 841.89, short: 595.28 };

export function imagesToPdf(pages: PdfPage[], title = 'Atlas Patrimoine'): Blob {
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let pos = 0;
  const push = (d: string | Uint8Array) => {
    const b = typeof d === 'string' ? enc.encode(d) : d;
    chunks.push(b);
    pos += b.length;
  };
  const obj = (n: number, body: () => void) => {
    offsets[n] = pos;
    push(`${n} 0 obj\n`);
    body();
    push('\nendobj\n');
  };

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  // 1 : catalogue, 2 : pages, 3 : infos ; puis 3 objets par page (page, image, contenu)
  const pageIds = pages.map((_, i) => 4 + i * 3);
  obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
  obj(2, () => push(`<< /Type /Pages /Count ${pages.length} /Kids [${pageIds.map((i) => `${i} 0 R`).join(' ')}] >>`));
  obj(3, () => push(`<< /Title (${pdfText(title)}) /Producer (Atlas Patrimoine) /CreationDate (D:${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}) >>`));
  pages.forEach((p, i) => {
    const [pid, iid, cid] = [4 + i * 3, 5 + i * 3, 6 + i * 3];
    const landscape = p.width >= p.height;
    const W = landscape ? A4.long : A4.short;
    const H = landscape ? A4.short : A4.long;
    const k = Math.min(W / p.width, H / p.height);
    const w = p.width * k;
    const h = p.height * k;
    const content = `q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${((W - w) / 2).toFixed(2)} ${((H - h) / 2).toFixed(2)} cm /Im0 Do Q`;
    obj(pid, () => push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`));
    obj(iid, () => {
      push(`<< /Type /XObject /Subtype /Image /Width ${p.width} /Height ${p.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpeg.length} >>\nstream\n`);
      push(p.jpeg);
      push('\nendstream');
    });
    obj(cid, () => push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`));
  });
  const n = 4 + pages.length * 3;
  const xref = pos;
  push(`xref\n0 ${n}\n0000000000 65535 f \n`);
  for (let i = 1; i < n; i++) push(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  push(`trailer\n<< /Size ${n} /Root 1 0 R /Info 3 0 R >>\nstartxref\n${xref}\n%%EOF`);
  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/** Chaîne PDF : ASCII uniquement (accents retirés), caractères spéciaux échappés. */
function pdfText(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7e]/g, ' ').replace(/[()\\]/g, '\\$&');
}

/** Convertit une image PNG (Blob) en page JPEG pour le PDF. */
export async function pngToPdfPage(png: Blob, quality = 0.9): Promise<PdfPage> {
  const bmp = await createImageBitmap(png);
  const c = document.createElement('canvas');
  c.width = bmp.width;
  c.height = bmp.height;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();
  const jpg = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/jpeg', quality));
  if (!jpg) throw new Error('Conversion JPEG impossible');
  return { jpeg: new Uint8Array(await jpg.arrayBuffer()), width: c.width, height: c.height };
}
