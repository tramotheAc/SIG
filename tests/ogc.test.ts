// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { describeResponse, modernizeIgnUrl, parseWms, parseWmts } from '../src/admin/ogcCapabilities';

const IGN_WMTS = `<?xml version="1.0"?><Capabilities xmlns="http://www.opengis.net/wmts/1.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0.0">
<ows:OperationsMetadata><ows:Operation name="GetTile"><ows:DCP><ows:HTTP><ows:Get xlink:href="https://data.geopf.fr/wmts?"/></ows:HTTP></ows:DCP></ows:Operation></ows:OperationsMetadata>
<Contents><Layer><ows:Title>Parcellaire</ows:Title><ows:Identifier>CADASTRALPARCELS.PARCELLAIRE_EXPRESS</ows:Identifier><Style isDefault="true"><ows:Identifier>PCI vecteur</ows:Identifier></Style><Format>image/png</Format><TileMatrixSetLink><TileMatrixSet>PM</TileMatrixSet></TileMatrixSetLink></Layer>
<TileMatrixSet><ows:Identifier>PM</ows:Identifier><ows:SupportedCRS>EPSG:3857</ows:SupportedCRS><TileMatrix><ows:Identifier>0</ows:Identifier></TileMatrix></TileMatrixSet></Contents></Capabilities>`;

const WMS = `<?xml version="1.0"?><WMS_Capabilities version="1.3.0" xmlns="http://www.opengis.net/wms" xmlns:xlink="http://www.w3.org/1999/xlink">
<Capability><Request><GetMap><DCPType><HTTP><Get><OnlineResource xlink:href="https://data.geopf.fr/wms-r/wms?"/></Get></HTTP></DCPType></GetMap></Request>
<Layer><Title>Racine</Title><Layer><Name>INONDATION</Name><Title>Zones inondables</Title></Layer></Layer></Capability></WMS_Capabilities>`;

describe('GetCapabilities', () => {
  it('WMTS IGN : URL de tuiles Web Mercator', () => {
    const [l] = parseWmts(IGN_WMTS, 'https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities');
    expect(l.url).toBe('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS&STYLE=PCI%20vecteur&FORMAT=image%2Fpng&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}');
  });
  it('WMTS réel (échantillon OpenLayers)', () => {
    expect(parseWmts(readFileSync('tests/fixtures/wmts-ol.xml', 'utf8'), 'https://x/wmts').length).toBeGreaterThan(0);
  });
  it('WMS 1.3.0', () => {
    const [l] = parseWms(WMS, 'https://data.geopf.fr/wms-r/wms?REQUEST=GetCapabilities');
    expect(l).toMatchObject({ id: 'INONDATION', title: 'Zones inondables' });
    expect(l.url).toContain('https://data.geopf.fr/wms-r/wms?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=INONDATION');
    expect(l.url).toContain('CRS=EPSG:3857&BBOX={bbox-epsg-3857}');
  });
  it('WMS : projection héritée et couche non Web Mercator signalée', () => {
    const xml = WMS.replace('<Layer><Title>Racine</Title>', '<Layer><Title>Racine</Title><CRS>EPSG:2154</CRS><CRS>EPSG:900913</CRS>').replace('</Layer></Layer>', '</Layer><Layer><Name>L93</Name><Title>Seulement L93</Title></Layer></Layer>');
    const out = parseWms(xml.replace('EPSG:900913', 'EPSG:900913'), 'https://s/wms');
    expect(out.find((l) => l.id === 'INONDATION')!.url).toContain('CRS=EPSG:900913');
    const only = parseWms(WMS.replace('<Layer><Name>INONDATION', '<Layer><CRS>EPSG:2154</CRS><Name>INONDATION'), 'https://s/wms');
    expect(only[0].warning).toMatch(/Web Mercator/);
  });
  it('diagnostic d’une réponse non XML', () => {
    expect(describeResponse('<html><body>Accès bloqué par le proxy</body></html>x<')).toMatch(/pas du XML|Document/);
  });
  it('conversion des anciennes adresses wxs.ign.fr', () => {
    expect(modernizeIgnUrl('https://wxs.ign.fr/parcellaire/geoportail/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities').url).toBe(
      'https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities',
    );
  });
});
