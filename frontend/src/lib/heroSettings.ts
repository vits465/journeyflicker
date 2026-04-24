/**
 * Hero Slides Settings — stored in localStorage
 * Key: "jf_hero_settings"
 * Value: { home: string[], tours: string[], destinations: string[] }
 *   — arrays of IDs (destination or tour IDs) in display order
 *
 * When the admin editor saves changes, it dispatches a custom storage event
 * so all open tabs update in real-time without a page refresh.
 */

import { useState, useEffect } from 'react';

export type HeroPage = 'home' | 'tours' | 'destinations';

export interface HeroSettings {
  home: string[];         // destination IDs
  tours: string[];        // tour IDs
  destinations: string[]; // destination IDs
  visaBanner?: string;    // image URL for Visa page
}

const STORAGE_KEY = 'jf_hero_settings';

function readSettings(): HeroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { home: [], tours: [], destinations: [], visaBanner: '' };
}

export function saveHeroSettings(settings: HeroSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  // Dispatch so other components on same tab also update
  window.dispatchEvent(new CustomEvent('jf-hero-update', { detail: settings }));
}

export function useHeroSettings(page: HeroPage): string[] {
  const [ids, setIds] = useState<string[]>(() => readSettings()[page]);

  useEffect(() => {
    const onStorage = () => setIds(readSettings()[page]);
    const onCustom = (e: Event) => {
      const s = (e as CustomEvent<HeroSettings>).detail;
      setIds(s[page]);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('jf-hero-update', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('jf-hero-update', onCustom);
    };
  }, [page]);

  return ids;
}

export function useAllHeroSettings() {
  const [settings, setSettings] = useState<HeroSettings>(readSettings);

  useEffect(() => {
    const onStorage = () => setSettings(readSettings());
    const onCustom = (e: Event) => setSettings((e as CustomEvent<HeroSettings>).detail);
    window.addEventListener('storage', onStorage);
    window.addEventListener('jf-hero-update', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('jf-hero-update', onCustom);
    };
  }, []);

  return { settings, save: saveHeroSettings };
}
