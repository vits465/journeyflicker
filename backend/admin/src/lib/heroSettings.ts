import { useState, useEffect } from 'react';
import { api } from './api';

export type HeroPage = 'home' | 'tours' | 'destinations';

export interface HeroSettings {
  home: string[];         // destination IDs
  tours: string[];        // tour IDs
  destinations: string[]; // destination IDs
  visaBanner?: string;    // image URL for Visa page
}

const DEFAULT: HeroSettings = { home: [], tours: [], destinations: [], visaBanner: '' };

export function useHeroSettings(page: HeroPage): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    api.getHeroSettings()
      .then(s => setIds(s[page] || []))
      .catch(console.error);
  }, [page]);

  return ids;
}

export function useAllHeroSettings() {
  const [settings, setSettings] = useState<HeroSettings>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const fetchSettings = () => {
    api.getHeroSettings()
      .then(s => {
        setSettings(s);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const save = async (newSettings: HeroSettings) => {
    try {
      await api.updateHeroSettings(newSettings);
      setSettings(newSettings);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  return { settings, save, loading, refresh: fetchSettings };
}
