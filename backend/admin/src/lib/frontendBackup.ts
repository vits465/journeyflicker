/**
 * JourneyFlicker – Frontend Self-Backup System
 *
 * Periodically snapshots the full site content (destinations, tours, visas)
 * to localStorage so the frontend can still render if the backend goes offline.
 * Up to MAX_SNAPSHOTS are kept; oldest is pruned automatically.
 */

export interface FrontendSnapshot {
  id: string;        // unique timestamp-based key
  label: string;     // human-readable date string
  createdAt: number; // ms since epoch
  auto: boolean;     // was this automatic or manual?
  size: number;      // serialized byte size (approx)
  data: {
    destinations: unknown[];
    tours: unknown[];
    visas: unknown[];
  };
}

const STORAGE_KEY = 'jf_fe_backups';
const CACHE_KEY   = 'jf_fe_cache';
const MAX_SNAPSHOTS = 8;
const AUTO_INTERVAL_MS = 2 * 60 * 60 * 1000; // every 2 hours

// ── persistence helpers ──────────────────────────────────────────────────────

function readSnapshots(): FrontendSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSnapshots(snaps: FrontendSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snaps));
  } catch {
    // localStorage full – remove oldest and retry
    const trimmed = snaps.slice(0, MAX_SNAPSHOTS - 2);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }
}

// ── public API ───────────────────────────────────────────────────────────────

/** Save a snapshot to localStorage. Returns the saved snapshot. */
export function saveSnapshot(
  data: FrontendSnapshot['data'],
  auto: boolean
): FrontendSnapshot {
  const now = Date.now();
  const serialized = JSON.stringify(data);
  const snap: FrontendSnapshot = {
    id: `snap_${now}`,
    label: new Date(now).toLocaleString(),
    createdAt: now,
    auto,
    size: serialized.length,
    data,
  };

  let snaps = readSnapshots();
  snaps = [snap, ...snaps].slice(0, MAX_SNAPSHOTS);
  writeSnapshots(snaps);

  // also update the "live cache" used for offline fallback
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, cachedAt: now }));

  return snap;
}

/** List all stored snapshots, newest first. */
export function listSnapshots(): FrontendSnapshot[] {
  return readSnapshots().sort((a, b) => b.createdAt - a.createdAt);
}

/** Restore a snapshot by its id; returns the data so the caller can
 *  update React state. Also writes it back as the live cache. */
export function restoreSnapshot(id: string): FrontendSnapshot['data'] | null {
  const snaps = readSnapshots();
  const snap = snaps.find((s) => s.id === id);
  if (!snap) return null;
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...snap.data, cachedAt: snap.createdAt }));
  return snap.data;
}

/** Delete a single snapshot. */
export function deleteSnapshot(id: string): void {
  writeSnapshots(readSnapshots().filter((s) => s.id !== id));
}

/** Delete ALL snapshots. */
export function clearAllSnapshots(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(CACHE_KEY);
}

/** Read the last successfully fetched data (live cache).
 *  Returns null if nothing cached yet. */
export function readCache(): (FrontendSnapshot['data'] & { cachedAt: number }) | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── auto-snapshot scheduler ─────────────────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
let _fetchAll: (() => Promise<FrontendSnapshot['data']>) | null = null;

/** Call once (e.g. in main.tsx or App.tsx) to start the auto-backup loop.
 *  `fetchAll` is an async function that returns {destinations, tours, visas}. */
export function startAutoBackup(
  fetchAll: () => Promise<FrontendSnapshot['data']>
): void {
  _fetchAll = fetchAll;
  if (_timer) return; // already started

  const run = async () => {
    if (!_fetchAll) return;
    try {
      const data = await _fetchAll();
      saveSnapshot(data, true);
      console.info('[FE Backup] Auto-snapshot saved at', new Date().toLocaleTimeString());
    } catch {
      console.warn('[FE Backup] Auto-snapshot failed – backend may be offline');
    }
  };

  // first run after 10 s to not block startup
  setTimeout(run, 10_000);
  _timer = setInterval(run, AUTO_INTERVAL_MS);
}

/** Stop the auto-backup interval (useful in tests). */
export function stopAutoBackup(): void {
  if (_timer) { clearInterval(_timer); _timer = null; }
}
