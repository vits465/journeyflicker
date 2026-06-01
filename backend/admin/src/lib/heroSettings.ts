import { useState, useEffect } from 'react';
import { api } from './api';

export type HeroPage = 'home' | 'tours' | 'destinations';

export interface CustomHeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  tag?: string;
  href?: string;
}

export interface HeroSettings {
  home: string[];         // destination IDs
  homeCustomSlides?: CustomHeroSlide[]; // custom uploaded slides
  tours: string[];        // tour IDs
  destinations: string[]; // destination IDs
  visaBanner?: string;    // image URL for Visa page
}

const DEFAULT: HeroSettings = { home: [], homeCustomSlides: [], tours: [], destinations: [], visaBanner: '' };

export function useHeroSettings(page: HeroPage): string[] {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    api.getHeroSettings()
      .then(s => { const hs = s as HeroSettings; setIds(hs[page] || []); })
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
        setSettings(s as HeroSettings);
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
