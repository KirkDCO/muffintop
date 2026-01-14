import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useUser } from './UserProvider';
import { useNutrientPreferences } from '../hooks/useNutrientPreferences';
import {
  NUTRIENT_REGISTRY,
  ALL_NUTRIENT_KEYS,
  DEFAULT_VISIBLE_NUTRIENTS,
  type NutrientKey,
  type NutrientDefinition,
  type NutrientValues,
} from '@muffintop/shared/types';

interface NutrientContextValue {
  /** List of nutrients the user wants to see */
  visibleNutrients: NutrientKey[];
  /** Full registry of all nutrient definitions */
  nutrientRegistry: Record<NutrientKey, NutrientDefinition>;
  /** All available nutrient keys */
  allNutrientKeys: readonly NutrientKey[];
  /** Whether preferences are loading */
  isLoading: boolean;
  /** Get definition for a nutrient */
  getNutrientDef: (key: NutrientKey) => NutrientDefinition;
  /** Filter nutrients to only visible ones */
  filterVisibleNutrients: (nutrients: NutrientValues) => Partial<NutrientValues>;
  /** Check if a nutrient is visible */
  isNutrientVisible: (key: NutrientKey) => boolean;
}

const NutrientContext = createContext<NutrientContextValue | undefined>(undefined);

export function NutrientProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useUser();
  const { data: preferences, isLoading } = useNutrientPreferences(currentUser?.id ?? null);

  const visibleNutrients = useMemo(() => {
    return preferences?.visibleNutrients ?? DEFAULT_VISIBLE_NUTRIENTS;
  }, [preferences]);

  const visibleSet = useMemo(() => new Set(visibleNutrients), [visibleNutrients]);

  const value = useMemo<NutrientContextValue>(
    () => ({
      visibleNutrients,
      nutrientRegistry: NUTRIENT_REGISTRY,
      allNutrientKeys: ALL_NUTRIENT_KEYS,
      isLoading,
      getNutrientDef: (key: NutrientKey) => NUTRIENT_REGISTRY[key],
      filterVisibleNutrients: (nutrients: NutrientValues) => {
        const filtered: Partial<NutrientValues> = {};
        for (const key of visibleNutrients) {
          filtered[key] = nutrients[key];
        }
        return filtered;
      },
      isNutrientVisible: (key: NutrientKey) => visibleSet.has(key),
    }),
    [visibleNutrients, visibleSet, isLoading]
  );

  return <NutrientContext.Provider value={value}>{children}</NutrientContext.Provider>;
}

export function useNutrients(): NutrientContextValue {
  const context = useContext(NutrientContext);
  if (context === undefined) {
    throw new Error('useNutrients must be used within a NutrientProvider');
  }
  return context;
}
