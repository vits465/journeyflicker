import "dotenv/config";
import cors from "cors";
import express from "express";
import compression from "compression";
import { z } from "zod";
import crypto from "node:crypto";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
import { v2 as cloudinary } from "cloudinary";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

// ── MongoDB ────────────────────────────────────────────────────────────────────
import { connectMongo, isMongoConnected } from "./db/mongoose.js";
import { Destination as DestModel, Tour as TourModel, Visa as VisaModel, Contact as ContactModel, Settings as SettingsModel, CoEditor as CoEditorModel, Media as MediaModel, Admin as AdminModel } from "./db/models/index.js";
import { router as backupRouter, startScheduledBackup } from "./routes/backup.js";
import { router as importExportRouter } from "./routes/import-export.js";
import { router as enhancedMediaRouter } from "./routes/media.js";
import { router as migrateRouter } from "./routes/migrate.js";

// Start MongoDB connection — awaited before server listens (see bottom of file)
const mongoReady = connectMongo();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Cloudinary config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();
app.use(compression()); // Compress all responses

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      "media-src": ["'self'", "https://videos.pexels.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "https://fonts.googleapis.com"],
      "script-src": ["'self'", "'unsafe-inline'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "connect-src": [
        "'self'",
        "https://api.cloudinary.com",
        "https://res.cloudinary.com",
        // Allow fetch to any vercel.app / railway.app / onrender.com origin for cross-domain API calls
        "https://*.vercel.app",
        "https://*.up.railway.app",
        "https://*.onrender.com",
        ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map(o => o.trim()) : []),
      ],
    },
  },
}));
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174").split(",");
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('CORS blocked origin: ' + origin), false);
  },
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

if (!process.env.ADMIN_PASSWORD) {
  console.warn("\x1b[33m%s\x1b[0m", "SECURITY WARNING: Using default ADMIN_PASSWORD. Please set ADMIN_PASSWORD in your environment variables.");
}

// ── Password hashing helpers (scrypt – built-in Node crypto) ──────────────────
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };
async function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((res, rej) =>
    crypto.scrypt(plain, salt, SCRYPT_PARAMS.keylen, { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p }, (err, key) =>
      err ? rej(err) : res(`${salt}:${key.toString("hex")}`)
    )
  );
}
async function verifyPassword(plain, stored) {
  // Support legacy plain-text passwords (no colon separator)
  if (!stored.includes(":")) return stored === plain;
  const [salt, hash] = stored.split(":");
  return new Promise((res, rej) =>
    crypto.scrypt(plain, salt, SCRYPT_PARAMS.keylen, { N: SCRYPT_PARAMS.N, r: SCRYPT_PARAMS.r, p: SCRYPT_PARAMS.p }, (err, key) => {
      if (err) return rej(err);
      try {
        res(crypto.timingSafeEqual(Buffer.from(hash, "hex"), key));
      } catch { res(false); }
    })
  );
}
// Timing-safe string compare (for admin credentials)
function safeEqual(a, b) {
  try {
    const ba = Buffer.from(a), bb = Buffer.from(b);
    if (ba.length !== bb.length) return false;
    return crypto.timingSafeEqual(ba, bb);
  } catch { return false; }
}

// ── KV key prefixes (Infrastructure only) ────────────────────────────────────
const TOKEN_PFX   = "jf:tok:";
const ATTEMPT_PFX = "jf:att:";
const BACKUP_PFX  = "jf:bak:";
const BACKUP_LIST = "jf:bak:index";
const ACTIVE_PFX  = "jf:active:";
const ACTIVITY_LIMIT = 50;
let recentActivity = [];

// Activity logger
async function logActivity(req, action) {
  const user = req.user ? (req.user.identifier === "admin" ? "Admin" : `Editor (${req.user.identifier})`) : "System";
  recentActivity.unshift({
    id: newId("act"),
    action,
    timestamp: Date.now(),
    user,
  });
  if (recentActivity.length > ACTIVITY_LIMIT) recentActivity.pop();
}

// ── Token helpers ─────────────────────────────────────────────────────────────
async function issueToken(role, identifier = "admin") {
  const token = crypto.randomBytes(32).toString("hex");
  const activeKey = `${ACTIVE_PFX}${identifier}`;
  
  // Revoke previous session if it exists
  const oldToken = await kv.get(activeKey);
  if (oldToken) {
    await kv.del(`${TOKEN_PFX}${oldToken}`);
  }

  await kv.set(`${TOKEN_PFX}${token}`, { role, identifier }, { ex: TOKEN_TTL });
  await kv.set(activeKey, token, { ex: TOKEN_TTL });
  
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
  if (tok) {
    const data = await kv.get(`${TOKEN_PFX}${tok}`);
    if (data?.identifier) {
      await kv.del(`${ACTIVE_PFX}${data.identifier}`);
    }
    await kv.del(`${TOKEN_PFX}${tok}`);
  }
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
  req.user = data;
  next();
};
const requireCRUD = async (req, res, next) => {
  const data = await getTokenData(req);
  if (!data || !["editor", "co-editor"].includes(data.role))
    return res.status(401).json({ error: "Unauthorized" });
  req.user = data;
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
  try {
    const admin = await AdminModel.findOne({ username: String(username || "") }).lean();
    if (admin) {
      if (await verifyPassword(String(password || ""), admin.password)) {
        await clearAttempts(ip);
        return res.json({ token: await issueToken("editor", admin.id), role: "editor", id: admin.id });
      }
    } else {
      // Fallback to ENV if no admins exist (Migration / First run)
      const totalAdmins = await AdminModel.countDocuments();
      if (totalAdmins === 0) {
        const userMatch = safeEqual(String(username || ""), ADMIN_USERNAME);
        const passMatch = safeEqual(String(password || ""), ADMIN_PASSWORD);
        if (userMatch && passMatch) {
          await clearAttempts(ip);
          // Auto-seed the database with the env credentials
          const hashed = await hashPassword(String(password || ""));
          const newAdminId = newId("admin");
          await AdminModel.create({ id: newAdminId, username: String(username || ""), password: hashed });
          return res.json({ token: await issueToken("editor", newAdminId), role: "editor", id: newAdminId });
        }
      }
    }
  } catch (e) { console.error(e); }

  await recordFailedAttempt(ip);
  return res.status(401).json({ error: "Invalid credentials" });
});

app.get("/api/auth/admin-credentials", requireAdmin, async (req, res) => {
  try {
    const admin = await AdminModel.findOne({ id: req.user.identifier }).lean();
    if (!admin) return res.status(404).json({ error: "Admin not found" });
    res.json({ username: admin.username });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/api/auth/admin-credentials", requireAdmin, async (req, res) => {
  const { username, password } = req.body;
  if (!username && !password) return res.status(400).json({ error: "No changes provided" });
  
  try {
    const update = {};
    if (username) update.username = username;
    if (password) update.password = await hashPassword(password);
    
    await AdminModel.updateOne({ id: req.user.identifier }, { $set: update });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/auth/co-editor-login", loginLimiter, async (req, res) => {
  const ip = getIp(req);
  const bf = await checkBruteForce(ip);
  if (bf.blocked) return res.status(429).json({ error: `Too many failed attempts. Try again in ${bf.waitMins} minute(s).` });
  const { username, password } = req.body || {};
  try {
    const account = await CoEditorModel.findOne({ username }).lean();
    if (account && await verifyPassword(String(password || ""), account.password)) {
      await clearAttempts(ip);
      return res.json({ token: await issueToken("co-editor", account.id), role: "co-editor", id: account.id });
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
  const accounts = await CoEditorModel.find({}).lean();
  return res.json(accounts.map(({ id, username }) => ({ id, username })));
});
app.post("/api/auth/co-editor-accounts", requireAdmin, async (req, res) => {
  const parsed = CoEditorAccountSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const hashedPassword = await hashPassword(parsed.data.password);
  const newAcc = { id: newId("coed"), username: parsed.data.username, password: hashedPassword };

  const count = await CoEditorModel.countDocuments();
  if (count >= 5) return res.status(400).json({ error: "Maximum 5 co-editor accounts." });
  const exists = await CoEditorModel.findOne({ username: parsed.data.username });
  if (exists) return res.status(400).json({ error: "Username already exists." });
  await CoEditorModel.create(newAcc);
  
  await logActivity(req, `Created co-editor account: ${newAcc.username}`);
  res.status(201).json({ id: newAcc.id, username: newAcc.username });
});
app.put("/api/auth/co-editor-accounts/:id", requireAdmin, async (req, res) => {
  const parsed = CoEditorAccountSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const update = { ...parsed.data };
  if (update.password) update.password = await hashPassword(update.password);

  const updated = await CoEditorModel.findOneAndUpdate({ id: req.params.id }, { $set: update }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Updated co-editor account: ${updated.username}`);
  return res.json({ id: updated.id, username: updated.username });
});
app.delete("/api/auth/co-editor-accounts/:id", requireAdmin, async (req, res) => {
  const deleted = await CoEditorModel.findOneAndDelete({ id: req.params.id }).lean();
  if (!deleted) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Deleted co-editor account: ${deleted.username}`);
  return res.status(204).end();
});

// ── Serve local uploads (dev fallback) ────────────────────────────────────────
const uploadsDir = path.resolve(__dirname, "../public/uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// ── Upload → Cloudinary (prod) or Local Disk (dev fallback) ───────────────────
app.post("/api/upload", requireCRUD, async (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: "Missing name or data base64" });
  if (!data.startsWith("data:")) return res.status(400).json({ error: "Invalid base64 format" });

  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  // ── Try Cloudinary first (if credentials available) ──────────────────────
  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(data, {
        folder:          "journeyflicker",
        resource_type:   "auto",
        use_filename:    false,
        unique_filename: true,
      });
      return res.json({ url: result.secure_url, storage: "cloudinary" });
    } catch (err) {
      console.error("Cloudinary upload error (falling back to local):", err);
      // Fall through to local save
    }
  }

  // ── Local disk fallback (dev mode or Cloudinary failed) ───────────────────
  try {
    // Strip data URI prefix and decode base64
    const mimeMatch = data.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) return res.status(400).json({ error: "Invalid data URI" });
    
    const mimeType = mimeMatch[1];
    const base64Data = data.replace(/^data:[^;]+;base64,/, "");
    
    // Security check: Whitelist extensions
    const extMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    const ext = extMap[mimeType] || (data.match(/^data:image\/(\w+)/)?.[1] || "jpg");
    
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'pdf', 'doc', 'docx'].includes(ext.toLowerCase())) {
      return res.status(400).json({ error: `File type ${ext} not allowed for security reasons.` });
    }

    const safeName   = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename   = `${Date.now()}_${safeName.replace(/\.[^.]+$/, "")}.${ext}`;
    const filePath   = path.join(uploadsDir, filename);
    
    // ASYNC WRITE
    await fs.promises.writeFile(filePath, Buffer.from(base64Data, "base64"));
    
    // Build the public URL
    const host = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${process.env.PORT || 5174}`;
    const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const url = `${protocol}://${host}/uploads/${filename}`;
    
    console.log(`[Upload] Saved locally: ${filePath}`);
    await logActivity(req, `Uploaded file: ${filename}`);
    return res.json({ url, storage: "local" });
  } catch (err) {
    console.error("Local upload error:", err);
    // Cleanup if partially written (though writeFile handles most of this)
    try {
      const filename = name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(uploadsDir, filename);
      if (fs.existsSync(filePath)) await fs.promises.unlink(filePath);
    } catch {}
    
    return res.status(500).json({ error: "Upload failed: could not save to Cloudinary or local disk." });
  }
});

app.get("/api/admin/activity", async (_req, res) => {
  res.json(recentActivity);
});

// Admin-only rate limiter for backup/import operations
const adminOpLimiter = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { error: "Too many operations. Please wait." },
});

app.use("/api/admin/backup",  adminOpLimiter, requireAdmin, backupRouter);
app.use("/api/admin/export",  requireAdmin,   importExportRouter);
app.use("/api/admin/import",  adminOpLimiter, requireAdmin, importExportRouter);
app.use("/api/admin/media",   requireCRUD,    enhancedMediaRouter);
app.use("/api/admin/migrate", requireAdmin,   migrateRouter);










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
  departureWindows: z.array(z.object({ range: z.string(), label: z.string() })).optional().default([]),
  maxGuests: z.number().optional().default(8),
});
const VisaSchema = z.object({
  country: z.string().min(1),
  processing: z.string().min(1),
  difficulty: z.string().min(1),
  fee: z.string().optional().default(""),
  heroImageUrl: z.string().optional().default(""),
  description: z.string().optional().default(""),
  visaType: z.string().optional().default(""),
  documents: z.array(z.string()).optional().default([]),
  requirements: z.array(z.union([z.string(), z.object({ label: z.string(), detail: z.string() })])).optional().default([]),
  additionalDetails: z.array(z.string()).optional().default([]),
});
const ContactSchema = z.object({
  name: z.string().min(1), email: z.string().email(),
  type: z.string().optional().default("General Inquiry"),
  message: z.string().optional().default(""),
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── DB Status (diagnostic) ────────────────────────────────────────────────────
app.get("/api/db-status", (_req, res) => {
  const mongoOk = isMongoConnected();
  res.json({
    mongodb:   mongoOk ? "connected" : "disconnected",
    database:  mongoOk ? (process.env.MONGODB_DB || "journeyflicker") : null,
    storage:   mongoOk ? "mongodb" : "offline",
    uriSet:    !!process.env.MONGODB_URI,
    timestamp: new Date().toISOString(),
  });
});

// ── Cache Middleware for Public APIs (Vercel Edge Caching) ────────────────────
const cacheEdge = (req, res, next) => {
  // Cache at Vercel's Edge for 60 seconds, serve stale data for up to 5 minutes while revalidating
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  next();
};

// ── Destinations ──────────────────────────────────────────────────────────────
app.get("/api/destinations", cacheEdge, async (_req, res) => {
  // Exclude heavy arrays from the list view to improve performance
  res.json(await DestModel.find({}, { galleryImages: 0, seasonsHighlights: 0 }).sort({ createdAt: -1 }).lean());
});
app.get("/api/destinations/:id", cacheEdge, async (req, res) => {
  const found = await DestModel.findOne({ id: req.params.id }).lean();
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});
app.post("/api/destinations", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("dest"), ...parsed.data, createdAt: Date.now() };
  await DestModel.create(item);
  await logActivity(req, `Created destination: ${item.name}`);
  res.status(201).json(item);
});
app.put("/api/destinations/:id", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await DestModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Updated destination: ${updated.name}`);
  res.json(updated);
});
app.delete("/api/destinations/:id", requireCRUD, async (req, res) => {
  const deleted = await DestModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) await logActivity(req, `Deleted destination: ${deleted.name}`);
  res.status(204).end();
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  if (!q) return res.json({ destinations: [], tours: [] });
  const regex = new RegExp(q, "i");
  const [destinations, tours] = await Promise.all([
    DestModel.find({ $or: [{ name: regex }, { region: regex }, { description: regex }] }).lean(),
    TourModel.find({ $or: [{ name: regex }, { region: regex }, { overviewDescription: regex }] }).lean(),
  ]);
  res.json({ destinations, tours });
});

// ── Tours ─────────────────────────────────────────────────────────────────────
app.get("/api/tours", cacheEdge, async (req, res) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  const search = req.query.search ? String(req.query.search) : "";
  
  const query = {};
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { region: regex }];
  }
  
  if (page && limit) {
    const skip = (page - 1) * limit;
    const total = await TourModel.countDocuments(query);
    const tours = await TourModel.find(query, { itinerary: 0, sightseeing: 0, testimonials: 0, visualArchive: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({ items: tours, total, page, pages: Math.ceil(total / limit) });
  }
  
  // Legacy support for non-paginated requests
  res.json(await TourModel.find(query, { itinerary: 0, sightseeing: 0, testimonials: 0, visualArchive: 0 }).sort({ createdAt: -1 }).lean());
});
app.get("/api/tours/:id", cacheEdge, async (req, res) => {
  const found = await TourModel.findOne({ id: req.params.id }).lean();
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});
app.post("/api/tours", requireCRUD, async (req, res) => {
  const parsed = TourSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("tour"), ...parsed.data, createdAt: Date.now() };
  await TourModel.create(item);
  await logActivity(req, `Created tour: ${item.name}`);
  res.status(201).json(item);
});
app.put("/api/tours/:id", requireCRUD, async (req, res) => {
  const parsed = TourSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await TourModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Updated tour: ${updated.name}`);
  res.json(updated);
});
app.delete("/api/tours/:id", requireCRUD, async (req, res) => {
  const deleted = await TourModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) await logActivity(req, `Deleted tour: ${deleted.name}`);
  res.status(204).end();
});

// ── Visas ─────────────────────────────────────────────────────────────────────
app.get("/api/visas", cacheEdge, async (_req, res) => {
  res.json(await VisaModel.find({}).sort({ createdAt: -1 }).lean());
});
app.post("/api/visas", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("visa"), ...parsed.data, createdAt: Date.now() };
  await VisaModel.create(item);
  await logActivity(req, `Created visa: ${item.country}`);
  res.status(201).json(item);
});
app.put("/api/visas/:id", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await VisaModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Updated visa: ${updated.country}`);
  res.json(updated);
});
app.delete("/api/visas/:id", requireCRUD, async (req, res) => {
  const deleted = await VisaModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) await logActivity(req, `Deleted visa: ${deleted.country}`);
  res.status(204).end();
});

// ── Contacts ──────────────────────────────────────────────────────────────────
app.get("/api/contacts", requireAdmin, async (_req, res) => {
  res.json(await ContactModel.find({}).sort({ createdAt: -1 }).lean());
});
app.post("/api/contacts", async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("msg"), ...parsed.data, read: false, createdAt: Date.now() };
  await ContactModel.create(item);
  res.status(201).json(item);
});
app.patch("/api/contacts/:id/read", requireAdmin, async (req, res) => {
  const updated = await ContactModel.findOneAndUpdate({ id: req.params.id }, { $set: { read: true } }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Marked contact as read: ${updated.name}`);
  res.json(updated);
});
app.delete("/api/contacts/:id", requireAdmin, async (req, res) => {
  await ContactModel.deleteOne({ id: req.params.id });
  await logActivity(req, "Deleted contact message");
  return res.status(204).end();
});

const HERO_KEY   = "jf:hero";

// ── Hero Settings ─────────────────────────────────────────────────────────────
app.get("/api/hero-settings", async (_req, res) => {
  const settings = await SettingsModel.findOne({ key: "hero" }).lean();
  if (settings && settings.value) return res.json(settings.value);
  res.json({ home: [], tours: [], destinations: [], visaBanner: "" });
});
app.put("/api/hero-settings", requireAdmin, async (req, res) => {
  await SettingsModel.updateOne({ key: "hero" }, { $set: { value: req.body, updatedAt: Date.now() } }, { upsert: true });
  await logActivity(req, "Updated hero settings");
  res.json({ success: true });
});

const SEO_KEY = "jf:seo";

// ── SEO Settings ──────────────────────────────────────────────────────────────
app.get("/api/seo-settings", async (_req, res) => {
  const settings = await SettingsModel.findOne({ key: "seo" }).lean();
  if (settings && settings.value) return res.json(settings.value);
  res.json([]);
});
app.put("/api/seo-settings", requireAdmin, async (req, res) => {
  await SettingsModel.updateOne({ key: "seo" }, { $set: { value: req.body, updatedAt: Date.now() } }, { upsert: true });
  await logActivity(req, "Updated SEO settings");
  res.json({ success: true });
});

// ── API System Status ──────────────────────────────────────────────────────────
app.get("/api/admin/system-status", requireAdmin, async (req, res) => {
  const mongoOk = isMongoConnected();
  const redisOk = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const cloudOk = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  const passOk  = await AdminModel.countDocuments() > 0;

  res.json({
    mongodb: { status: mongoOk ? 'operational' : 'error', connected: mongoOk, dbName: process.env.MONGODB_DB || "journeyflicker" },
    redis: { status: redisOk ? 'operational' : 'offline', connected: redisOk },
    cloudinary: { status: cloudOk ? 'operational' : 'offline', connected: cloudOk, cloudName: process.env.CLOUDINARY_CLOUD_NAME || "Not Set" },
    auth: { status: passOk ? 'operational' : 'warning', secure: passOk, warningMsg: passOk ? null : "Master Admin is using default environment variables. Log out and log back in to automatically migrate to the database." }
  });
});
const DEFAULT_REVIEWS = [
  { id: '1', author: 'Prapti Patel', date: 'a day ago', rating: 5, content: 'We recently booked a tour with JourneyFlicker and was thoroughly impressed by their professionalism. PARSHWA and TUSHAR BHAI helped curate an amazing 10 day itinerary that was both flexible and cost-effective.' },
  { id: '2', author: 'Priyanka Thakor', date: '3 months ago', rating: 5, content: 'Excellent service from Journey Flicker. They managed our Andaman itinerary perfectly. What stood out most was their proactive support and rapid communication.' },
  { id: '3', author: 'Gaurang kher', date: '3 months ago', rating: 5, content: 'Had an amazing trip to the Andaman Islands organized by Journey Flicker. The team was incredibly supportive and provided a very quick response to all our queries. Highly recommended!' },
  { id: '4', author: 'janvi patel', date: 'a month ago', rating: 5, content: 'We had a wonderful Vietnam trip. All the arrangements like hotel, travel and activities were very well managed by Journey Flickers. Thank you for making our trip so comfortable and memorable.' },
  { id: '5', author: 'Akshar Patel', date: '3 months ago', rating: 5, content: 'Amazing Bali experience with JourneyFlikers! Great planning, lovely hotels, hassle-free transfers, and a super friendly guide. Excellent communication throughout. Totally worth it!' },
  { id: '6', author: 'ashish patel', date: '6 months ago', rating: 5, content: 'We booked a trip to Hong Kong and Macau through JourneyFlicker. The tour was very well organized and we had a truly amazing experience throughout the trip. Every moment was memorable.' },
  { id: '7', author: 'Sagar Goplani', date: '6 months ago', rating: 5, content: 'Best experience ever....hotel location, management service, tour guide. food quality was best.... We are very happy and satisfied with your service from start to end. Thank you!' },
  { id: '8', author: 'Hiren Mehta', date: '7 months ago', rating: 5, content: 'I booked a trip to Ayodhya-Prayagraj-Varanasi along with my parents who are senior citizens. JourneyFlicker is the best travel partner. The meticulous planning is commendable.' },
];

// ── Google Reviews ─────────────────────────────────────────────────────────────
app.get("/api/reviews", cacheEdge, async (req, res) => {
  const settings = await SettingsModel.findOne({ key: "google_reviews" }).lean();
  res.json(settings && settings.value ? settings.value : DEFAULT_REVIEWS);
});
app.put("/api/admin/reviews", requireAdmin, async (req, res) => {
  await SettingsModel.updateOne({ key: "google_reviews" }, { $set: { value: req.body, updatedAt: Date.now() } }, { upsert: true });
  await logActivity(req, "Updated Google Reviews");
  res.json({ success: true });
});

// ── Serve Admin Panel (Static Files) ──────────────────────────────────────────
let adminDistPath = path.resolve(__dirname, "../admin/dist");
if (process.env.VERCEL) {
  // Check common Vercel output paths
  const paths = [
    path.join(process.cwd(), "admin/dist"),
    path.join(__dirname, "admin/dist"),
    path.join(__dirname, "../admin/dist")
  ];
  adminDistPath = paths.find(p => fs.existsSync(p)) || paths[0];
}

console.log(`[Server] Admin Panel dist path: ${adminDistPath}`);
app.use(express.static(adminDistPath));

// ── SPA Fallback for Admin Panel ──────────────────────────────────────────────
app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  
  const indexPath = path.join(adminDistPath, "index.html");
  try {
    // ASYNC CHECK
    await fs.promises.access(indexPath);
    res.sendFile(indexPath);
  } catch {
    console.error(`[Server] Admin index.html not found at: ${indexPath}`);
    res.status(404).send(`Admin panel not built yet. Missing: ${indexPath}`);
  }
});

// ── Export for Vercel serverless ───────────────────────────────────────────────
// Local dev: still start the server normally
if (!process.env.VERCEL) {
  const port = process.env.PORT ? Number(process.env.PORT) : 5174;
  // ✅ Await MongoDB before accepting any requests — eliminates the race condition
  mongoReady.then(() => {
    if (isMongoConnected()) {
      console.log("[Server] MongoDB ready — starting HTTP listener.");
    } else {
      console.error("[Server] ❌ MongoDB mandatory — could not start HTTP listener.");
      process.exit(1);
    }
    app.listen(port, () => {
      console.log(`API listening on http://localhost:${port}`);
      startScheduledBackup();
    });
  });
} else {
  // On Vercel: serverless — connection is re-established per cold start.
}

export default app;
