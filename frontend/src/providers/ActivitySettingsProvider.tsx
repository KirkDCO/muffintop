import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'muffintop-activity-settings';

interface ActivitySettings {
  trackSeparately: boolean;
}

interface ActivitySettingsContextValue extends ActivitySettings {
  setTrackSeparately: (value: boolean) => void;
}

const ActivitySettingsContext = createContext<ActivitySettingsContextValue | undefined>(undefined);

function loadSettings(): ActivitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { trackSeparately: false };
}

export function ActivitySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ActivitySettings>(loadSettings);

  const setTrackSeparately = useCallback((value: boolean) => {
    const next = { trackSeparately: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return (
    <ActivitySettingsContext.Provider value={{ trackSeparately: settings.trackSeparately, setTrackSeparately }}>
      {children}
    </ActivitySettingsContext.Provider>
  );
}

export function useActivitySettings(): ActivitySettingsContextValue {
  const context = useContext(ActivitySettingsContext);
  if (context === undefined) {
    throw new Error('useActivitySettings must be used within an ActivitySettingsProvider');
  }
  return context;
}
