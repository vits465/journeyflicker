import { useState, useEffect } from 'react';
import { api } from './api';

export type HeroPage = 'home' | 'tours' | 'destinations';

export interface HeroSettings {
  home: string[];
  tours: string[];
  destinations: string[];
  visaBanner?: string;
}

const STORAGE_KEY = 'jf_hero_settings'; // Fallback

export function useHeroSettings(page: HeroPage): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    // Try API first
    api.getHeroSettings()
      .then(s => setIds(s[page] || []))
      .catch(() => {
        // Fallback to local storage if API fails
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setIds(JSON.parse(raw)[page] || []);
        } catch { /* ignore */ }
      });
  }, [page]);

  return ids;
}

export function useAllHeroSettings() {
  const [settings, setSettings] = useState<HeroSettings>({ home: [], tours: [], destinations: [], visaBanner: '' });

  useEffect(() => {
    api.getHeroSettings()
      .then(setSettings)
      .catch(() => {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) setSettings(JSON.parse(raw));
        } catch { /* ignore */ }
      });
  }, []);

  return { settings };
}
