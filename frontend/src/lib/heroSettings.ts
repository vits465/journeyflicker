import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { safeStorage } from './storage';

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
  home: string[];
  homeCustomSlides?: CustomHeroSlide[];
  tours: string[];
  destinations: string[];
  visaBanner?: string;
}

const STORAGE_KEY = 'jf_hero_settings'; // Fallback

export function useHeroSettings(page: HeroPage): string[] {
  const { data: ids = [] } = useQuery({
    queryKey: ['heroSettings', page],
    queryFn: async () => {
      try {
        const s = await api.getHeroSettings() as HeroSettings;
        return s[page] || [];
      } catch {
        const raw = safeStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw)[page] || [];
        return [];
      }
    }
  });

  return ids;
}

export function useAllHeroSettings() {
  const { data: settings = { home: [], homeCustomSlides: [], tours: [], destinations: [], visaBanner: '' }, isLoading } = useQuery({
    queryKey: ['allHeroSettings'],
    queryFn: async () => {
      try {
        return await api.getHeroSettings() as HeroSettings;
      } catch {
        const raw = safeStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as HeroSettings;
        return { home: [], homeCustomSlides: [], tours: [], destinations: [], visaBanner: '' };
      }
    }
  });

  return { settings, isLoading };
}
