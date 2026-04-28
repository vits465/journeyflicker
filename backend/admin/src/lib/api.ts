export const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type Destination = {
  id: string;
  name: string;
  region: string;
  description?: string;
  heroImageUrl?: string;
  essenceText?: string;
  landmarks?: { title: string; category: string; description: string; imageUrl: string }[];
  bestSeasonsTitle?: string;
  bestSeasonsMonths?: string;
  seasonsHighlights?: { season: string; description: string }[];
  galleryImages?: string[];
};

export type Tour = {
  id: string;
  name: string;
  region: string;
  days: number;
  price: string;
  category: string;
  rating?: number;
  heroImageUrl?: string;
  overviewDescription?: string;
  overviewExtended?: string;
  overviewImageUrl?: string;
  transport?: string;
  guide?: string;
  pickup?: string;
  itinerary?: {
    title: string;
    description: string;
    imageUrl?: string;
    schedule?: string;
    accommodation?: string;
    meals?: string;
  }[];
  sightseeing?: { title: string; description: string; icon: string; imageUrl?: string }[];
  visualArchive?: string[];
  testimonials?: { quote: string; author: string }[];
  departureWindows?: string[];
  maxGuests?: number;
};

export type Visa = {
  id: string;
  country: string;
  processing: string;
  difficulty: string;
  fee: string;
  heroImageUrl?: string;
  description?: string;
  visaType?: string;
  documents?: string[];
  requirements?: { label: string; detail: string }[];
};

export type Contact = {
  id: string;
  name: string;
  email: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: number;
};

export type Backup = {
  filename: string;
  size: number;
  createdAt: number;
};

export type Media = {
  id: string;
  url: string;
  name: string;
  size: string;
  type: string;
  date: string;
  folder: string;
};

export type SeoPage = {
  id: string;
  name: string;
  path: string;
  title: string;
  desc: string;
  ogImage?: string;
};

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionStorage.getItem("jf_token");
  const headers: HeadersInit = {
    "content-type": "application/json",
    ...(init?.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    sessionStorage.removeItem("jf_admin_auth");
    sessionStorage.removeItem("jf_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export async function uploadImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = reader.result as string;
        const res = await http<{ url: string }>("/upload", {
          method: "POST",
          body: JSON.stringify({ name: file.name, data }),
        });
        resolve(res.url);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface ApiInterface {
  listDestinations: () => Promise<Destination[]>;
  getDestination: (id: string) => Promise<Destination>;
  createDestination: (data: Partial<Destination>) => Promise<Destination>;
  updateDestination: (id: string, data: Partial<Destination>) => Promise<Destination>;
  deleteDestination: (id: string) => Promise<void>;
  listTours: () => Promise<Tour[]>;
  getTour: (id: string) => Promise<Tour>;
  createTour: (data: Partial<Tour>) => Promise<Tour>;
  updateTour: (id: string, data: Partial<Tour>) => Promise<Tour>;
  deleteTour: (id: string) => Promise<void>;
  listVisas: () => Promise<Visa[]>;
  createVisa: (data: Partial<Visa>) => Promise<Visa>;
  updateVisa: (id: string, data: Partial<Visa>) => Promise<Visa>;
  deleteVisa: (id: string) => Promise<void>;
  listContacts: () => Promise<Contact[]>;
  createContact: (data: { name: string; email: string; type: string; message: string }) => Promise<Contact>;
  markContactRead: (id: string) => Promise<Contact>;
  deleteContact: (id: string) => Promise<void>;
  listBackups: () => Promise<Backup[]>;
  createBackup: () => Promise<{ success: boolean; filename: string }>;
  restoreBackup: (filename: string) => Promise<{ success: boolean }>;
  getHeroSettings: () => Promise<any>;
  updateHeroSettings: (settings: any) => Promise<void>;
  search: (q: string) => Promise<{ destinations: Destination[]; tours: Tour[] }>;
  listMedia: () => Promise<Media[]>;
  createMedia: (data: Omit<Media, 'id'>) => Promise<Media>;
  deleteMedia: (id: string) => Promise<void>;
  getSeoSettings: () => Promise<SeoPage[]>;
  updateSeoSettings: (settings: SeoPage[]) => Promise<void>;
}

export const api: ApiInterface = {
  listDestinations: () => http<Destination[]>("/destinations"),
  getDestination: (id: string) => http<Destination>(`/destinations/${id}`),
  createDestination: (data: Partial<Destination>) => http<Destination>("/destinations", { method: "POST", body: JSON.stringify(data) }),
  updateDestination: (id: string, data: Partial<Destination>) => http<Destination>(`/destinations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDestination: (id: string) => http<void>(`/destinations/${id}`, { method: "DELETE" }),

  listTours: () => http<Tour[]>("/tours"),
  getTour: (id: string) => http<Tour>(`/tours/${id}`),
  createTour: (data: Partial<Tour>) => http<Tour>("/tours", { method: "POST", body: JSON.stringify(data) }),
  updateTour: (id: string, data: Partial<Tour>) => http<Tour>(`/tours/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTour: (id: string) => http<void>(`/tours/${id}`, { method: "DELETE" }),

  listVisas: () => http<Visa[]>("/visas"),
  createVisa: (data: Partial<Visa>) => http<Visa>("/visas", { method: "POST", body: JSON.stringify(data) }),
  updateVisa: (id: string, data: Partial<Visa>) => http<Visa>(`/visas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVisa: (id: string) => http<void>(`/visas/${id}`, { method: "DELETE" }),

  listContacts: () => http<Contact[]>("/contacts"),
  createContact: (data) => http<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
  markContactRead: (id: string) => http<Contact>(`/contacts/${id}/read`, { method: "PATCH" }),
  deleteContact: (id: string) => http<void>(`/contacts/${id}`, { method: "DELETE" }),

  listBackups: () => http<Backup[]>("/backups"),
  createBackup: () => http<{ success: boolean; filename: string }>("/backups", { method: "POST" }),
  restoreBackup: (filename: string) => http<{ success: boolean }>(`/backups/restore/${filename}`, { method: "POST" }),
  
  getHeroSettings: () => http<any>("/hero-settings"),
  updateHeroSettings: (settings: any) => http<void>("/hero-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),

  search: (q: string) => http<{ destinations: Destination[]; tours: Tour[] }>(`/search?q=${encodeURIComponent(q)}`),

  listMedia: () => http<Media[]>("/media"),
  createMedia: (data) => http<Media>("/media", { method: "POST", body: JSON.stringify(data) }),
  deleteMedia: (id: string) => http<void>(`/media/${id}`, { method: "DELETE" }),

  getSeoSettings: () => http<SeoPage[]>("/seo-settings"),
  updateSeoSettings: (settings: SeoPage[]) => http<void>("/seo-settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  }),
};
