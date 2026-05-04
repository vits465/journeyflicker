/**
 * media.js — Enhanced media API with:
 * - Promise.allSettled for reliable multi-upload
 * - SHA-256 duplicate detection (warning only, never blocks)
 * - Cloudinary with unique public_ids
 * - Soft delete & restore
 * - Usage detection
 * - Sort, search, date/folder filter
 * - Bulk operations
 */
import express from "express";
import crypto from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { isMongoConnected } from "../db/mongoose.js";
import { Media as MediaModel, Destination, Tour } from "../db/models/index.js";

export const router = express.Router();

function newId(prefix = "media") {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

function generatePublicId() {
  const rand = crypto.randomBytes(6).toString("hex");
  return `journeyflicker/${Date.now()}-${rand}`;
}

/** Compute SHA-256 hash from base64 data string */
function computeHash(base64Data) {
  try {
    const raw = base64Data.replace(/^data:[^;]+;base64,/, "");
    return crypto.createHash("sha256").update(raw).digest("hex");
  } catch {
    return "";
  }
}

// ── GET /api/admin/media — List media with filters ───────────────────────────
router.get("/", async (req, res) => {
  try {
    const {
      folder,
      search,
      sortBy   = "createdAt",
      sortDir  = "desc",
      page     = 1,
      limit    = 48,
    } = req.query;

    const query = { deletedAt: null };
    if (folder && folder !== "All") query.folder = folder;
    if (search) query.name = { $regex: search, $options: "i" };

    const sort       = { [sortBy]: sortDir === "asc" ? 1 : -1 };
    const skip       = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      MediaModel.find(query).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
      MediaModel.countDocuments(query),
    ]);

    return res.json({ items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/media/upload — Multi-file upload with allSettled ─────────
router.post("/upload", async (req, res) => {
  const { files, folder = "General" } = req.body || {};
  if (!files || !Array.isArray(files) || !files.length) {
    return res.status(400).json({ error: "No files provided" });
  }

  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;

  // Process all files with Promise.allSettled — partial failure never blocks
  const results = await Promise.allSettled(
    files.map(async (file, idx) => {
      const { name, data, type = "image/jpeg", size = "0" } = file;
      if (!name || !data) throw new Error(`File ${idx}: missing name or data`);
      if (!data.startsWith("data:")) throw new Error(`File ${idx}: invalid base64 format`);

      const hash = computeHash(data);

      // Duplicate detection (warning only — never blocks upload)
      let duplicateWarning = null;
      if (hash) {
        const existing = await MediaModel.findOne({ hash, deletedAt: null }).lean();
        if (existing) {
          duplicateWarning = {
            existingId:  existing.id,
            existingUrl: existing.url,
            existingName: existing.name,
          };
        }
      }

      let url = "";
      let cloudinaryPublicId = "";
      let storage = "local";

      // ── Try Cloudinary with retry ─────────────────────────────────────────
      if (hasCloudinary) {
        let attempts = 0;
        const maxRetries = 3;
        while (attempts < maxRetries) {
          try {
            const publicId = generatePublicId();
            const result   = await cloudinary.uploader.upload(data, {
              folder:          "journeyflicker",
              resource_type:   "image",
              public_id:       publicId,
              unique_filename: false,  // We control the ID
              use_filename:    false,
              overwrite:       false,
              invalidate:      true,
              transformation:  [{ quality: "auto", fetch_format: "auto" }],
            });
            url                = result.secure_url;
            cloudinaryPublicId = result.public_id;
            storage            = "cloudinary";
            break;
          } catch (uploadErr) {
            attempts++;
            if (attempts >= maxRetries) {
              console.warn(`[Media] Cloudinary upload failed after ${maxRetries} retries for ${name}:`, uploadErr.message);
              // Fall through to local
            } else {
              await new Promise(r => setTimeout(r, 500 * attempts));
            }
          }
        }
      }

      // ── Local fallback ────────────────────────────────────────────────────
      if (!url) {
        // Store via existing upload endpoint logic
        const uploadRes = await fetch(`http://localhost:${process.env.PORT || 5174}/api/upload`, {
          method: "POST",
          headers: { "content-type": "application/json", "Authorization": req.headers.authorization || "" },
          body: JSON.stringify({ name, data }),
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          url     = uploadData.url;
          storage = uploadData.storage || "local";
        } else {
          throw new Error(`Upload failed for ${name}`);
        }
      }

      const mediaItem = {
        id:                newId("media"),
        url,
        cloudinaryPublicId,
        name,
        size,
        sizeBytes:         parseInt(size) || 0,
        type,
        date:              new Date().toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
        folder,
        hash,
        usedIn:            [],
        deletedAt:         null,
        createdAt:         Date.now(),
      };

      await MediaModel.create(mediaItem);

      return { ...mediaItem, storage, duplicateWarning };
    })
  );

  // Summarize results
  const succeeded = results.filter(r => r.status === "fulfilled").map(r => r.value);
  const failed    = results
    .filter(r => r.status === "rejected")
    .map((r, i) => ({ index: i, error: r.reason?.message || "Unknown error" }));

  return res.json({
    success:   succeeded.length > 0,
    uploaded:  succeeded,
    failed,
    summary:   { total: files.length, succeeded: succeeded.length, failed: failed.length },
  });
});

// ── DELETE /api/admin/media/:id — Permanent delete ────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const item = await MediaModel.findOne({ id: req.params.id }).lean();
    if (item && item.url && item.url.includes("cloudinary.com")) {
      try {
        let publicId = item.cloudinaryPublicId;
        if (!publicId) {
          const parts = item.url.split("/upload/");
          if (parts.length > 1) {
            const afterUpload = parts[1].split("/").slice(1).join("/");
            publicId = afterUpload.split(".")[0];
          }
        }
        if (publicId) await cloudinary.uploader.destroy(publicId);
      } catch (e) { console.error("Cloudinary delete error:", e); }
    }
    await MediaModel.deleteOne({ id: req.params.id });
    return res.status(204).end();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/media/bulk-delete — Bulk delete ──────────────────────────
router.post("/bulk-delete", async (req, res) => {
  const { ids } = req.body || {};
  if (!ids || !Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ error: "No IDs provided" });
  }

  try {
    const items = await MediaModel.find({ id: { $in: ids } }).lean();
    for (const item of items) {
      if (item.url && item.url.includes("cloudinary.com")) {
        try {
          let publicId = item.cloudinaryPublicId;
          if (!publicId) {
            const parts = item.url.split("/upload/");
            if (parts.length > 1) {
              const afterUpload = parts[1].split("/").slice(1).join("/");
              publicId = afterUpload.split(".")[0];
            }
          }
          if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch (e) { console.error("Cloudinary delete error:", e); }
      }
    }
    await MediaModel.deleteMany({ id: { $in: ids } });
    return res.json({ success: true, count: ids.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── POST /api/admin/media/bulk-move — Move to different folder ────────────────
router.post("/bulk-move", async (req, res) => {
  const { ids, folder } = req.body || {};
  if (!ids?.length || !folder) return res.status(400).json({ error: "Missing ids or folder" });

  try {
    await MediaModel.updateMany({ id: { $in: ids } }, { $set: { folder } });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});



// ── GET /api/admin/media/unused — Detect unused media ────────────────────────
router.get("/unused/detect", async (req, res) => {
  try {

    const [allMedia, destinations, tours] = await Promise.all([
      MediaModel.find({ deletedAt: null }).lean(),
      Destination.find({}).lean(),
      Tour.find({}).lean(),
    ]);

    // Collect all URLs used in destinations and tours
    const usedUrls = new Set();

    for (const d of destinations) {
      if (d.heroImageUrl)  usedUrls.add(d.heroImageUrl);
      (d.galleryImages || []).forEach(u => usedUrls.add(u));
      (d.landmarks || []).forEach(l => l.imageUrl && usedUrls.add(l.imageUrl));
    }
    for (const t of tours) {
      if (t.heroImageUrl) usedUrls.add(t.heroImageUrl);
      (t.visualArchive || []).forEach(u => usedUrls.add(u));
      (t.itinerary || []).forEach(i => i.imageUrl && usedUrls.add(i.imageUrl));
      (t.sightseeing || []).forEach(s => s.imageUrl && usedUrls.add(s.imageUrl));
    }

    const unused = allMedia.filter(m => !usedUrls.has(m.url));
    return res.json({ items: unused, usedCount: allMedia.length - unused.length, unusedCount: unused.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /api/admin/media/cloudinary-sync — Sync from Cloudinary ──────────────
router.get("/cloudinary-sync", async (req, res) => {
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (!hasCloudinary) return res.status(400).json({ error: "Cloudinary not configured" });

  try {
    let allResources = [];
    let nextCursor   = null;

    do {
      const opts = { type: "upload", max_results: 100, folder: "journeyflicker" };
      if (nextCursor) opts.next_cursor = nextCursor;

      const result = await cloudinary.api.resources(opts);
      allResources = allResources.concat(result.resources);
      nextCursor   = result.next_cursor;
    } while (nextCursor);

    let addedCount = 0;
    for (const r of allResources) {
      const exists = await MediaModel.findOne({ cloudinaryPublicId: r.public_id }).lean();
      if (!exists) {
        await MediaModel.create({
          id: newId("media"),
          url: r.secure_url,
          cloudinaryPublicId: r.public_id,
          name: r.public_id.split('/').pop() || 'cloudinary-sync',
          size: (r.bytes / 1024 / 1024).toFixed(1) + ' MB',
          sizeBytes: r.bytes,
          type: r.format ? `image/${r.format}` : 'image/jpeg',
          date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
          folder: "Cloudinary",
          deletedAt: null,
          createdAt: new Date(r.created_at).getTime(),
        });
        addedCount++;
      }
    }

    return res.json({ count: addedCount, totalFound: allResources.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
