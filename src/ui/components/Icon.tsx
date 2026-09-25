/** Icônes SVG inline (tracés simples, 24×24, trait) — aucune dépendance externe. */
const PATHS: Record<string, string> = {
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5',
  layers: 'M12 3 2 8l10 5 10-5-10-5zM2 13l10 5 10-5M2 17.5l10 5 10-5',
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  close: 'M6 6l12 12M18 6 6 18',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.9 0 3.5-.6 4.9-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  zoom: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm10 17-5-5M8 11h6m-3-3v6',
  download: 'M12 3v12m0 0-5-5m5 5 5-5M4 19h16',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9h.01',
  table: 'M3 5h18v14H3zM3 10h18M3 15h18M9 5v14',
  upload: 'M12 21V9m0 0-5 5m5-5 5 5M4 5h16',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 8v5m0-8h.01',
  chevronRight: 'M9 5l7 7-7 7',
  chevronDown: 'M5 9l7 7 7-7',
  chevronLeft: 'M15 5l-7 7 7 7',
  up: 'M12 19V5m0 0-6 6m6-6 6 6',
  down: 'M12 5v14m0 0-6-6m6 6 6-6',
  sliders: 'M4 6h10m4 0h2M4 12h4m4 0h8M4 18h12m4 0h0M16 4v4M10 10v4M18 16v4',
  building: 'M5 21V4h10v17M15 9h4v12M8 8h2m-2 4h2m-2 4h2M3 21h18',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11zm0-13a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  warning: 'M12 3 2 20h20L12 3zm0 6v5m0 3h.01',
  reset: 'M4 4v6h6M20 20v-6h-6M5 15a7 7 0 0 0 12 3M19 9A7 7 0 0 0 7 6',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  external: 'M14 4h6v6m0-6-9 9M18 14v6H4V6h6',
  check: 'M4 12l5 5L20 6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0',
};

export function Icon({ name, size = 18, className }: { name: keyof typeof PATHS | string; size?: number; className?: string }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}
