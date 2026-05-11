import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const { data: ids = [] } = useQuery({
    queryKey: ['heroSettings', page],
    queryFn: async () => {
      try {
        const s = await api.getHeroSettings();
        return s[page] || [];
      } catch {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw)[page] || [];
        return [];
      }
    }
  });

  return ids;
}

export function useAllHeroSettings() {
  const { data: settings = { home: [], tours: [], destinations: [], visaBanner: '' } } = useQuery({
    queryKey: ['allHeroSettings'],
    queryFn: async () => {
      try {
        return await api.getHeroSettings();
      } catch {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
        return { home: [], tours: [], destinations: [], visaBanner: '' };
      }
    }
  });

  return { settings };
}
