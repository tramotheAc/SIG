import { useMemo } from 'react';
import type { FilteredView } from '../domain/patrimoineIndex';
import { useAppStore } from './useAppStore';

const EMPTY: string[] = [];

/** Vue filtrée mémoïsée (recalculée uniquement si données, filtres, coloration ou référentiels changent). */
export function useFilteredView(): FilteredView | undefined {
  const index = useAppStore((s) => s.index);
  const filters = useAppStore((s) => s.filters);
  const colorBy = useAppStore((s) => s.patrimoine.colorBy);
  const hiddenList = useAppStore((s) => s.patrimoine.hidden[colorBy] ?? EMPTY);
  const geoVersion = useAppStore((s) => s.geoVersion);
  return useMemo(() => {
    if (!index) return undefined;
    void geoVersion;
    return index.compute(filters, colorBy, new Set(hiddenList));
  }, [index, filters, colorBy, hiddenList, geoVersion]);
}
