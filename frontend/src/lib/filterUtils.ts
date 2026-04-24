/**
 * Hierarchical filter utilities — Territory → Region → Country → State
 * Derives all levels from existing destination/tour data.
 */

// ── Territory mapping (Region string → continent bucket) ──────────────────
const TERRITORY_RULES: [string, string[]][] = [
  ['Asia',        ['asia', 'japan', 'china', 'india', 'korea', 'thailand', 'vietnam', 'indonesia', 'singapore', 'malaysia', 'nepal', 'myanmar', 'cambodia', 'laos', 'philippines', 'taiwan', 'hong kong', 'bali', 'kyoto', 'tokyo', 'bali', 'sri lanka']],
  ['Europe',      ['europe', 'mediterranean', 'amalfi', 'italy', 'france', 'spain', 'greece', 'santorini', 'swiss', 'switzerland', 'nordic', 'scandinavia', 'germany', 'austria', 'portugal', 'croatia', 'turkey', 'iceland', 'netherlands', 'belgium', 'uk', 'england', 'scotland', 'ireland', 'czech', 'prague', 'budapest', 'hungary']],
  ['Americas',    ['america', 'canada', 'mexico', 'usa', 'united states', 'brazil', 'peru', 'argentina', 'chile', 'colombia', 'costa rica', 'patagonia', 'caribbean', 'cuba', 'jamaica', 'bahamas', 'north america', 'south america', 'central america', 'california', 'sierras', 'alaska']],
  ['Africa',      ['africa', 'kenya', 'morocco', 'egypt', 'tanzania', 'south africa', 'ethiopia', 'ghana', 'rwanda', 'botswana', 'senegal', 'madagascar', 'zanzibar', 'sahara', 'serengeti']],
  ['Middle East', ['middle east', 'dubai', 'jordan', 'petra', 'oman', 'qatar', 'israel', 'saudi', 'bahrain', 'kuwait']],
  ['Oceania',     ['oceania', 'australia', 'new zealand', 'pacific', 'fiji', 'bora bora', 'tahiti', 'maldives', 'palau', 'new caledonia']],
];

export function getTerritory(region: string): string {
  const lower = (region || '').toLowerCase();
  for (const [territory, keywords] of TERRITORY_RULES) {
    if (keywords.some(kw => lower.includes(kw))) return territory;
  }
  return 'Other';
}

// ── Extract country from a destination/tour name ───────────────────────────
// e.g. "Kyoto, Japan" → "Japan", "Amalfi Coast, Italy" → "Italy"
// Falls back to the region string if no comma found.
export function getCountry(name: string, region: string): string {
  if (name.includes(', ')) {
    const parts = name.split(', ');
    return parts[parts.length - 1].trim();
  }
  // Also try region (e.g. "Santorini, Greece" region value)
  if (region.includes(', ')) {
    const parts = region.split(', ');
    return parts[parts.length - 1].trim();
  }
  // Fallback — use the region itself as country level
  return region;
}

// ── Extract "state / sub-area" from name ──────────────────────────────────
// e.g. "Kyoto, Japan" → "Kyoto" (the first part), otherwise empty
export function getState(name: string, region: string): string {
  if (name.includes(', ')) {
    return name.split(', ')[0].trim();
  }
  if (region.includes(', ')) {
    return region.split(', ')[0].trim();
  }
  return '';
}

// ── Build filter option lists from a data array ───────────────────────────
export interface FilterOptions {
  territories: string[];
  regions: string[];
  countries: string[];
  states: string[];
}

export interface FilterState {
  territory: string;
  region: string;
  country: string;
  state: string;
}

export const EMPTY_FILTER: FilterState = { territory: '', region: '', country: '', state: '' };

type Filterable = { name: string; region: string };

export function buildFilterOptions(items: Filterable[], filter: FilterState): FilterOptions {
  const all = items;

  // Territories always show all options
  const territories = unique(all.map(i => getTerritory(i.region))).sort();

  // Regions — filtered by territory if set
  const afterTerr = filter.territory ? all.filter(i => getTerritory(i.region) === filter.territory) : all;
  const regions = unique(afterTerr.map(i => i.region)).sort();

  // Countries — filtered by territory+region
  const afterReg = filter.region ? afterTerr.filter(i => i.region === filter.region) : afterTerr;
  const countries = unique(afterReg.map(i => getCountry(i.name, i.region))).sort();

  // States — filtered by territory+region+country
  const afterCountry = filter.country ? afterReg.filter(i => getCountry(i.name, i.region) === filter.country) : afterReg;
  const states = unique(afterCountry.map(i => getState(i.name, i.region)).filter(Boolean)).sort();

  return { territories, regions, countries, states };
}

export function applyFilter<T extends Filterable>(items: T[], filter: FilterState): T[] {
  return items.filter(item => {
    if (filter.territory && getTerritory(item.region) !== filter.territory) return false;
    if (filter.region && item.region !== filter.region) return false;
    if (filter.country && getCountry(item.name, item.region) !== filter.country) return false;
    if (filter.state && getState(item.name, item.region) !== filter.state) return false;
    return true;
  });
}

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr));
}
