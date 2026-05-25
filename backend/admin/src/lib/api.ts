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
  published?: boolean;
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

export type SystemLog = {
  id: string;
  level: 'error' | 'warn' | 'info';
  source: 'frontend' | 'backend';
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  resolved: boolean;
  createdAt: number;
};

export type SystemLogListResponse = {
  items: SystemLog[];
  total: number;
  page: number;
  pages: number;
};

const _apiCache = new Map<string, { data: any, ts: number, promise?: Promise<any> }>();
const CACHE_TTL = 60000; // 1 minute

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method || "GET";
  const cacheKey = `${method}:${path}`;

  if (method === "GET") {
    const cached = _apiCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // Background refresh if no existing promise is fetching it
      if (!cached.promise) {
        cached.promise = (async () => {
          try {
            const fresh = await _doHttp<T>(path, init);
            _apiCache.set(cacheKey, { data: fresh, ts: Date.now() });
            return fresh;
          } finally {
            const c = _apiCache.get(cacheKey);
            if (c) c.promise = undefined;
          }
        })();
      }
      return cached.data as T; // Return instantly
    }
  }

  // Clear cache on mutations
  if (method !== "GET") {
    _apiCache.clear();
  }

  const promise = _doHttp<T>(path, init);
  if (method === "GET") {
    _apiCache.set(cacheKey, { data: undefined, ts: 0, promise }); // Reserve spot
    const data = await promise;
    _apiCache.set(cacheKey, { data, ts: Date.now() });
    return data;
  }

  return promise;
}

async function _doHttp<T>(path: string, init?: RequestInit): Promise<T> {
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

/**
 * Upload an image file to the server.
 *
 * @param file     - The File object to upload
 * @param section  - Optional section key (e.g. "hero", "tours", "gallery").
 *                   When provided the server runs Sharp to auto-crop/resize/
 *                   convert the image to WebP at the exact aspect ratio the
 *                   frontend CSS expects. No client-side canvas resize is done
 *                   — Sharp produces far higher quality output on the server.
 *
 * Supported section keys:
 *   hero · sightseeing · destinations · tours · visa · overview
 *   tour-thumbs · signature · landmarks · gallery · itinerary
 */
export async function uploadImage(file: File, section?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (section) formData.append("section", section);

  const token = sessionStorage.getItem("jf_token");
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.url;
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
  getSystemStatus: () => Promise<any>;
  getReviews: () => Promise<any[]>;
  updateReviews: (reviews: any[]) => Promise<void>;
  listActivity: () => Promise<Activity[]>;
  // MongoDB migration
  getMigrationStatus: () => Promise<MigrationStatus>;
  runMigration: () => Promise<{ success: boolean; results: Record<string, number>; log: string[] }>;
  // System Logs
  listSystemLogs: (opts?: { level?: string; source?: string; resolved?: boolean; page?: number; limit?: number }) => Promise<SystemLogListResponse>;
  resolveSystemLog: (id: string, resolved: boolean) => Promise<SystemLog>;
  deleteSystemLog: (id: string) => Promise<void>;
  clearSystemLogs: (deleteAll?: boolean) => Promise<{ deleted: number }>;
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
    const formData = new FormData();
    formData.append("folder", folder);
    files.forEach(file => formData.append("files", file));
    
    const token = sessionStorage.getItem("jf_token");
    const headers: HeadersInit = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const res = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      headers,
      body: formData
    });
    
    if (!res.ok) throw new Error("Bulk upload failed");
    return res.json();
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
  getSystemStatus:    () => http<any>("/admin/system-status"),
  getReviews:         () => http<any[]>("/reviews"),
  updateReviews:      (reviews) => http<void>("/admin/reviews", { method: "PUT", body: JSON.stringify(reviews) }),
  listActivity:       () => http<Activity[]>("/admin/activity"),

  getMigrationStatus: () => http<MigrationStatus>("/admin/migrate/status"),
  runMigration:       () => http<{ success: boolean; results: Record<string, number>; log: string[] }>("/admin/migrate", { method: "POST" }),

  listSystemLogs: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.level) params.set('level', opts.level);
    if (opts.source) params.set('source', opts.source);
    if (opts.resolved !== undefined) params.set('resolved', String(opts.resolved));
    if (opts.page) params.set('page', String(opts.page));
    if (opts.limit) params.set('limit', String(opts.limit));
    return http<SystemLogListResponse>(`/admin/logs?${params}`);
  },
  resolveSystemLog: (id, resolved) => http<SystemLog>(`/admin/logs/${id}`, { method: 'PATCH', body: JSON.stringify({ resolved }) }),
  deleteSystemLog:  (id) => http<void>(`/admin/logs/${id}`, { method: 'DELETE' }),
  clearSystemLogs:  (deleteAll = false) => http<{ deleted: number }>(`/admin/logs${deleteAll ? '?deleteAll=true' : ''}`, { method: 'DELETE' }),
};
