export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5174/api";

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
    cache: "no-store",
    ...init,
    headers,
  });

  if (res.status === 401) {
    sessionStorage.removeItem("jf_admin_auth");
    sessionStorage.removeItem("jf_token");
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

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
  overviewImageUrl?: string;                 // image shown beside the narrative section
  transport?: string;
  guide?: string;
  pickup?: string;
  itinerary?: {
    title: string;
    description: string;
    imageUrl?: string;        // day photo
    schedule?: string;        // e.g. "09:00 – Depart | 13:00 – Lunch | 19:00 – Dinner"
    accommodation?: string;   // e.g. "Caldera Cave Suite, Oia"
    meals?: string;           // e.g. "Breakfast, Sunset Dinner"
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
  requirements?: string[];
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

export type SeoPage = {
  id: string;
  name: string;
  path: string;
  title: string;
  desc: string;
  ogImage?: string;
};

export const api = {
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
  createContact: (data: { name: string; email: string; type: string; message: string }) =>
    http<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
  markContactRead: (id: string) => http<Contact>(`/contacts/${id}/read`, { method: "PATCH" }),
  deleteContact: (id: string) => http<void>(`/contacts/${id}`, { method: "DELETE" }),

  listBackups: () => http<Backup[]>("/backups"),
  createBackup: () => http<{ success: boolean; filename: string }>("/backups", { method: "POST" }),
  restoreBackup: (filename: string) => http<{ success: boolean }>(`/backups/restore/${filename}`, { method: "POST" }),
  getHeroSettings: () => http<any>("/hero-settings"),
  search: (q: string) => http<{ destinations: Destination[]; tours: Tour[] }>(`/search?q=${encodeURIComponent(q)}`),
  getSeoSettings: () => http<SeoPage[]>("/seo-settings"),
};
