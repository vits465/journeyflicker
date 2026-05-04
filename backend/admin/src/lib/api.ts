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
  departureWindows?: { range: string; label: string }[];
  maxGuests?: number;
};

export type TourListResponse = {
  items: Tour[];
  total: number;
  page: number;
  pages: number;
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
  additionalDetails?: string[];
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
  id: string;
  filename: string;
  size: number;
  checksum?: string;
  collections?: {
    destinations: number;
    tours: number;
    visas: number;
    contacts: number;
    media: number;
  };
  createdAt: number;
  createdBy?: string;
  restoredAt?: number | null;
  exists?: boolean;
};

export type BackupStats = {
  count: number;
  totalSize: number;
  maxBackups: number;
  diskFiles: number;
  lastBackup: number | null;
};

export type RestorePreview = {
  dryRun: boolean;
  preview: {
    destinations: number;
    tours: number;
    visas: number;
    contacts: number;
    media: number;
  };
  metadata: {
    project: string;
    version: string;
    backupDate: string;
    createdBy: string;
    checksum: string;
  };
  validation: { valid: boolean; errors: string[] };
};

export type Media = {
  id: string;
  url: string;
  cloudinaryPublicId?: string;
  name: string;
  size: string;
  sizeBytes?: number;
  type: string;
  date: string;
  folder: string;
  hash?: string;
  deletedAt?: number | null;
  createdAt?: number;
};

export type MediaUploadResult = {
  success: boolean;
  uploaded: (Media & {
    storage: string;
    duplicateWarning?: {
      existingId: string;
      existingUrl: string;
      existingName: string;
    } | null;
  })[];
  failed: { index: number; error: string }[];
  summary: { total: number; succeeded: number; failed: number };
};

export type MediaListResponse = {
  items: Media[];
  total: number;
  page: number;
  pages: number;
};

export type UnusedMediaResponse = {
  items: Media[];
  usedCount: number;
  unusedCount: number;
};

export type ImportResult = {
  success: boolean;
  results: {
    total: number;
    valid: number;
    duplicates: number;
    inserted?: number;
    updated?: number;
    errors: { item: string; error: string }[];
  };
};

export type ImportPreview = {
  preview: boolean;
  results: ImportResult['results'];
  sample: Record<string, unknown>[];
};

export type MigrationStatus = {
  mongoConnected: boolean;
  counts: {
    destinations: number;
    tours: number;
    visas: number;
    contacts: number;
    media: number;
    coEditors: number;
  };
  dbName?: string;
  dbHost?: string;
};

export type SeoPage = {
  id: string;
  name: string;
  path: string;
  title: string;
  desc: string;
  ogImage?: string;
};

export type Activity = {
  id: string;
  action: string;
  timestamp: number;
  user?: string;
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
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const data = reader.result as string;
          const res = await http<{ url: string }>("/upload", {
            method: "POST",
            body: JSON.stringify({ name: file.name, data }),
          });
          resolve(res.url);
        } catch (err) { reject(err); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1080;
      if (width > height) {
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
      } else {
        if (height > MAX_HEIGHT) { width = Math.round((width * MAX_HEIGHT) / height); height = MAX_HEIGHT; }
      }
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0, width, height);
      const data = canvas.toDataURL('image/jpeg', 0.8);
      http<{ url: string }>("/upload", { method: "POST", body: JSON.stringify({ name: file.name, data }) })
        .then(res => resolve(res.url)).catch(reject);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

function downloadFile(url: string, filename: string) {
  const token = sessionStorage.getItem("jf_token") || "";
  fetch(`${API_BASE}${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(err => console.error("Download failed:", err));
}

export interface ApiInterface {
  listDestinations: () => Promise<Destination[]>;
  getDestination:   (id: string) => Promise<Destination>;
  createDestination: (data: Partial<Destination>) => Promise<Destination>;
  updateDestination: (id: string, data: Partial<Destination>) => Promise<Destination>;
  deleteDestination: (id: string) => Promise<void>;
  listTours: (opts?: { page?: number; limit?: number; search?: string }) => Promise<Tour[] | TourListResponse>;
  getTour:   (id: string) => Promise<Tour>;
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
  // Enhanced backups
  listBackups: () => Promise<Backup[]>;
  getBackupStats: () => Promise<BackupStats>;
  createBackup: () => Promise<{ success: boolean; backup: Backup }>;
  downloadBackup: (id: string) => void;
  downloadBackupZip: (id: string) => void;
  deleteBackup: (id: string) => Promise<void>;
  restoreBackup: (backupId: string, opts?: { dryRun?: boolean; collections?: string[] }) => Promise<{ success?: boolean; log?: string[]; dryRun?: boolean; preview?: RestorePreview['preview']; metadata?: RestorePreview['metadata']; validation?: { valid: boolean; errors: string[] } }>;
  uploadBackupFile: (filename: string, content: string) => Promise<{ payload: Record<string, unknown>; valid: boolean; errors: string[] }>;
  // Import / Export
  exportData: (type: string, format?: string) => void;
  importData: (opts: { type: string; format: string; data: string; preview?: boolean; allowDuplicates?: boolean }) => Promise<ImportResult | ImportPreview>;
  // Enhanced media
  listMedia: (opts?: { folder?: string; search?: string; sortBy?: string; sortDir?: string; page?: number; limit?: number; showDeleted?: boolean }) => Promise<MediaListResponse>;
  uploadMediaFiles: (files: File[], folder?: string) => Promise<MediaUploadResult>;
  deleteMedia: (id: string, permanent?: boolean) => Promise<void>;
  restoreMedia: (id: string) => Promise<Media>;
  bulkDeleteMedia: (ids: string[], permanent?: boolean) => Promise<void>;
  bulkMoveMedia: (ids: string[], folder: string) => Promise<void>;
  emptyTrashMedia: () => Promise<{count: number}>;
  detectUnusedMedia: () => Promise<UnusedMediaResponse>;
  syncCloudinary: () => Promise<{ count: number; resources: unknown[] }>;
  createMedia: (data: Omit<Media, 'id'>) => Promise<Media>;
  // Settings
  getHeroSettings: () => Promise<unknown>;
  updateHeroSettings: (settings: unknown) => Promise<void>;
  search: (q: string) => Promise<{ destinations: Destination[]; tours: Tour[] }>;
  getSeoSettings: () => Promise<SeoPage[]>;
  updateSeoSettings: (settings: SeoPage[]) => Promise<void>;
  getApiSettings: () => Promise<unknown>;
  updateApiSettings: (settings: unknown) => Promise<void>;
  listActivity: () => Promise<Activity[]>;
  // MongoDB migration
  getMigrationStatus: () => Promise<MigrationStatus>;
  runMigration: () => Promise<{ success: boolean; results: Record<string, number>; log: string[] }>;
}

export const api: ApiInterface = {
  listDestinations: () => http<Destination[]>("/destinations"),
  getDestination:   (id) => http<Destination>(`/destinations/${id}`),
  createDestination: (data) => http<Destination>("/destinations", { method: "POST", body: JSON.stringify(data) }),
  updateDestination: (id, data) => http<Destination>(`/destinations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDestination: (id) => http<void>(`/destinations/${id}`, { method: "DELETE" }),

  listTours: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.search) params.set("search", opts.search);
    const q = params.toString();
    return http<Tour[] | TourListResponse>(`/tours${q ? `?${q}` : ''}`);
  },
  getTour:   (id) => http<Tour>(`/tours/${id}`),
  createTour: (data) => http<Tour>("/tours", { method: "POST", body: JSON.stringify(data) }),
  updateTour: (id, data) => http<Tour>(`/tours/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTour: (id) => http<void>(`/tours/${id}`, { method: "DELETE" }),

  listVisas: () => http<Visa[]>("/visas"),
  createVisa: (data) => http<Visa>("/visas", { method: "POST", body: JSON.stringify(data) }),
  updateVisa: (id, data) => http<Visa>(`/visas/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVisa: (id) => http<void>(`/visas/${id}`, { method: "DELETE" }),

  listContacts: () => http<Contact[]>("/contacts"),
  createContact: (data) => http<Contact>("/contacts", { method: "POST", body: JSON.stringify(data) }),
  markContactRead: (id) => http<Contact>(`/contacts/${id}/read`, { method: "PATCH" }),
  deleteContact: (id) => http<void>(`/contacts/${id}`, { method: "DELETE" }),

  // Enhanced backups
  listBackups:    () => http<Backup[]>("/admin/backup/list"),
  getBackupStats: () => http<BackupStats>("/admin/backup/stats"),
  createBackup:   () => http<{ success: boolean; backup: Backup }>("/admin/backup/create", { method: "POST" }),
  downloadBackup: (id) => downloadFile(`/admin/backup/download/${encodeURIComponent(id)}`, `${id}.json`),
  downloadBackupZip: (id) => downloadFile(`/admin/backup/download-zip/${encodeURIComponent(id)}`, `${id}.zip`),
  deleteBackup:   (id) => http<void>(`/admin/backup/${encodeURIComponent(id)}`, { method: "DELETE" }),
  restoreBackup:  (backupId, opts = {}) => http<{ success?: boolean; log?: string[] }>("/admin/backup/restore", {
    method: "POST",
    body: JSON.stringify({ backupId, ...opts }),
  }),
  uploadBackupFile: (filename, content) => http<{ payload: Record<string, unknown>; valid: boolean; errors: string[] }>("/admin/backup/upload", {
    method: "POST",
    body: JSON.stringify({ filename, content }),
  }),

  exportData: (type, format = "json") => downloadFile(
    `/admin/export/${type}?format=${format}`,
    `jf_export_${type}_${new Date().toISOString().slice(0, 10)}.${format}`
  ),
  importData: (opts) => http<ImportResult | ImportPreview>("/admin/import", {
    method: "POST",
    body: JSON.stringify(opts),
  }),

  listMedia: (opts = {}) => {
    const { folder, search, sortBy = "createdAt", sortDir = "desc", page = 1, limit = 50, showDeleted = false } = opts;
    const params = new URLSearchParams();
    if (folder && folder !== "All") params.set("folder", folder);
    if (search) params.set("search", search);
    params.set("sortBy",  sortBy);
    params.set("sortDir", sortDir);
    params.set("page",    String(page));
    params.set("limit",   String(limit));
    if (showDeleted) params.set("showDeleted", "true");
    return http<MediaListResponse>(`/admin/media?${params}`);
  },
  uploadMediaFiles: async (files, folder = "General") => {
    const fileData = await Promise.all(files.map(async file => {
      const data = await new Promise<string>((res, rej) => {
        const reader = new FileReader();
        reader.onload  = () => res(reader.result as string);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      return { name: file.name, data, type: file.type, size: (file.size / 1024 / 1024).toFixed(1) + ' MB' };
    }));
    return http<MediaUploadResult>("/admin/media/upload", { method: "POST", body: JSON.stringify({ files: fileData, folder }) });
  },
  deleteMedia:       (id, permanent = false) => http<void>(`/admin/media/${id}${permanent ? "?permanent=true" : ""}`, { method: "DELETE" }),
  restoreMedia:      (id) => http<Media>(`/admin/media/restore/${id}`, { method: "POST" }),
  bulkDeleteMedia:   (ids, permanent = false) => http<void>("/admin/media/bulk-delete", { method: "POST", body: JSON.stringify({ ids, permanent }) }),
  bulkMoveMedia:     (ids, folder) => http<void>("/admin/media/bulk-move", { method: "POST", body: JSON.stringify({ ids, folder }) }),
  emptyTrashMedia:   () => http<{count: number}>("/admin/media/empty-trash", { method: "POST" }),
  detectUnusedMedia: () => http<UnusedMediaResponse>("/admin/media/unused/detect"),
  syncCloudinary:    () => http<{ count: number; resources: unknown[] }>("/admin/media/cloudinary-sync"),

  createMedia: (data) => http<Media>("/media", { method: "POST", body: JSON.stringify(data) }),

  getHeroSettings:    () => http<unknown>("/hero-settings"),
  updateHeroSettings: (settings) => http<void>("/hero-settings", { method: "PUT", body: JSON.stringify(settings) }),
  search:             (q) => http<{ destinations: Destination[]; tours: Tour[] }>(`/search?q=${encodeURIComponent(q)}`),
  getSeoSettings:     () => http<SeoPage[]>("/seo-settings"),
  updateSeoSettings:  (settings) => http<void>("/seo-settings", { method: "PUT", body: JSON.stringify(settings) }),
  getApiSettings:     () => http<unknown>("/api-settings"),
  updateApiSettings:  (settings) => http<void>("/api-settings", { method: "PUT", body: JSON.stringify(settings) }),
  listActivity:       () => http<Activity[]>("/admin/activity"),

  getMigrationStatus: () => http<MigrationStatus>("/admin/migrate/status"),
  runMigration:       () => http<{ success: boolean; results: Record<string, number>; log: string[] }>("/admin/migrate", { method: "POST" }),
};
