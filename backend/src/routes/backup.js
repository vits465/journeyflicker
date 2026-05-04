/**
 * backup.js — Production-grade backup & restore system
 * Supports: JSON download, ZIP export, scheduled backups,
 * checksum verification, partial restore, dry-run mode
 */
import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import AdmZip from "adm-zip";
import cron from "node-cron";
import { isMongoConnected } from "../db/mongoose.js";
import { Destination, Tour, Visa, Contact, Media, Backup, Settings, CoEditor } from "../db/models/index.js";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export const router = express.Router();

// ── Backup storage directory ──────────────────────────────────────────────────
// On Vercel: /var/task is read-only → use /tmp (ephemeral but writable)
// On Railway/local: use project-level backups/ folder
const BACKUP_DIR = process.env.VERCEL
  ? "/tmp/jf-backups"
  : path.resolve(__dirname, "../../backups");

try {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
} catch (e) {
  console.warn("[Backup] Could not create backup dir:", e.message);
}

const MAX_BACKUPS = 20;
const PROJECT_VERSION = "1.0.0";

// ── Helpers ───────────────────────────────────────────────────────────────────
function sha256(data) {
  return crypto.createHash("sha256").update(
    typeof data === "string" ? data : JSON.stringify(data)
  ).digest("hex");
}

function newId(prefix = "bak") {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

/**
 * Collect all data from MongoDB (or KV fallback)
 */
async function collectData() {
  const [destinations, tours, visas, contacts, media, coEditors] = await Promise.all([
    Destination.find({}).lean(),
    Tour.find({}).lean(),
    Visa.find({}).lean(),
    Contact.find({}).lean(),
    Media.find({}).lean(),
    CoEditor.find({}).select("-password").lean(),
  ]);
  const heroSettings  = await Settings.findOne({ key: "hero" }).lean();
  const seoSettings   = await Settings.findOne({ key: "seo" }).lean();
  const apiSettings   = await Settings.findOne({ key: "api_settings" }).lean();

  return {
    destinations,
    tours,
    visas,
    contacts,
    media,
    coEditors,
    settings: {
      hero: heroSettings?.value || {},
      seo: seoSettings?.value || [],
      api: apiSettings?.value || {},
    },
  };
}

/**
 * Build the standard backup JSON payload
 */
async function buildBackupPayload(createdBy = "Admin") {
  const data = await collectData();
  const backupDate = new Date().toISOString();

  const payload = {
    metadata: {
      project:    "JourneyFlicker",
      version:    PROJECT_VERSION,
      backupDate,
      createdBy,
      schema:     "v2",
    },
    destinations: data.destinations,
    tours:        data.tours,
    visas:        data.visas,
    contacts:     data.contacts,
    media:        data.media,
    coEditors:    data.coEditors,
    settings:     data.settings,
  };

  // Compute checksum over content (excluding metadata.checksum itself)
  payload.metadata.checksum = sha256(JSON.stringify({
    destinations: payload.destinations,
    tours:        payload.tours,
    visas:        payload.visas,
    contacts:     payload.contacts,
    media:        payload.media,
  }));

  return payload;
}

/**
 * Save backup to disk, enforce MAX_BACKUPS
 */
async function saveBackupToDisk(payload, id, filename) {
  const filePath = path.join(BACKUP_DIR, filename);
  const jsonStr  = JSON.stringify(payload, null, 2);
  await fs.promises.writeFile(filePath, jsonStr, "utf-8");

  const stats = await fs.promises.stat(filePath);

  // Track in MongoDB if available
  if (isMongoConnected()) {
    await Backup.create({
      id,
      filename,
      checksum:    payload.metadata.checksum,
      size:        stats.size,
      storagePath: filePath,
      collections: {
        destinations: payload.destinations.length,
        tours:        payload.tours.length,
        visas:        payload.visas.length,
        contacts:     payload.contacts.length,
        media:        payload.media.length,
      },
      createdBy: payload.metadata.createdBy,
    });

    // Prune old backups
    const allBackups = await Backup.find({}).sort({ createdAt: 1 }).lean();
    if (allBackups.length > MAX_BACKUPS) {
      const toDelete = allBackups.slice(0, allBackups.length - MAX_BACKUPS);
      for (const b of toDelete) {
        try {
          if (b.storagePath && fs.existsSync(b.storagePath)) {
            await fs.promises.unlink(b.storagePath);
          }
          await Backup.deleteOne({ id: b.id });
        } catch {}
      }
    }
  }

  return { filePath, size: stats.size, checksum: payload.metadata.checksum };
}

/**
 * Validate backup JSON structure and checksum
 */
function validateBackup(payload) {
  const errors = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Invalid JSON structure"] };
  }

  const meta = payload.metadata;
  if (!meta?.project || !meta?.backupDate || !meta?.checksum) {
    errors.push("Missing required metadata fields (project, backupDate, checksum)");
  }
  if (meta?.project !== "JourneyFlicker") {
    errors.push(`Invalid project: expected 'JourneyFlicker', got '${meta?.project}'`);
  }

  // Verify checksum
  if (meta?.checksum) {
    const computed = sha256(JSON.stringify({
      destinations: payload.destinations || [],
      tours:        payload.tours        || [],
      visas:        payload.visas        || [],
      contacts:     payload.contacts     || [],
      media:        payload.media        || [],
    }));
    if (computed !== meta.checksum) {
      errors.push("Checksum mismatch — backup may be corrupted or tampered");
    }
  }

  if (!Array.isArray(payload.destinations)) errors.push("Invalid destinations array");
  if (!Array.isArray(payload.tours))        errors.push("Invalid tours array");
  if (!Array.isArray(payload.visas))        errors.push("Invalid visas array");

  return { valid: errors.length === 0, errors };
}

// ── Routes ────────────────────────────────────────────────────────────────────

/** POST /api/admin/backup/create — Create a new backup */
router.post("/create", async (req, res) => {
  try {
    const createdBy = req.user?.identifier === "admin" ? "Admin" : `Editor (${req.user?.identifier})`;
    const payload  = await buildBackupPayload(createdBy);
    const id       = newId("bak");
    const filename = `backup_${new Date().toISOString().replace(/[:.]/g, "-")}_${id}.json`;

    const { size, checksum } = await saveBackupToDisk(payload, id, filename);

    // Also store in KV as a lightweight index entry for compatibility
    try {
      const BACKUP_LIST = "jf:bak:index";
      const BACKUP_PFX  = "jf:bak:";
      const index = (await kv.get(BACKUP_LIST)) || [];
      index.unshift({ key: `${BACKUP_PFX}${filename}`, timestamp: filename, createdAt: Date.now(), id });
      if (index.length > MAX_BACKUPS) index.splice(MAX_BACKUPS);
      await kv.set(BACKUP_LIST, index);
    } catch {}

    return res.json({
      success: true,
      backup: { id, filename, size, checksum, createdAt: Date.now() },
    });
  } catch (err) {
    console.error("[Backup] Create failed:", err);
    return res.status(500).json({ error: `Backup failed: ${err.message}` });
  }
});

/** GET /api/admin/backup/list — List all backups */
router.get("/list", async (req, res) => {
  try {
    const backups = await Backup.find({}).sort({ createdAt: -1 }).lean();
    return res.json(backups.map(b => ({
      id:         b.id,
      filename:   b.filename,
      size:       b.size,
      checksum:   b.checksum,
      collections: b.collections,
      createdAt:  b.createdAt,
      createdBy:  b.createdBy,
      restoredAt: b.restoredAt,
      exists:     b.storagePath ? fs.existsSync(b.storagePath) : false,
    })));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/backup/download/:id — Download backup as JSON */
router.get("/download/:id", async (req, res) => {
  try {
    const record = await Backup.findOne({ $or: [{ id: req.params.id }, { filename: req.params.id }] }).lean();
    if (!record) return res.status(404).json({ error: "Backup not found" });
    const filePath = record.storagePath;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Backup file not found on disk" });
    }

    const filename = path.basename(filePath);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    return res.sendFile(filePath);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** GET /api/admin/backup/download-zip/:id — Download backup as ZIP */
router.get("/download-zip/:id", async (req, res) => {
  try {
    const record = await Backup.findOne({ $or: [{ id: req.params.id }, { filename: req.params.id }] }).lean();
    if (!record) return res.status(404).json({ error: "Backup not found" });
    const jsonFilePath = record.storagePath;
    const baseFilename = record.filename.replace(".json", "");

    if (!jsonFilePath || !fs.existsSync(jsonFilePath)) {
      return res.status(404).json({ error: "Backup file not found" });
    }

    res.setHeader("Content-Disposition", `attachment; filename="${baseFilename}.zip"`);
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => res.status(500).json({ error: err.message }));
    archive.pipe(res);
    archive.file(jsonFilePath, { name: `${baseFilename}.json` });

    // Add a README
    archive.append(
      `JourneyFlicker Backup\n=====================\nFilename: ${baseFilename}.json\nDate: ${new Date().toISOString()}\n\nTo restore: Admin Panel → Backup Manager → Restore → Upload this ZIP`,
      { name: "README.txt" }
    );

    await archive.finalize();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/admin/backup/:id — Delete a backup */
router.delete("/:id", async (req, res) => {
  try {
    const record = await Backup.findOneAndDelete({ $or: [{ id: req.params.id }, { filename: req.params.id }] }).lean();
    if (!record) return res.status(404).json({ error: "Backup not found" });
    if (record.storagePath && fs.existsSync(record.storagePath)) {
      await fs.promises.unlink(record.storagePath);
    }
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/admin/backup/restore — Restore from uploaded backup */
router.post("/restore", async (req, res) => {
  const { backupId, dryRun = false, collections = null } = req.body || {};
  const restoreLog = [];

  try {
    let payload;

    // Resolve payload from ID or inline JSON
    if (backupId) {
      const record = await Backup.findOne({ $or: [{ id: backupId }, { filename: backupId }] }).lean();
      if (!record) return res.status(404).json({ error: "Backup not found" });
      const filePath = record.storagePath;

      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Backup file not found on disk" });
      }
      const raw = await fs.promises.readFile(filePath, "utf-8");
      payload   = JSON.parse(raw);
    } else if (req.body?.payload) {
      payload = req.body.payload;
    } else {
      return res.status(400).json({ error: "Missing backupId or payload" });
    }

    // Validate
    const { valid, errors } = validateBackup(payload);
    if (!valid) {
      return res.status(422).json({ error: "Backup validation failed", errors });
    }

    // Preview mode
    if (dryRun) {
      return res.json({
        dryRun: true,
        preview: {
          destinations: payload.destinations?.length ?? 0,
          tours:        payload.tours?.length        ?? 0,
          visas:        payload.visas?.length         ?? 0,
          contacts:     payload.contacts?.length      ?? 0,
          media:        payload.media?.length         ?? 0,
        },
        metadata: payload.metadata,
        validation: { valid, errors },
      });
    }

    // Create a safety snapshot before restoring
    restoreLog.push("Creating pre-restore safety snapshot...");
    try {
      const safetyPayload  = await buildBackupPayload("System-PreRestore");
      const safetyId       = newId("safety");
      const safetyFilename = `safety_prerestore_${safetyId}.json`;
      await saveBackupToDisk(safetyPayload, safetyId, safetyFilename);
      restoreLog.push(`Safety snapshot created: ${safetyFilename}`);
    } catch (snapErr) {
      restoreLog.push(`Warning: Safety snapshot failed: ${snapErr.message}`);
    }

    const collectionsToRestore = collections || ["destinations", "tours", "visas", "contacts", "media"];

    for (const col of collectionsToRestore) {
      const items = payload[col];
      if (!Array.isArray(items)) continue;

      try {
        if (col === "destinations") {
          await Destination.deleteMany({});
          if (items.length) await Destination.insertMany(items, { ordered: false });
        } else if (col === "tours") {
          await Tour.deleteMany({});
          if (items.length) await Tour.insertMany(items, { ordered: false });
        } else if (col === "visas") {
          await Visa.deleteMany({});
          if (items.length) await Visa.insertMany(items, { ordered: false });
        } else if (col === "contacts") {
          await Contact.deleteMany({});
          if (items.length) await Contact.insertMany(items, { ordered: false });
        } else if (col === "media") {
          await Media.deleteMany({});
          if (items.length) await Media.insertMany(items, { ordered: false });
        }
        restoreLog.push(`✓ Restored ${items.length} ${col}`);
      } catch (colErr) {
        restoreLog.push(`✗ Failed to restore ${col}: ${colErr.message}`);
      }
    }

    // Update restore timestamp in MongoDB
    if (backupId) {
      await Backup.updateOne({ $or: [{ id: backupId }, { filename: backupId }] }, { $set: { restoredAt: Date.now() } });
    }

    return res.json({ success: true, log: restoreLog });
  } catch (err) {
    console.error("[Restore] Failed:", err);
    return res.status(500).json({ error: `Restore failed: ${err.message}`, log: restoreLog });
  }
});

/** POST /api/admin/backup/upload — Upload a backup file for preview/restore */
router.post("/upload", async (req, res) => {
  try {
    const { filename, content } = req.body || {};
    if (!filename || !content) {
      return res.status(400).json({ error: "Missing filename or content" });
    }

    // Handle ZIP files
    if (filename.endsWith(".zip")) {
      const buf = Buffer.from(content, "base64");
      const zip = new AdmZip(buf);
      const entries = zip.getEntries().filter(e => e.name.endsWith(".json"));
      if (!entries.length) return res.status(400).json({ error: "No JSON found in ZIP" });
      const jsonStr = zip.readAsText(entries[0]);
      const payload = JSON.parse(jsonStr);
      const { valid, errors } = validateBackup(payload);
      return res.json({ payload, valid, errors });
    }

    // Handle JSON files
    const payload = JSON.parse(content);
    const { valid, errors } = validateBackup(payload);
    return res.json({ payload, valid, errors });
  } catch (err) {
    return res.status(400).json({ error: `Failed to parse backup: ${err.message}` });
  }
});

/** GET /api/admin/backup/stats — Backup statistics */
router.get("/stats", async (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith(".json"));
    const totalSize = files.reduce((sum, f) => {
      try { return sum + fs.statSync(path.join(BACKUP_DIR, f)).size; } catch { return sum; }
    }, 0);

    const dbCount = await Backup.countDocuments();
    const latest = await Backup.findOne({}).sort({ createdAt: -1 }).lean();
    const lastBackup = latest?.createdAt || null;

    return res.json({
      count:      dbCount,
      totalSize,
      maxBackups: MAX_BACKUPS,
      diskFiles:  files.length,
      lastBackup,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── Scheduled Backup ──────────────────────────────────────────────────────────
let scheduledJob = null;

export function startScheduledBackup() {
  if (scheduledJob) return;
  // Daily at 2:00 AM
  scheduledJob = cron.schedule("0 2 * * *", async () => {
    console.log("[Backup] Running scheduled backup...");
    try {
      const payload  = await buildBackupPayload("Scheduled");
      const id       = newId("sched");
      const filename = `scheduled_${new Date().toISOString().replace(/[:.]/g, "-")}_${id}.json`;
      const { size } = await saveBackupToDisk(payload, id, filename);
      console.log(`[Backup] Scheduled backup created: ${filename} (${size} bytes)`);
    } catch (err) {
      console.error("[Backup] Scheduled backup failed:", err);
    }
  }, { timezone: "UTC" });
  console.log("[Backup] Scheduled daily backup registered (2:00 AM UTC)");
}

export function buildBackupPayloadExport(createdBy) {
  return buildBackupPayload(createdBy);
}
