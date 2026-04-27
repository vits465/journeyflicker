import cors from "cors";
import express from "express";
import { z } from "zod";
import crypto from "node:crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { kv } from "@vercel/kv";
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174").split(","),
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// ── Credentials ───────────────────────────────────────────────────────────────
const ADMIN_USERNAME  = process.env.ADMIN_USERNAME || "Fliker";
const ADMIN_PASSWORD  = process.env.ADMIN_PASSWORD || "JourneyFliker0465";
const TOKEN_TTL       = 8 * 60 * 60; // 8 hours in seconds

// ── KV key prefixes ───────────────────────────────────────────────────────────
const DB_KEY      = "jf:db";
const TOKEN_PFX   = "jf:tok:";
const ATTEMPT_PFX = "jf:att:";
const BACKUP_PFX  = "jf:bak:";
const BACKUP_LIST = "jf:bak:index";

// ── DB helpers ────────────────────────────────────────────────────────────────
async function readDb() {
  const data = await kv.get(DB_KEY);
  return data || { destinations: [], tours: [], visas: [], contacts: [], coEditorAccounts: [] };
}
async function writeDb(next) { await kv.set(DB_KEY, next); }

// ── Token helpers ─────────────────────────────────────────────────────────────
async function issueToken(role) {
  const token = crypto.randomBytes(32).toString("hex");
  await kv.set(`${TOKEN_PFX}${token}`, { role }, { ex: TOKEN_TTL });
  return token;
}
async function getTokenData(req) {
  const h = req.headers.authorization;
  if (!h) return null;
  const tok = h.split(" ")[1];
  if (!tok) return null;
  return await kv.get(`${TOKEN_PFX}${tok}`);
}
async function revokeToken(req) {
  const h = req.headers.authorization;
  if (!h) return;
  const tok = h.split(" ")[1];
  if (tok) await kv.del(`${TOKEN_PFX}${tok}`);
}

// ── Brute-force (KV-persisted — works across serverless instances) ─────────────
function getIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip || "unknown";
}
async function checkBruteForce(ip) {
  const count = (await kv.get(`${ATTEMPT_PFX}${ip}`)) || 0;
  if (count >= 5) {
    const ttl = await kv.ttl(`${ATTEMPT_PFX}${ip}`);
    return { blocked: true, waitMins: Math.ceil(Math.max(ttl, 0) / 60) };
  }
  return { blocked: false };
}
async function recordFailedAttempt(ip) {
  const key   = `${ATTEMPT_PFX}${ip}`;
  const count = (await kv.get(key)) || 0;
  await kv.set(key, count + 1, { ex: 15 * 60 });
}
async function clearAttempts(ip) { await kv.del(`${ATTEMPT_PFX}${ip}`); }

// ── Auth middleware (async — required because KV calls are Promises) ───────────
const requireAdmin = async (req, res, next) => {
  const data = await getTokenData(req);
  if (!data || data.role !== "editor") return res.status(401).json({ error: "Unauthorized" });
  next();
};
const requireCRUD = async (req, res, next) => {
  const data = await getTokenData(req);
  if (!data || !["editor", "co-editor"].includes(data.role))
    return res.status(401).json({ error: "Unauthorized" });
  next();
};

// ── Utility ───────────────────────────────────────────────────────────────────
function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Auth routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const ip = getIp(req);
  const bf = await checkBruteForce(ip);
  if (bf.blocked) return res.status(429).json({ error: `Too many failed attempts. Try again in ${bf.waitMins} minute(s).` });
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    await clearAttempts(ip);
    return res.json({ token: await issueToken("editor"), role: "editor" });
  }
  await recordFailedAttempt(ip);
  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/co-editor-login", loginLimiter, async (req, res) => {
  const ip = getIp(req);
  const bf = await checkBruteForce(ip);
  if (bf.blocked) return res.status(429).json({ error: `Too many failed attempts. Try again in ${bf.waitMins} minute(s).` });
  const { username, password } = req.body || {};
  try {
    const db = await readDb();
    const matched = (db.coEditorAccounts || []).find(a => a.username === username && a.password === password);
    if (matched) {
      await clearAttempts(ip);
      return res.json({ token: await issueToken("co-editor"), role: "co-editor", id: matched.id });
    }
  } catch (e) { console.error(e); }
  await recordFailedAttempt(ip);
  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/logout", async (req, res) => {
  await revokeToken(req);
  res.json({ success: true });
});

app.get("/api/auth/me", async (req, res) => {
  const data = await getTokenData(req);
  if (!data) return res.status(401).json({ error: "Unauthorized" });
  res.json({ role: data.role });
});

// ── Co-editor account management ──────────────────────────────────────────────
const CoEditorAccountSchema = z.object({ username: z.string().min(3), password: z.string().min(6) });

app.get("/api/auth/co-editor-accounts", requireAdmin, async (_req, res) => {
  const db = await readDb();
  res.json((db.coEditorAccounts || []).map(({ id, username }) => ({ id, username })));
});
app.post("/api/auth/co-editor-accounts", requireAdmin, async (req, res) => {
  const parsed = CoEditorAccountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  if (!db.coEditorAccounts) db.coEditorAccounts = [];
  if (db.coEditorAccounts.length >= 5) return res.status(400).json({ error: "Maximum 5 co-editor accounts." });
  if (db.coEditorAccounts.find(a => a.username === parsed.data.username)) return res.status(400).json({ error: "Username already exists." });
  const newAcc = { id: newId("coed"), ...parsed.data };
  db.coEditorAccounts.push(newAcc);
  await writeDb(db);
  res.status(201).json({ id: newAcc.id, username: newAcc.username });
});
app.put("/api/auth/co-editor-accounts/:id", requireAdmin, async (req, res) => {
  const parsed = CoEditorAccountSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  if (!db.coEditorAccounts) db.coEditorAccounts = [];
  const idx = db.coEditorAccounts.findIndex(a => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.coEditorAccounts[idx] = { ...db.coEditorAccounts[idx], ...parsed.data };
  await writeDb(db);
  res.json({ id: db.coEditorAccounts[idx].id, username: db.coEditorAccounts[idx].username });
});
app.delete("/api/auth/co-editor-accounts/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  if (!db.coEditorAccounts) db.coEditorAccounts = [];
  const before = db.coEditorAccounts.length;
  db.coEditorAccounts = db.coEditorAccounts.filter(a => a.id !== req.params.id);
  if (db.coEditorAccounts.length === before) return res.status(404).json({ message: "Not found" });
  await writeDb(db);
  res.status(204).end();
});

// ── Upload → Cloudinary ───────────────────────────────────────────────────────
app.post("/api/upload", requireAdmin, async (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: "Missing name or data base64" });
  if (!data.startsWith("data:")) return res.status(400).json({ error: "Invalid base64 format" });
  try {
    const result = await cloudinary.uploader.upload(data, {
      folder:        "journeyflicker",
      resource_type: "auto",
      use_filename:  false,
      unique_filename: true,
    });
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    res.status(500).json({ error: "Upload failed. Check Cloudinary credentials." });
  }
});

// ── Schemas ───────────────────────────────────────────────────────────────────
const DestinationSchema = z.object({
  name: z.string().min(1), region: z.string().min(1),
  description: z.string().optional().default(""),
  heroImageUrl: z.string().optional().default(""),
  essenceText: z.string().optional().default(""),
  landmarks: z.array(z.object({ title: z.string(), category: z.string(), description: z.string(), imageUrl: z.string() })).optional().default([]),
  bestSeasonsTitle: z.string().optional().default(""),
  bestSeasonsMonths: z.string().optional().default(""),
  seasonsHighlights: z.array(z.object({ season: z.string(), description: z.string() })).optional().default([]),
  galleryImages: z.array(z.string()).optional().default([]),
});
const TourSchema = z.object({
  name: z.string().min(1), region: z.string().min(1),
  days: z.number().int().positive(), price: z.string().min(1), category: z.string().min(1),
  rating: z.number().min(0).max(5).optional().default(0),
  heroImageUrl: z.string().optional().default(""),
  overviewDescription: z.string().optional().default(""),
  overviewExtended: z.string().optional().default(""),
  transport: z.string().optional().default(""), guide: z.string().optional().default(""), pickup: z.string().optional().default(""),
  itinerary: z.array(z.object({ title: z.string(), description: z.string(), imageUrl: z.string().optional().default(""), schedule: z.string().optional().default(""), accommodation: z.string().optional().default(""), meals: z.string().optional().default("") })).optional().default([]),
  sightseeing: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string(), imageUrl: z.string().optional().default("") })).optional().default([]),
  visualArchive: z.array(z.string()).optional().default([]),
  testimonials: z.array(z.object({ quote: z.string(), author: z.string() })).optional().default([]),
  departureWindows: z.array(z.string()).optional().default([]),
  maxGuests: z.number().optional().default(8),
});
const VisaSchema = z.object({
  country: z.string().min(1), processing: z.string().min(1),
  difficulty: z.string().min(1), fee: z.string().min(1),
});
const ContactSchema = z.object({
  name: z.string().min(1), email: z.string().email(),
  type: z.string().optional().default("General Inquiry"),
  message: z.string().optional().default(""),
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Destinations ──────────────────────────────────────────────────────────────
app.get("/api/destinations", async (_req, res) => { res.json((await readDb()).destinations); });
app.get("/api/destinations/:id", async (req, res) => {
  const found = (await readDb()).destinations.find(d => d.id === req.params.id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});
app.post("/api/destinations", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("dest"), ...parsed.data, createdAt: Date.now() };
  db.destinations.unshift(item); await writeDb(db); res.status(201).json(item);
});
app.put("/api/destinations/:id", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.destinations.findIndex(d => d.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.destinations[idx] = { ...db.destinations[idx], ...parsed.data };
  await writeDb(db); res.json(db.destinations[idx]);
});
app.delete("/api/destinations/:id", requireCRUD, async (req, res) => {
  const db = await readDb();
  db.destinations = db.destinations.filter(d => d.id !== req.params.id);
  await writeDb(db); res.status(204).end();
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  if (!q) return res.json({ destinations: [], tours: [] });
  const db = await readDb();
  res.json({
    destinations: db.destinations.filter(d =>
      d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) ||
      (d.description && d.description.toLowerCase().includes(q))),
    tours: db.tours.filter(t =>
      t.name.toLowerCase().includes(q) || t.region.toLowerCase().includes(q) ||
      (t.overviewDescription && t.overviewDescription.toLowerCase().includes(q))),
  });
});

// ── Tours ─────────────────────────────────────────────────────────────────────
app.get("/api/tours", async (_req, res) => { res.json((await readDb()).tours); });
app.get("/api/tours/:id", async (req, res) => {
  const found = (await readDb()).tours.find(t => t.id === req.params.id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});
app.post("/api/tours", requireCRUD, async (req, res) => {
  const parsed = TourSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("tour"), ...parsed.data, createdAt: Date.now() };
  db.tours.unshift(item); await writeDb(db); res.status(201).json(item);
});
app.put("/api/tours/:id", requireCRUD, async (req, res) => {
  const parsed = TourSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.tours.findIndex(t => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.tours[idx] = { ...db.tours[idx], ...parsed.data };
  await writeDb(db); res.json(db.tours[idx]);
});
app.delete("/api/tours/:id", requireCRUD, async (req, res) => {
  const db = await readDb();
  db.tours = db.tours.filter(t => t.id !== req.params.id);
  await writeDb(db); res.status(204).end();
});

// ── Visas ─────────────────────────────────────────────────────────────────────
app.get("/api/visas", async (_req, res) => { res.json((await readDb()).visas); });
app.post("/api/visas", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("visa"), ...parsed.data, createdAt: Date.now() };
  db.visas.unshift(item); await writeDb(db); res.status(201).json(item);
});
app.put("/api/visas/:id", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.visas.findIndex(v => v.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.visas[idx] = { ...db.visas[idx], ...parsed.data };
  await writeDb(db); res.json(db.visas[idx]);
});
app.delete("/api/visas/:id", requireCRUD, async (req, res) => {
  const db = await readDb();
  db.visas = db.visas.filter(v => v.id !== req.params.id);
  await writeDb(db); res.status(204).end();
});

// ── Contacts ──────────────────────────────────────────────────────────────────
app.get("/api/contacts", requireAdmin, async (_req, res) => { res.json((await readDb()).contacts || []); });
app.post("/api/contacts", async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  const item = { id: newId("msg"), ...parsed.data, read: false, createdAt: Date.now() };
  db.contacts.unshift(item); await writeDb(db); res.status(201).json(item);
});
app.patch("/api/contacts/:id/read", requireAdmin, async (req, res) => {
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  const idx = db.contacts.findIndex(c => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.contacts[idx].read = true; await writeDb(db); res.json(db.contacts[idx]);
});
app.delete("/api/contacts/:id", requireAdmin, async (req, res) => {
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  db.contacts = db.contacts.filter(c => c.id !== req.params.id);
  await writeDb(db); res.status(204).end();
});

// ── Backups (KV-based snapshots) ───────────────────────────────────────────────
async function createBackup() {
  try {
    const db = await readDb();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const key = `${BACKUP_PFX}${timestamp}`;
    await kv.set(key, db, { ex: 30 * 24 * 60 * 60 }); // Keep 30 days
    // Maintain index list (max 10)
    const index = (await kv.get(BACKUP_LIST)) || [];
    index.unshift({ key, timestamp, createdAt: Date.now() });
    if (index.length > 10) index.splice(10);
    await kv.set(BACKUP_LIST, index);
    return timestamp;
  } catch (err) { console.error("Backup failed:", err); return null; }
}

app.get("/api/backups", requireAdmin, async (_req, res) => {
  const index = (await kv.get(BACKUP_LIST)) || [];
  res.json(index.map(b => ({ filename: b.timestamp, size: 0, createdAt: b.createdAt })));
});
app.post("/api/backups", requireAdmin, async (_req, res) => {
  const name = await createBackup();
  if (name) res.json({ success: true, filename: name });
  else res.status(500).json({ error: "Backup failed" });
});
app.post("/api/backups/restore/:filename", requireAdmin, async (req, res) => {
  try {
    const key  = `${BACKUP_PFX}${req.params.filename}`;
    const data = await kv.get(key);
    if (!data) return res.status(404).json({ error: "Backup not found" });
    await writeDb(data);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Serve Admin Panel (Static Files) ──────────────────────────────────────────
const adminDistPath = path.join(__dirname, "../admin/dist");
app.use(express.static(adminDistPath));

// ── SPA Fallback for Admin Panel ──────────────────────────────────────────────
app.get("*", (req, res, next) => {
  // If it's an API route that somehow leaked through, don't serve index.html
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(adminDistPath, "index.html"), (err) => {
    if (err) {
      // If index.html doesn't exist (not built yet), show a friendly message
      res.status(404).send("Admin panel not built yet. Please run 'npm run build' in backend/admin.");
    }
  });
});

// ── Export for Vercel serverless ───────────────────────────────────────────────
// Local dev: still start the server normally
if (!process.env.VERCEL) {
  const port = process.env.PORT ? Number(process.env.PORT) : 5174;
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
}

export default app;
