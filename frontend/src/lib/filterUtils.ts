/**
 * Hierarchical Travel Directory & Filter Utilities
 * Structured into Region -> Country / Destination based on JourneyFlicker Catalogue
 */

export interface DestinationItem {
  name: string;
  keywords: string[];
}

export interface RegionCategory {
  id: string;
  name: string;
  icon: string;
  destinations: DestinationItem[];
}

export const REGIONS_DIRECTORY: RegionCategory[] = [
  {
    id: 'india',
    name: 'India',
    icon: 'temple_hindu',
    destinations: [
      { name: 'Goa', keywords: ['goa', 'panaji', 'calangute', 'baga', 'candolim', 'anjuna', 'south goa', 'north goa'] },
      { name: 'Kerala', keywords: ['kerala', 'munnar', 'thekkady', 'alleppey', 'kochi', 'cochin', 'kovalam', 'wayanad', 'kumarakom', 'varkala', 'poovar'] },
      { name: 'Bhutan', keywords: ['bhutan', 'thimphu', 'paro', 'punakha', 'druk'] },
      { name: 'Gujarat', keywords: ['gujarat', 'ahmedabad', 'rann of kutch', 'kutch', 'somnath', 'dwarka', 'gir', 'statue of unity', 'sasangir'] },
      { name: 'Leh', keywords: ['leh', 'ladakh', 'pangong', 'nubra', 'zanskar', 'khardungla', 'kargil'] },
      { name: 'Himachal', keywords: ['himachal', 'manali', 'shimla', 'dharamshala', 'dalhousie', 'spiti', 'kullu', 'kasol', 'bir billing'] },
      { name: 'Uttarakhand', keywords: ['uttarakhand', 'rishikesh', 'haridwar', 'nainital', 'mussoorie', 'corbett', 'kedarnath', 'badrinath', 'auli', 'jim corbett', 'dehradun'] },
      { name: 'Rajasthan', keywords: ['rajasthan', 'jaipur', 'udaipur', 'jodhpur', 'jaisalmer', 'pushkar', 'bikaner', 'mount abu', 'ranthambore', 'shekhawati'] },
      { name: 'Nepal', keywords: ['nepal', 'kathmandu', 'pokhara', 'everest', 'chitwan', 'nagarkot'] },
      { name: 'Sikkim', keywords: ['sikkim', 'gangtok', 'pelling', 'lachung', 'yumthang', 'darjeeling', 'kalimpong', 'ravangla', 'nathula'] },
      { name: 'Kashmir', keywords: ['kashmir', 'srinagar', 'gulmarg', 'pahalgam', 'sonmarg', 'dal lake', 'doodhpathri'] },
      { name: 'Andaman', keywords: ['andaman', 'port blair', 'havelock', 'neil island', 'radhanagar', 'ross island'] },
      { name: 'Maharashtra', keywords: ['maharashtra', 'mumbai', 'pune', 'lonavala', 'mahabaleshwar', 'alibaug', 'shirdi', 'aurangabad', 'ajanta', 'ellora', 'matheran', 'nashik'] },
      { name: 'Karnataka & South India', keywords: ['karnataka', 'bangalore', 'bengaluru', 'mysore', 'coorg', 'hampi', 'kabini', 'ooty', 'kodaikanal', 'south india', 'chikmagalur', 'gokarna', 'badami'] },
      { name: 'Golden Triangle', keywords: ['golden triangle', 'delhi', 'agra', 'taj mahal'] },
      { name: 'Madhya Pradesh', keywords: ['madhya pradesh', 'bhopal', 'indore', 'khajuraho', 'kanha', 'bandhavgarh', 'ujjain', 'gwalior', 'orchha', 'pench'] },
      { name: 'Northeast', keywords: ['northeast', 'north east', 'assam', 'meghalaya', 'shillong', 'kaziranga', 'cherrapunji', 'arunachal', 'tawang', 'nagaland', 'manipur', 'tripura'] },
      { name: 'Odisha', keywords: ['odisha', 'orissa', 'puri', 'bhubaneswar', 'konark', 'chilika', 'jagannath'] },
      { name: 'Hyderabad', keywords: ['hyderabad', 'telangana', 'charminar', 'golconda', 'ramoji'] },
      { name: 'North Kerala', keywords: ['north kerala', 'kannur', 'bekal', 'calicut', 'kozhikode'] },
      { name: 'Uttar Pradesh', keywords: ['uttar pradesh', 'varanasi', 'banaras', 'kashi', 'lucknow', 'ayodhya', 'mathura', 'vrindavan', 'sarnath'] },
      { name: 'Lakshadweep Island', keywords: ['lakshadweep', 'agatti', 'bangaram', 'kavaratti', 'minicoy'] },
    ]
  },
  {
    id: 'asia',
    name: 'Asia',
    icon: 'temple_buddhist',
    destinations: [
      { name: 'Vietnam', keywords: ['vietnam', 'hanoi', 'ha long', 'da nang', 'hoi an', 'ho chi minh', 'saigon', 'phu quoc', 'sapa', 'nha trang', 'mekong'] },
      { name: 'China', keywords: ['china', 'beijing', 'shanghai', 'great wall', 'xian', 'guilin', 'chengdu'] },
      { name: 'Hong Kong', keywords: ['hong kong', 'hongkong', 'kowloon', 'victoria peak', 'lantau'] },
      { name: 'Japan', keywords: ['japan', 'tokyo', 'kyoto', 'osaka', 'mount fuji', 'fuji', 'hokkaido', 'nara', 'hiroshima'] },
      { name: 'Macau', keywords: ['macau', 'macao', 'taipa'] },
      { name: 'Philippines', keywords: ['philippines', 'manila', 'boracay', 'palawan', 'cebu', 'el nido', 'coron', 'bohol'] },
      { name: 'Bali', keywords: ['bali', 'indonesia', 'ubud', 'seminyak', 'nusa penida', 'kuta', 'canggu', 'gili', 'lombok', 'uluwatu'] },
      { name: 'South Korea', keywords: ['south korea', 'korea', 'seoul', 'busan', 'jeju', 'incheon'] },
      { name: 'Singapore Malaysia', keywords: ['singapore malaysia', 'singapore & malaysia', 'singapore and malaysia'] },
      { name: 'Singapore Bali', keywords: ['singapore bali', 'singapore & bali', 'singapore and bali'] },
      { name: 'Maldives', keywords: ['maldives', 'male', 'ari atoll', 'overwater', 'maafushi'] },
      { name: 'Sri Lanka', keywords: ['sri lanka', 'colombo', 'kandy', 'galle', 'bentota', 'sigiriya', 'nuwara eliya', 'ella', 'yala'] },
      { name: 'Singapore', keywords: ['singapore', 'sentosa', 'marina bay', 'gardens by the bay'] },
      { name: 'Malaysia', keywords: ['malaysia', 'kuala lumpur', 'langkawi', 'penang', 'genting', 'borneo'] },
      { name: 'Thailand', keywords: ['thailand', 'bangkok', 'phuket', 'pattaya', 'krabi', 'koh samui', 'chiang mai', 'phi phi', 'ayutthaya'] },
    ]
  },
  {
    id: 'central-europe',
    name: 'Central Europe',
    icon: 'castle',
    destinations: [
      { name: 'Finland', keywords: ['finland', 'helsinki', 'lapland', 'rovaniemi', 'northern lights'] },
      { name: 'France', keywords: ['france', 'paris', 'nice', 'cannes', 'french riviera', 'bordeaux', 'lyon', 'chamonix', 'monaco', 'versailles'] },
      { name: 'Germany', keywords: ['germany', 'berlin', 'munich', 'bavaria', 'frankfurt', 'black forest', 'cologne', 'hamburg'] },
      { name: 'Iceland', keywords: ['iceland', 'reykjavik', 'golden circle', 'blue lagoon', 'vik', 'south coast'] },
      { name: 'Italy', keywords: ['italy', 'rome', 'florence', 'venice', 'milan', 'amalfi', 'amalfi coast', 'tuscany', 'como', 'lake como', 'cinque terre', 'capri', 'naples', 'sicily'] },
      { name: 'Norway', keywords: ['norway', 'oslo', 'bergen', 'fjords', 'tromso', 'geirangerfjord', 'flam'] },
      { name: 'Portugal', keywords: ['portugal', 'lisbon', 'porto', 'algarve', 'sintra', 'madeira'] },
      { name: 'Spain', keywords: ['spain', 'barcelona', 'madrid', 'seville', 'ibiza', 'mallorca', 'andalusia', 'valencia', 'granada', 'costa del sol'] },
      { name: 'Switzerland', keywords: ['switzerland', 'swiss', 'zurich', 'lucerne', 'interlaken', 'geneva', 'zermatt', 'alps', 'jungfrau', 'matterhorn', 'titlis', 'montreux'] },
      { name: 'UK - Scotland', keywords: ['uk', 'united kingdom', 'london', 'scotland', 'edinburgh', 'highlands', 'england', 'britain', 'loch ness', 'oxford', 'cambridge'] },
      { name: 'Netherlands', keywords: ['netherlands', 'holland', 'amsterdam', 'rotterdam', 'keukenhof', 'zaanse schans'] },
      { name: 'Switzerland - Paris', keywords: ['switzerland - paris', 'swiss paris', 'swiss & paris', 'paris switzerland', 'paris & swiss'] },
      { name: 'All Of Europe', keywords: ['all of europe', 'europe grand', 'european panoramic', 'central europe'] },
      { name: 'Austria', keywords: ['austria', 'vienna', 'salzburg', 'innsbruck', 'hallstatt', 'tyrol'] },
      { name: 'Ireland', keywords: ['ireland', 'dublin', 'galway', 'cliffs of moher', 'ring of kerry'] },
      { name: 'Scandinavia', keywords: ['scandinavia', 'nordic', 'denmark', 'copenhagen', 'sweden', 'stockholm', 'gothenburg'] },
    ]
  },
  {
    id: 'east-europe',
    name: 'East Europe',
    icon: 'fort',
    destinations: [
      { name: 'Baltic', keywords: ['baltic', 'estonia', 'latvia', 'lithuania', 'tallinn', 'riga', 'vilnius'] },
      { name: 'Croatia', keywords: ['croatia', 'dubrovnik', 'split', 'zagreb', 'plitvice', 'hvar'] },
      { name: 'Czech Republic', keywords: ['czech', 'czech republic', 'prague', 'cesky krumlov', 'bohemia'] },
      { name: 'Greece', keywords: ['greece', 'athens', 'santorini', 'mykonos', 'crete', 'rhodes', 'meteora', 'acropolis'] },
      { name: 'Hungary', keywords: ['hungary', 'budapest', 'danube'] },
      { name: 'Poland', keywords: ['poland', 'krakow', 'warsaw', 'gdansk', 'wroclaw'] },
      { name: 'Russia', keywords: ['russia', 'moscow', 'st petersburg', 'saint petersburg', 'siberia', 'baikal'] },
      { name: 'Turkey', keywords: ['turkey', 'istanbul', 'cappadocia', 'antalya', 'bodrum', 'pamukkale', 'ephesus', 'izmir'] },
      { name: 'Greece - Turkey', keywords: ['greece - turkey', 'greece turkey', 'greece & turkey', 'aegean'] },
      { name: 'All of East Europe', keywords: ['east europe', 'eastern europe', 'balkans', 'romania', 'bulgaria'] },
    ]
  },
  {
    id: 'middle-east',
    name: 'Middle East',
    icon: 'mosque',
    destinations: [
      { name: 'Baku - Azerbaijan', keywords: ['baku', 'azerbaijan', 'gobustan', 'gabala'] },
      { name: 'Israel - Jordan', keywords: ['israel', 'jordan', 'petra', 'jerusalem', 'dead sea', 'amman', 'wadi rum', 'tel aviv'] },
      { name: 'Oman Muscat', keywords: ['oman', 'muscat', 'salalah', 'wahiba', 'nizwa'] },
      { name: 'UAE - Dubai', keywords: ['uae', 'dubai', 'abu dhabi', 'sharjah', 'burj khalifa', 'emirates', 'yas island'] },
      { name: 'Georgia', keywords: ['georgia', 'tbilisi', 'batumi', 'kazbegi', 'kakheti'] },
      { name: 'Armenia', keywords: ['armenia', 'yerevan', 'sevan'] },
      { name: 'Uzbekistan', keywords: ['uzbekistan', 'tashkent', 'samarkand', 'bukhara', 'khiva', 'silk road'] },
      { name: 'Kazakhstan', keywords: ['kazakhstan', 'almaty', 'astana', 'shymbulak'] },
      { name: 'Saudi Arabia', keywords: ['saudi', 'saudi arabia', 'riyadh', 'jeddah', 'al ula', 'mecca', 'medina', 'red sea'] },
    ]
  },
  {
    id: 'africa',
    name: 'Africa',
    icon: 'travel_explore',
    destinations: [
      { name: 'Botswana', keywords: ['botswana', 'okavango', 'chobe', 'kalahari'] },
      { name: 'Egypt', keywords: ['egypt', 'cairo', 'giza', 'pyramids', 'nile', 'luxor', 'aswan', 'hurghada', 'sharm el sheikh', 'alexandria'] },
      { name: 'Mauritius', keywords: ['mauritius', 'port louis', 'flic en flac', 'grand baie', 'le morne'] },
      { name: 'Seychelles', keywords: ['seychelles', 'mahe', 'praslin', 'la digue', 'anse source dargent'] },
      { name: 'Zambia', keywords: ['zambia', 'victoria falls', 'livingstone', 'south luangwa'] },
      { name: 'Zimbabwe', keywords: ['zimbabwe', 'harare', 'hwange'] },
      { name: 'South Africa', keywords: ['south africa', 'cape town', 'johannesburg', 'kruger', 'garden route', 'table mountain', 'durban'] },
      { name: 'Kenya', keywords: ['kenya', 'masai mara', 'nairobi', 'amboseli', 'lake nakuru', 'tsavo'] },
      { name: 'Tanzania', keywords: ['tanzania', 'serengeti', 'zanzibar', 'kilimanjaro', 'ngorongoro', 'tarangire'] },
      { name: 'Uganda', keywords: ['uganda', 'bwindi', 'kampala', 'gorilla', 'queen elizabeth national park'] },
      { name: 'Morocco', keywords: ['morocco', 'marrakech', 'casablanca', 'fes', 'chefchaouen', 'sahara', 'rabat'] },
      { name: 'Madagascar', keywords: ['madagascar', 'antananarivo', 'nosy be', 'baobab'] },
    ]
  },
  {
    id: 'america',
    name: 'America',
    icon: 'forest',
    destinations: [
      { name: 'Central America', keywords: ['central america', 'costa rica', 'panama', 'guatemala', 'belize'] },
      { name: 'USA - United States', keywords: ['usa', 'united states', 'new york', 'california', 'los angeles', 'san francisco', 'las vegas', 'florida', 'miami', 'orlando', 'chicago', 'grand canyon', 'yellowstone', 'washington dc'] },
      { name: 'Canada', keywords: ['canada', 'toronto', 'vancouver', 'banff', 'niagara', 'montreal', 'quebec', 'canadian rockies', 'jasper', 'whistler'] },
      { name: 'Alaska', keywords: ['alaska', 'anchorage', 'juneau', 'glacier', 'denali'] },
      { name: 'South America', keywords: ['south america', 'brazil', 'rio de janeiro', 'peru', 'machu picchu', 'argentina', 'buenos aires', 'chile', 'patagonia', 'colombia', 'iguazu'] },
      { name: 'Mexico', keywords: ['mexico', 'cancun', 'mexico city', 'tulum', 'riviera maya', 'playa del carmen', 'chichen itza'] },
      { name: 'Hawaii', keywords: ['hawaii', 'honolulu', 'oahu', 'maui', 'kauai', 'waikiki'] },
    ]
  },
  {
    id: 'australia-nz',
    name: 'Australia & NZ',
    icon: 'surfing',
    destinations: [
      { name: 'Australia', keywords: ['australia', 'sydney', 'melbourne', 'gold coast', 'cairns', 'great barrier reef', 'brisbane', 'perth', 'adelaide', 'tasmania'] },
      { name: 'New Zealand', keywords: ['new zealand', 'auckland', 'queenstown', 'rotorua', 'christchurch', 'milford sound', 'wellington', 'wanaka'] },
      { name: 'Fiji & Bora Bora', keywords: ['fiji', 'bora bora', 'tahiti', 'french polynesia', 'south pacific', 'moorea'] },
      { name: 'Australia - New Zealand', keywords: ['australia - new zealand', 'australia & new zealand', 'aus nz', 'australia new zealand'] },
    ]
  }
];

export interface TourFilterState {
  region: string;      // Region Name e.g. "India", "Asia", "Central Europe", or "" for All
  country: string;     // Country / Destination Name e.g. "Kerala", "Switzerland", or ""
  search: string;      // Free-text search
  category: string;    // E.g. "Luxury Expedition", "Heritage", etc.
  maxDays: string;     // E.g. "5", "8", "10", "14"
}

export const INITIAL_TOUR_FILTER: TourFilterState = {
  region: '',
  country: '',
  search: '',
  category: '',
  maxDays: ''
};

// Legacy Filter compatibility
export interface FilterState {
  territory: string;
  region: string;
  country: string;
  state: string;
}

export const EMPTY_FILTER: FilterState = { territory: '', region: '', country: '', state: '' };

type FilterableTour = {
  name: string;
  region?: string;
  category?: string;
  days?: number;
  overviewDescription?: string;
  overviewExtended?: string;
  itinerary?: { title?: string; description?: string }[];
};

/**
 * Returns searchable text blob for a tour
 */
function getTourSearchText(tour: FilterableTour): string {
  const parts: string[] = [
    tour.name || '',
    tour.region || '',
    tour.category || '',
    tour.overviewDescription || '',
    tour.overviewExtended || '',
  ];

  if (tour.itinerary && Array.isArray(tour.itinerary)) {
    for (const d of tour.itinerary) {
      if (d.title) parts.push(d.title);
      if (d.description) parts.push(d.description);
    }
  }

  return parts.join(' ').toLowerCase();
}

/**
 * Matches a tour to a Country/Destination configuration
 */
export function matchTourToDestination(tour: FilterableTour, dest: DestinationItem): boolean {
  const text = getTourSearchText(tour);
  return dest.keywords.some(kw => text.includes(kw.toLowerCase()));
}

/**
 * Matches a tour to a RegionCategory
 */
export function matchTourToRegion(tour: FilterableTour, regionCat: RegionCategory): boolean {
  const text = getTourSearchText(tour);

  // Check direct region name
  if (text.includes(regionCat.name.toLowerCase())) return true;
  if (regionCat.id === 'america' && (text.includes('usa') || text.includes('united states') || text.includes('canada') || text.includes('mexico'))) return true;
  if (regionCat.id === 'central-europe' && (text.includes('europe') || text.includes('swiss') || text.includes('paris') || text.includes('italy'))) return true;
  if (regionCat.id === 'east-europe' && (text.includes('greece') || text.includes('turkey') || text.includes('croatia') || text.includes('russia') || text.includes('prague'))) return true;
  if (regionCat.id === 'australia-nz' && (text.includes('australia') || text.includes('new zealand') || text.includes('fiji') || text.includes('oceania'))) return true;

  // Check any destination within region
  return regionCat.destinations.some(dest => matchTourToDestination(tour, dest));
}

/**
 * Comprehensive Filter Applicator for Tours Page
 */
export function filterTours<T extends FilterableTour>(tours: T[], filter: TourFilterState): T[] {
  return tours.filter(tour => {
    // 1. Filter by Region if selected
    if (filter.region) {
      const regCat = REGIONS_DIRECTORY.find(r => r.name.toLowerCase() === filter.region.toLowerCase() || r.id === filter.region.toLowerCase());
      if (regCat) {
        if (!matchTourToRegion(tour, regCat)) return false;
      } else {
        const text = getTourSearchText(tour);
        if (!text.includes(filter.region.toLowerCase())) return false;
      }
    }

    // 2. Filter by Country/Destination if selected
    if (filter.country) {
      let matched = false;
      // Search all destinations across directory
      for (const reg of REGIONS_DIRECTORY) {
        const d = reg.destinations.find(dest => dest.name.toLowerCase() === filter.country.toLowerCase());
        if (d) {
          if (matchTourToDestination(tour, d)) {
            matched = true;
            break;
          }
        }
      }
      // Fallback text check
      if (!matched) {
        const text = getTourSearchText(tour);
        if (text.includes(filter.country.toLowerCase())) {
          matched = true;
        }
      }
      if (!matched) return false;
    }

    // 3. Search query
    if (filter.search && filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      const text = getTourSearchText(tour);
      if (!text.includes(q)) return false;
    }

    // 4. Category filter
    if (filter.category) {
      if (tour.category !== filter.category) return false;
    }

    // 5. Max Days filter
    if (filter.maxDays) {
      const max = Number(filter.maxDays);
      if (!isNaN(max) && max > 0 && tour.days && tour.days > max) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Gets count of tours for each region
 */
export function getRegionTourCounts(tours: FilterableTour[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const reg of REGIONS_DIRECTORY) {
    counts[reg.name] = tours.filter(t => matchTourToRegion(t, reg)).length;
  }
  return counts;
}

/**
 * Gets count of tours for a specific destination
 */
export function getDestinationTourCount(tours: FilterableTour[], dest: DestinationItem): number {
  return tours.filter(t => matchTourToDestination(t, dest)).length;
}

// ── Legacy Helpers to prevent breakage ─────────────────────────────────────
export function getTerritory(region: string): string {
  const lower = (region || '').toLowerCase();
  for (const reg of REGIONS_DIRECTORY) {
    if (reg.destinations.some(d => d.keywords.some(k => lower.includes(k)))) {
      return reg.name;
    }
  }
  return 'Other';
}

export function getCountry(name: string, region: string): string {
  if (name.includes(', ')) {
    return name.split(', ')[1].trim();
  }
  return region || '';
}

export function getState(name: string, region: string): string {
  if (name.includes(', ')) {
    return name.split(', ')[0].trim();
  }
  return '';
}

export function buildFilterOptions(items: any[], _filter: any) {
  return {
    territories: REGIONS_DIRECTORY.map(r => r.name),
    regions: Array.from(new Set(items.map(i => i.region))).filter(Boolean).sort(),
    countries: [],
    states: []
  };
}

export function applyFilter<T extends FilterableTour>(items: T[], filter: FilterState): T[] {
  return filterTours(items, {
    region: filter.region || filter.territory,
    country: filter.country,
    search: '',
    category: '',
    maxDays: ''
  });
}
