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
import { Destination as DestModel, Tour as TourModel, Visa as VisaModel, Contact as ContactModel, Settings as SettingsModel, CoEditor as CoEditorModel, Media as MediaModel, Admin as AdminModel, SystemLog as SystemLogModel, Inquiry as InquiryModel } from "./db/models/index.js";
import { router as backupRouter, startScheduledBackup } from "./routes/backup.js";
import { router as importExportRouter } from "./routes/import-export.js";
import { router as enhancedMediaRouter } from "./routes/media.js";
import { router as migrateRouter } from "./routes/migrate.js";
import { router as pdfRouter } from "./routes/pdf.js";
import { sendInquiryNotification } from "./lib/email.js";
import { processImageForSection } from "./lib/imageProcessor.js";
import { compressItineraryAlgorithmic, compressItineraryAI } from "./lib/itinerary-compressor.js";
import multer from "multer";
import Fuse from "fuse.js";

const uploadMulter = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

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

// ── MongoDB Auto-Reconnect Middleware ─────────────────────────────────────────
// This ensures that if the database disconnects (e.g. socket timeout when laptop sleeps
// or browser is minimized for a long time), the next API request will reconnect.
app.use("/api", async (req, res, next) => {
  if (!isMongoConnected()) {
    try {
      await connectMongo();
    } catch (err) {
      console.error("[MongoDB] Auto-reconnect failed in middleware:", err.message);
    }
  }
  next();
});

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
    const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177").split(",");
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('journeyflicker.com')) {
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
// Automatically optimizes images before upload:
//   - Crops to exact aspect ratio for the target section (no stretching)
//   - Smart focal-point crop (faces/subjects preserved)
//   - Strips EXIF metadata (privacy + smaller files)
//   - Converts to WebP
// Pass `section` in the request body to activate optimization.
// Supported sections: hero, sightseeing, destinations, tours, visa, overview,
//                     tour-thumbs, signature, landmarks, gallery, itinerary
app.post("/api/upload", requireCRUD, uploadMulter.single("file"), async (req, res) => {
  let name = req.body.name || "upload";
  let data = req.body.data;
  const section = req.body.section;

  if (req.file) {
    name = req.file.originalname;
    data = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  }

  if (!name || !data) return res.status(400).json({ error: "Missing name or file data" });
  if (!data.startsWith("data:")) return res.status(400).json({ error: "Invalid file format" });

  // ── Auto-optimize image for the given section ─────────────────────────────
  // Falls back to original on any error — upload is never blocked.
  let uploadData = data;
  let optimizationMeta = null;
  if (section) {
    const result = await processImageForSection(data, section);
    uploadData = result.dataUri;
    optimizationMeta = {
      section,
      skipped:        result.skipped,
      spec:           result.spec,
      originalKB:     +(result.originalBytes / 1024).toFixed(1),
      optimizedKB:    +(result.optimizedBytes / 1024).toFixed(1),
      savedPct:       result.originalBytes > 0
        ? +((( result.originalBytes - result.optimizedBytes) / result.originalBytes) * 100).toFixed(1)
        : 0,
    };
  }

  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;

  // ── Try Cloudinary first (if credentials available) ──────────────────────
  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(uploadData, {
        folder:          "journeyflicker",
        resource_type:   "auto",
        use_filename:    false,
        unique_filename: true,
      });
      return res.json({ url: result.secure_url, storage: "cloudinary", optimization: optimizationMeta });
    } catch (err) {
      console.error("Cloudinary upload error (falling back to local):", err);
      // Fall through to local save
    }
  }

  // ── Local disk fallback (dev mode or Cloudinary failed) ───────────────────
  try {
    const mimeMatch = uploadData.match(/^data:([^;]+);base64,/);
    if (!mimeMatch) return res.status(400).json({ error: "Invalid data URI" });

    const mimeType   = mimeMatch[1];
    const base64Data = uploadData.replace(/^data:[^;]+;base64,/, "");

    // Security: whitelist allowed extensions
    const extMap = {
      "image/jpeg":   "jpg",
      "image/png":    "png",
      "image/webp":   "webp",
      "image/gif":    "gif",
      "image/svg+xml": "svg",
      "application/pdf": "pdf",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    };
    const ext = extMap[mimeType] || (uploadData.match(/^data:image\/(\w+)/)?.[1] || "jpg");

    if (!["jpg", "jpeg", "png", "webp", "gif", "svg", "pdf", "doc", "docx"].includes(ext.toLowerCase())) {
      return res.status(400).json({ error: `File type ${ext} not allowed for security reasons.` });
    }

    const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    // Always use .webp extension when optimization ran successfully
    const finalExt  = optimizationMeta && !optimizationMeta.skipped ? "webp" : ext;
    const filename  = `${Date.now()}_${safeName.replace(/\.[^.]+$/, "")}.${finalExt}`;
    const filePath  = path.join(uploadsDir, filename);

    await fs.promises.writeFile(filePath, Buffer.from(base64Data, "base64"));

    const host     = req.headers["x-forwarded-host"] || req.headers.host || `localhost:${process.env.PORT || 5174}`;
    const protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
    const url      = `${protocol}://${host}/uploads/${filename}`;

    console.log(`[Upload] Saved locally: ${filePath}`);
    await logActivity(req, `Uploaded file: ${filename}`);
    return res.json({ url, storage: "local", optimization: optimizationMeta });
  } catch (err) {
    console.error("Local upload error:", err);
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
app.use("/api/pdf", pdfRouter);










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
  published: z.boolean().optional().default(true),
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
  // Bypass cache completely for admin requests (with Authorization header) or local environment requests
  const isLocal = req.headers.host && (req.headers.host.includes("localhost") || req.headers.host.includes("127.0.0.1"));
  if (req.headers.authorization || isLocal) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return next();
  }
  // Shorten Edge & Browser cache for public requests to prevent stale data
  res.setHeader("Cache-Control", "public, max-age=2, s-maxage=5, stale-while-revalidate=10");
  next();
};

// ── Redis Cache Middleware ────────────────────────────────────────────────────
const getPrefixFromUrl = (url) => {
  if (url.includes("/destinations")) return "destinations";
  if (url.includes("/tours")) return "tours";
  if (url.includes("/visas")) return "visas";
  return "general";
};

const cacheRedis = async (req, res, next) => {
  if (req.method !== "GET" || req.headers.authorization) return next();
  
  const key = `jf:cache:${req.originalUrl}`;
  try {
    const cached = await kv.get(key);
    if (cached) {
      res.setHeader("X-Cache", "HIT");
      return res.json(typeof cached === "string" ? JSON.parse(cached) : cached);
    }

    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json;
    res.json = function(data) {
      const prefix = getPrefixFromUrl(req.originalUrl);
      const setKey = `jf:set:${prefix}`;
      
      kv.set(key, JSON.stringify(data), { ex: 60 * 5 }).catch(console.error); // 5 min
      kv.sadd(setKey, key).catch(console.error);
      kv.expire(setKey, 60 * 5).catch(console.error);

      originalJson.call(this, data);
    };
    next();
  } catch (err) {
    console.error("Redis Cache Error:", err);
    next();
  }
};

// ── Redis Rate Limiter for Public Forms ───────────────────────────────────────
const contactLimiter = async (req, res, next) => {
  const ip = getIp(req);
  const key = `jf:rl:contacts:${ip}`;
  try {
    const current = await kv.incr(key);
    if (current === 1) await kv.expire(key, 60 * 15); // 15 mins block
    if (current > 5) return res.status(429).json({ error: "Too many requests. Please try again later." });
    next();
  } catch (err) {
    next();
  }
};

// ── Redis Rate Limiter for Public Telemetry Logs ──────────────────────────────
const logLimiter = async (req, res, next) => {
  const ip = getIp(req);
  const key = `jf:rl:logs:${ip}`;
  try {
    const current = await kv.incr(key);
    if (current === 1) await kv.expire(key, 60 * 15); // 15 mins block
    if (current > 10) return res.status(429).json({ error: "Too many log reports. Please try again later." });
    next();
  } catch (err) {
    next();
  }
};

// ── Helper to Invalidate Cache ────────────────────────────────────────────────
const invalidateCache = async (prefix) => {
  const setKey = `jf:set:${prefix}`;
  try {
    const keys = await kv.smembers(setKey);
    if (keys && keys.length > 0) {
      await kv.del(...keys);
    }
    await kv.del(setKey);
  } catch (e) {
    console.error("Invalidate Set-based cache err:", e);
    // Fallback to KEYS lookup to prevent stale cache on system anomalies
    try {
      const fallbackKeys = await kv.keys(`jf:cache:*${prefix}*`);
      if (fallbackKeys && fallbackKeys.length > 0) {
        await kv.del(...fallbackKeys);
      }
    } catch (fbErr) {
      console.error("Fallback invalidate err:", fbErr);
    }
  }
};

// ── Destinations ──────────────────────────────────────────────────────────────
app.get("/api/destinations", cacheEdge, cacheRedis, async (req, res) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  const search = req.query.search ? String(req.query.search) : "";

  const query = {};
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { region: regex }, { description: regex }];
  }

  if (page && limit) {
    const skip = (page - 1) * limit;
    const total = await DestModel.countDocuments(query);
    const dests = await DestModel.find(query, { galleryImages: 0, seasonsHighlights: 0 })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({ items: dests, total, page, pages: Math.ceil(total / limit) });
  }

  // Legacy support for non-paginated requests
  res.json(await DestModel.find(query, { galleryImages: 0, seasonsHighlights: 0 }).sort({ createdAt: -1 }).lean());
});
app.get("/api/destinations/:id", cacheEdge, cacheRedis, async (req, res) => {
  const found = await DestModel.findOne({ id: req.params.id }).lean();
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});
app.post("/api/destinations", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("dest"), ...parsed.data, createdAt: Date.now() };
  await DestModel.create(item);
  await invalidateCache("destinations");
  await logActivity(req, `Created destination: ${item.name}`);
  res.status(201).json(item);
});
app.put("/api/destinations/:id", requireCRUD, async (req, res) => {
  const parsed = DestinationSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await DestModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await invalidateCache("destinations");
  await logActivity(req, `Updated destination: ${updated.name}`);
  res.json(updated);
});
app.delete("/api/destinations/:id", requireCRUD, async (req, res) => {
  const deleted = await DestModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) {
    await invalidateCache("destinations");
    await logActivity(req, `Deleted destination: ${deleted.name}`);
  }
  res.status(204).end();
});

// ── Search ────────────────────────────────────────────────────────────────────
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.json({ destinations: [], tours: [] });

  const isAdmin = !!req.headers.authorization;
  try {
    const [allDestinations, allTours] = await Promise.all([
      DestModel.find({}).lean(),
      TourModel.find(isAdmin ? {} : { published: { $ne: false } }).lean(),
    ]);

    const destFuse = new Fuse(allDestinations, {
      keys: ["name", "region", "description", "essenceText"],
      threshold: 0.4,
    });
    const destResults = destFuse.search(q).map(r => r.item);

    const tourFuse = new Fuse(allTours, {
      keys: ["name", "region", "overviewDescription", "category"],
      threshold: 0.4,
    });
    const tourResults = tourFuse.search(q).map(r => r.item);

    res.json({ destinations: destResults, tours: tourResults });
  } catch (err) {
    console.error("Fuzzy Search Error:", err);
    const regex = new RegExp(q.toLowerCase(), "i");
    const tourQuery = {
      $and: [
        isAdmin ? {} : { published: { $ne: false } },
        { $or: [{ name: regex }, { region: regex }, { overviewDescription: regex }] }
      ]
    };
    const [destinations, tours] = await Promise.all([
      DestModel.find({ $or: [{ name: regex }, { region: regex }, { description: regex }] }).lean(),
      TourModel.find(tourQuery).lean(),
    ]);
    res.json({ destinations, tours });
  }
});

// ── Tours ─────────────────────────────────────────────────────────────────────
app.get("/api/tours", cacheEdge, cacheRedis, async (req, res) => {
  const page = parseInt(req.query.page, 10);
  const limit = parseInt(req.query.limit, 10);
  const search = req.query.search ? String(req.query.search) : "";
  
  const query = {};
  if (search) {
    const regex = new RegExp(search, "i");
    query.$or = [{ name: regex }, { region: regex }];
  }

  // Filter hidden tours for public users
  const isAdmin = !!req.headers.authorization;
  if (!isAdmin) {
    query.published = { $ne: false };
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
app.get("/api/tours/:id", cacheEdge, cacheRedis, async (req, res) => {
  const found = await TourModel.findOne({ id: req.params.id }).lean();
  if (!found) return res.status(404).json({ message: "Not found" });
  
  // Exclude hidden tours for public users
  const isAdmin = !!req.headers.authorization;
  if (!isAdmin && found.published === false) {
    return res.status(404).json({ message: "Not found" });
  }
  
  res.json(found);
});
app.post("/api/tours", requireCRUD, async (req, res) => {
  const parsed = TourSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("tour"), ...parsed.data, createdAt: Date.now() };
  await TourModel.create(item);
  await invalidateCache("tours");
  await logActivity(req, `Created tour: ${item.name}`);
  res.status(201).json(item);
});
app.put("/api/tours/:id", requireCRUD, async (req, res) => {
  const parsed = TourSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await TourModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await invalidateCache("tours");
  await logActivity(req, `Updated tour: ${updated.name}`);
  res.json(updated);
});
app.delete("/api/tours/:id", requireCRUD, async (req, res) => {
  const deleted = await TourModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) {
    await invalidateCache("tours");
    await logActivity(req, `Deleted tour: ${deleted.name}`);
  }
  res.status(204).end();
});
app.post("/api/admin/tours/shorten", requireCRUD, async (req, res) => {
  const { tourId, days, mode, previewOnly = false } = req.body;
  if (!tourId || !days || !mode) {
    return res.status(400).json({ error: "Missing required parameters: tourId, days, and mode are required." });
  }

  const targetDays = parseInt(days, 10);
  if (isNaN(targetDays) || targetDays < 2 || targetDays > 10) {
    return res.status(400).json({ error: "Invalid target duration. Must be between 2 and 10 days." });
  }

  if (!["algo", "ai"].includes(mode)) {
    return res.status(400).json({ error: "Invalid compression mode. Must be 'algo' or 'ai'." });
  }

  try {
    const originalTour = await TourModel.findOne({ id: tourId }).lean();
    if (!originalTour) {
      return res.status(404).json({ error: "Original tour not found." });
    }

    if (targetDays >= originalTour.days) {
      return res.status(400).json({ error: `Target duration (${targetDays} days) must be shorter than the original tour (${originalTour.days} days).` });
    }

    let compressedTour = null;
    if (mode === "ai") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini AI Curation is not configured on this server (missing GEMINI_API_KEY)." });
      }
      compressedTour = await compressItineraryAI(originalTour, targetDays, apiKey);
    } else {
      compressedTour = compressItineraryAlgorithmic(originalTour, targetDays);
    }

    if (previewOnly) {
      // Return the generated preview without saving it to database
      return res.json({ preview: compressedTour });
    }

    // Save to MongoDB
    await TourModel.create(compressedTour);

    // Sync to local db.json
    const paths = [
      path.join(process.cwd(), "data/db.json"),
      path.join(process.cwd(), "backend/data/db.json"),
      path.join(__dirname, "../data/db.json"),
      path.join(__dirname, "data/db.json"),
      path.join(__dirname, "../backend/data/db.json")
    ];
    const dbPath = paths.find(p => fs.existsSync(p));
    if (dbPath) {
      try {
        const raw = fs.readFileSync(dbPath, "utf-8");
        const db = JSON.parse(raw);
        if (!db.tours) db.tours = [];
        db.tours.push(compressedTour);
        fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
      } catch (err) {
        console.error("[Shortener API] Failed to write to local db.json:", err.message);
      }
    }

    // Invalidate caches
    await invalidateCache("tours");
    await logActivity(req, `Condensed tour: ${compressedTour.name} (${targetDays} Days)`);

    res.status(201).json(compressedTour);
  } catch (err) {
    console.error("[Shortener API] Compression failed:", err);
    res.status(500).json({ error: `Compression failed: ${err.message}` });
  }
});

// ── Visas ─────────────────────────────────────────────────────────────────────
app.get("/api/visas", cacheEdge, cacheRedis, async (_req, res) => {
  res.json(await VisaModel.find({}).sort({ createdAt: -1 }).lean());
});
app.post("/api/visas", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("visa"), ...parsed.data, createdAt: Date.now() };
  await VisaModel.create(item);
  await invalidateCache("visas");
  await logActivity(req, `Created visa: ${item.country}`);
  res.status(201).json(item);
});
app.put("/api/visas/:id", requireCRUD, async (req, res) => {
  const parsed = VisaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const updated = await VisaModel.findOneAndUpdate({ id: req.params.id }, { $set: parsed.data }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await invalidateCache("visas");
  await logActivity(req, `Updated visa: ${updated.country}`);
  res.json(updated);
});
app.delete("/api/visas/:id", requireCRUD, async (req, res) => {
  const deleted = await VisaModel.findOneAndDelete({ id: req.params.id }).lean();
  if (deleted) {
    await invalidateCache("visas");
    await logActivity(req, `Deleted visa: ${deleted.country}`);
  }
  res.status(204).end();
});

// ── Contacts ──────────────────────────────────────────────────────────────────
app.get("/api/contacts", requireAdmin, async (_req, res) => {
  res.json(await ContactModel.find({}).sort({ createdAt: -1 }).lean());
});
app.post("/api/contacts", contactLimiter, async (req, res) => {
  // Honeypot spam protection (bots fill out all fields, including hidden ones)
  if (req.body.honeypot && req.body.honeypot.trim() !== "") {
    console.log("[Spam] Bot submission blocked via honeypot:", req.body.honeypot);
    return res.status(200).json({ id: "msg_spam", read: true, createdAt: Date.now() });
  }

  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const item = { id: newId("msg"), ...parsed.data, read: false, createdAt: Date.now() };
  await ContactModel.create(item);
  
  // Send email notifications (non-blocking)
  sendInquiryNotification(item).catch(console.error);

  // Forward to chatbot server for automated WhatsApp notifications (non-blocking)
  const chatbotUrl = process.env.CHATBOT_SERVER_URL || "http://localhost:3000";
  if (chatbotUrl) {
    fetch(`${chatbotUrl}/api/external-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: item.name,
        email: item.email,
        type: item.type,
        message: item.message,
        secret: process.env.CHATBOT_SYNC_SECRET || "supersecretkey_journeyflicker_9988"
      })
    }).catch(err => console.warn("[Sync] Chatbot lead forwarding failed:", err.message));
  }
  
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

// ── WhatsApp Chatbot Inquiries ──
app.get("/api/whatsapp-inquiries", requireAdmin, async (_req, res) => {
  res.json(await InquiryModel.find({}).sort({ date: -1 }).lean());
});
app.patch("/api/whatsapp-inquiries/:id/status", requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['New', 'Quoted', 'Booked', 'Closed'].includes(status)) {
    return res.status(400).json({ error: "Invalid status value" });
  }
  const updated = await InquiryModel.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true }).lean();
  if (!updated) return res.status(404).json({ message: "Not found" });
  await logActivity(req, `Updated WhatsApp inquiry status: ${updated.name} -> ${status}`);
  res.json(updated);
});
app.delete("/api/whatsapp-inquiries/:id", requireAdmin, async (req, res) => {
  await InquiryModel.findByIdAndDelete(req.params.id);
  await logActivity(req, "Deleted WhatsApp inquiry");
  return res.status(204).end();
});

app.get("/api/chatbot/knowledge", async (req, res) => {
  const secret = req.query.secret;
  const configuredSecret = process.env.CHATBOT_SYNC_SECRET || "supersecretkey_journeyflicker_9988";
  if (secret !== configuredSecret) {
    return res.status(401).json({ error: "Unauthorized access to chatbot knowledge base." });
  }

  try {
    const [destinations, tours] = await Promise.all([
      DestModel.find({}).lean(),
      TourModel.find({ published: { $ne: false } }).lean()
    ]);

    const condensedDestinations = destinations.map(d => ({
      name: d.name,
      region: d.region,
      description: d.description || "",
      essence: d.essenceText || "",
      bestMonths: d.bestSeasonsMonths || "",
      landmarks: (d.landmarks || []).map(l => `${l.title} (${l.category}: ${l.description})`).join(" | ")
    }));

    const condensedTours = tours.map(t => ({
      name: t.name,
      region: t.region,
      days: t.days,
      price: t.price,
      category: t.category,
      overview: t.overviewDescription || "",
      highlights: (t.sightseeing || []).map(s => s.title).join(", "),
      itinerary: (t.itinerary || []).map((day, idx) => `Day ${idx + 1}: ${day.title.replace(/^Day \d+\s*:\s*/i, "")} - ${day.description || ""}`).join(" | ")
    }));

    res.json({
      success: true,
      destinations: condensedDestinations,
      tours: condensedTours,
      timestamp: Date.now()
    });
  } catch (err) {
    console.error("[Chatbot Knowledge API] Failed to compile context:", err);
    res.status(500).json({ error: "Failed to compile knowledge base context." });
  }
});

app.post("/api/chat", async (req, res) => {
  const chatbotUrl = process.env.CHATBOT_SERVER_URL || "https://journeyflicker-automation.onrender.com";
  try {
    const response = await fetch(`${chatbotUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      throw new Error(`Chatbot server error: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("[Proxy Chat] Failed to fetch chatbot AI reply:", err.message);
    res.status(500).json({ error: "Failed to fetch response" });
  }
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
  const geminiOk = !!process.env.GEMINI_API_KEY;
  const smtpOk = !!process.env.SMTP_HOST;

  // Query Chatbot server status
  let whatsappStatus = 'offline';
  let whatsappMeta = 'Not Configured';
  let geminiStatus = 'offline';

  const chatbotUrl = process.env.CHATBOT_SERVER_URL || "https://journeyflicker-automation.onrender.com";
  const secret = process.env.CHATBOT_SYNC_SECRET || "supersecretkey_journeyflicker_9988";
  
  try {
    const chatStatusRes = await fetch(`${chatbotUrl}/api/chatbot-status?secret=${secret}`);
    if (chatStatusRes.ok) {
      const chatStatusData = await chatStatusRes.json();
      whatsappStatus = chatStatusData.whatsapp || 'offline';
      whatsappMeta = chatStatusData.whatsapp === 'operational' ? `Phone ID: ${chatStatusData.phoneId}` : 'Credentials incomplete';
      geminiStatus = chatStatusData.gemini || 'offline';
    }
  } catch (err) {
    console.error("[System Status] Failed to fetch chatbot server status:", err.message);
  }

  res.json({
    mongodb: { status: mongoOk ? 'operational' : 'error', connected: mongoOk, dbName: process.env.MONGODB_DB || "journeyflicker" },
    redis: { status: redisOk ? 'operational' : 'offline', connected: redisOk },
    cloudinary: { status: cloudOk ? 'operational' : 'offline', connected: cloudOk, cloudName: process.env.CLOUDINARY_CLOUD_NAME || "Not Set" },
    auth: { status: passOk ? 'operational' : 'warning', secure: passOk, warningMsg: passOk ? null : "Master Admin is using default environment variables. Log out and log back in to automatically migrate to the database." },
    whatsapp: { status: whatsappStatus, connected: whatsappStatus === 'operational', meta: whatsappMeta },
    chatbotGemini: { status: geminiStatus, connected: geminiStatus === 'operational' },
    geminiWebsite: { status: geminiOk ? 'operational' : 'offline', connected: geminiOk },
    smtpMail: { status: smtpOk ? 'operational' : 'offline', connected: smtpOk, host: process.env.SMTP_HOST || 'Not Configured' }
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

// ── System Logs (Frontend Analytics) ──────────────────────────────────────────
// Public endpoint — frontend sends errors here (no auth required)
app.post("/api/logs", logLimiter, async (req, res) => {
  try {
    const { level = "error", source = "frontend", message, stack, url, userAgent } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });
    const id = newId("log");
    await SystemLogModel.create({ id, level, source, message: String(message).slice(0, 2000), stack: String(stack || "").slice(0, 5000), url: String(url || "").slice(0, 500), userAgent: String(userAgent || "").slice(0, 300) });
    res.status(201).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list logs
app.get("/api/admin/logs", requireAdmin, async (req, res) => {
  try {
    const { level, source, resolved, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (level && level !== "all") filter.level = level;
    if (source && source !== "all") filter.source = source;
    if (resolved !== undefined) filter.resolved = resolved === "true";
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      SystemLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SystemLogModel.countDocuments(filter),
    ]);
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: mark resolved / unresolved
app.patch("/api/admin/logs/:id", requireAdmin, async (req, res) => {
  try {
    const { resolved } = req.body;
    const log = await SystemLogModel.findOneAndUpdate({ id: req.params.id }, { $set: { resolved } }, { new: true }).lean();
    if (!log) return res.status(404).json({ error: "Not found" });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: delete single log
app.delete("/api/admin/logs/:id", requireAdmin, async (req, res) => {
  try {
    await SystemLogModel.deleteOne({ id: req.params.id });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: clear all resolved logs
app.delete("/api/admin/logs", requireAdmin, async (req, res) => {
  try {
    const { deleteAll } = req.query;
    const filter = deleteAll === "true" ? {} : { resolved: true };
    const { deletedCount } = await SystemLogModel.deleteMany(filter);
    res.json({ deleted: deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

async function autoSeedDatabase() {
  try {
    const destCount = await DestModel.countDocuments();
    if (destCount > 0) {
      console.log("[Seeder] Database already populated. Skipping auto-seed.");
      return;
    }

    console.log("[Seeder] ℹ Empty database detected. Initiating auto-seed from db.json...");
    
    const paths = [
      path.join(process.cwd(), "data/db.json"),
      path.join(process.cwd(), "backend/data/db.json"),
      path.join(__dirname, "../data/db.json"),
      path.join(__dirname, "data/db.json"),
      path.join(__dirname, "../backend/data/db.json")
    ];
    const dbPath = paths.find(p => fs.existsSync(p));
    
    if (!dbPath) {
      console.warn("[Seeder] ⚠ db.json not found in searched paths:", paths);
      return;
    }

    console.log(`[Seeder] Found db.json at: ${dbPath}`);
    const raw = fs.readFileSync(dbPath, "utf-8");
    const db = JSON.parse(raw);

    if (db.destinations && db.destinations.length) {
      await DestModel.insertMany(db.destinations);
      console.log(`[Seeder] ✓ Seeded ${db.destinations.length} destinations.`);
    }
    if (db.tours && db.tours.length) {
      await TourModel.insertMany(db.tours);
      console.log(`[Seeder] ✓ Seeded ${db.tours.length} tours.`);
    }
    if (db.visas && db.visas.length) {
      await VisaModel.insertMany(db.visas);
      console.log(`[Seeder] ✓ Seeded ${db.visas.length} visas.`);
    }

    console.log("[Seeder] ✅ Auto-seed completed successfully!");
  } catch (err) {
    console.error("[Seeder] ❌ Failed to auto-seed database:", err.message);
  }
}

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

// ── Dynamic Sitemap XML ───────────────────────────────────────────────────────
app.get("/api/sitemap.xml", cacheEdge, async (req, res) => {
  try {
    const tours = await TourModel.find({ published: { $ne: false } }, "id").lean();
    const destinations = await DestModel.find({}, "id").lean();

    const domain = "https://www.journeyflicker.com";
    const today = new Date().toISOString().split("T")[0];

    const staticPages = [
      { path: "", freq: "daily", prio: "1.0" },
      { path: "/tours", freq: "weekly", prio: "0.8" },
      { path: "/destinations", freq: "weekly", prio: "0.8" },
      { path: "/visas", freq: "weekly", prio: "0.8" },
      { path: "/about", freq: "monthly", prio: "0.5" },
      { path: "/contact", freq: "monthly", prio: "0.5" },
      { path: "/faq", freq: "monthly", prio: "0.5" },
      { path: "/bespoke", freq: "monthly", prio: "0.8" }
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}${page.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.freq}</changefreq>\n`;
      xml += `    <priority>${page.prio}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Tours
    for (const tour of tours) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/tours/${tour.id}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic Destinations
    for (const dest of destinations) {
      xml += `  <url>\n`;
      xml += `    <loc>${domain}/destinations/${dest.id}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>\n`;

    res.header("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("[Sitemap] Dynamic XML generation failed:", error);
    res.status(500).send("Error generating sitemap");
  }
});

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
  mongoReady.then(async () => {
    if (isMongoConnected()) {
      console.log("[Server] MongoDB ready — starting HTTP listener.");
      // Trigger database auto-seeding
      await autoSeedDatabase();
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
