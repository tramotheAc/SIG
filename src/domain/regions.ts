/** Régions de France métropolitaine (code INSEE région → nom, départements). */
export const REGIONS: { code: string; nom: string; deps: string[] }[] = [
  { code: '84', nom: 'Auvergne-Rhône-Alpes', deps: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'] },
  { code: '27', nom: 'Bourgogne-Franche-Comté', deps: ['21', '25', '39', '58', '70', '71', '89', '90'] },
  { code: '53', nom: 'Bretagne', deps: ['22', '29', '35', '56'] },
  { code: '24', nom: 'Centre-Val de Loire', deps: ['18', '28', '36', '37', '41', '45'] },
  { code: '94', nom: 'Corse', deps: ['2A', '2B'] },
  { code: '44', nom: 'Grand Est', deps: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'] },
  { code: '32', nom: 'Hauts-de-France', deps: ['02', '59', '60', '62', '80'] },
  { code: '11', nom: 'Île-de-France', deps: ['75', '77', '78', '91', '92', '93', '94', '95'] },
  { code: '28', nom: 'Normandie', deps: ['14', '27', '50', '61', '76'] },
  { code: '75', nom: 'Nouvelle-Aquitaine', deps: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'] },
  { code: '76', nom: 'Occitanie', deps: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'] },
  { code: '52', nom: 'Pays de la Loire', deps: ['44', '49', '53', '72', '85'] },
  { code: '93', nom: 'Provence-Alpes-Côte d’Azur', deps: ['04', '05', '06', '13', '83', '84'] },
];

const byDep = new Map(REGIONS.flatMap((r) => r.deps.map((d) => [d, r.code] as const)));
export const regionOfDep = (dep?: string) => (dep ? byDep.get(dep.toUpperCase()) : undefined);
export const regionName = (code: string) => REGIONS.find((r) => r.code === code)?.nom ?? code;

export const DEPARTEMENT_NAMES: Record<string, string> = {
  '22': 'Côtes-d’Armor', '29': 'Finistère', '35': 'Ille-et-Vilaine', '56': 'Morbihan', '44': 'Loire-Atlantique',
  '49': 'Maine-et-Loire', '53': 'Mayenne', '72': 'Sarthe', '85': 'Vendée', '50': 'Manche', '61': 'Orne',
};
