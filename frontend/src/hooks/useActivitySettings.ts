import { useState, useCallback } from 'react';

const STORAGE_KEY = 'muffintop-activity-settings';

interface ActivitySettings {
  trackSeparately: boolean;
}

function loadSettings(): ActivitySettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { trackSeparately: false };
}

export function useActivitySettings() {
  const [settings, setSettings] = useState<ActivitySettings>(loadSettings);

  const setTrackSeparately = useCallback((value: boolean) => {
    const next = { trackSeparately: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  return { trackSeparately: settings.trackSeparately, setTrackSeparately };
}
