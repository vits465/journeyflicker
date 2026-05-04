/**
 * import-export.js — Bulk import and export system
 * Supports: JSON, CSV export; JSON, CSV, XLSX import
 * Features: preview, duplicate detection, validation, batch processing
 */
import express from "express";
import crypto from "node:crypto";
import { isMongoConnected } from "../db/mongoose.js";
import { Destination, Tour, Visa, Contact, Media } from "../db/models/index.js";
import { parse as csvParse } from "fast-csv";
import { read as xlsxRead, utils as xlsxUtils } from "xlsx";
import { Readable } from "node:stream";

export const router = express.Router();

function newId(prefix = "imp") {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
}

// ── EXPORT ────────────────────────────────────────────────────────────────────

/** GET /api/admin/export/:type — Export data as JSON */
router.get("/:type", async (req, res) => {
  const { type } = req.params;
  const format = (req.query.format || "json").toLowerCase();
  const validTypes = ["destinations", "tours", "visas", "contacts", "media", "all"];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Valid: ${validTypes.join(", ")}` });
  }

  try {
    let data = {};

    if (type === "all" || type === "destinations") {
      data.destinations = await Destination.find({}).lean();
    }
    if (type === "all" || type === "tours") {
      data.tours = await Tour.find({}).lean();
    }
    if (type === "all" || type === "visas") {
      data.visas = await Visa.find({}).lean();
    }
    if (type === "all" || type === "contacts") {
      data.contacts = await Contact.find({}).lean();
    }
    if (type === "all" || type === "media") {
      data.media = await Media.find({}).lean();
    }

    // Single type: return array directly
    const exportData = type === "all" ? data : data[type];
    const filename   = `jf_export_${type}_${new Date().toISOString().slice(0, 10)}`;

    if (format === "csv" && type !== "all") {
      // Flatten for CSV export
      const items = Array.isArray(exportData) ? exportData : [];
      if (!items.length) return res.status(404).json({ error: "No data to export" });

      const keys = Object.keys(items[0]);
      const rows = [
        keys.join(","),
        ...items.map(item =>
          keys.map(k => {
            const v = item[k];
            if (v === null || v === undefined) return "";
            if (typeof v === "object") return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
            return `"${String(v).replace(/"/g, '""')}"`;
          }).join(",")
        ),
      ];

      res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(rows.join("\n"));
    }

    // JSON export (default)
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.json"`);
    res.setHeader("Content-Type", "application/json");
    return res.json({
      metadata: {
        exportedAt:  new Date().toISOString(),
        type,
        count:       Array.isArray(exportData) ? exportData.length : undefined,
      },
      data: exportData,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ── IMPORT ────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/import — Import data
 * Body: { type, format, data (base64 for CSV/XLSX), preview (bool), allowDuplicates (bool) }
 */
router.post("/", async (req, res) => {
  const {
    type,
    format = "json",
    data: rawData,
    preview = false,
    allowDuplicates = false,
    skipErrors = true,
  } = req.body || {};

  const validTypes   = ["destinations", "tours", "visas", "contacts", "media"];
  const validFormats = ["json", "csv", "xlsx"];

  if (!validTypes.includes(type))   return res.status(400).json({ error: `Invalid type: ${type}` });
  if (!validFormats.includes(format)) return res.status(400).json({ error: `Invalid format: ${format}` });
  if (!rawData)                     return res.status(400).json({ error: "Missing data" });

  try {
    let items = [];

    // ── Parse input ──────────────────────────────────────────────────────────
    if (format === "json") {
      const parsed = typeof rawData === "string" ? JSON.parse(rawData) : rawData;
      items = Array.isArray(parsed) ? parsed : (parsed.data || parsed.destinations || parsed.tours || parsed.visas || parsed.contacts || parsed.media || []);
    } else if (format === "csv") {
      items = await parseCsv(rawData);
    } else if (format === "xlsx") {
      items = parseXlsx(rawData);
    }

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "No valid records found in input" });
    }

    // ── Validate & detect duplicates ─────────────────────────────────────────
    const results = { total: items.length, valid: 0, duplicates: 0, errors: [] };
    const processedItems = [];

    // Get existing IDs/names for duplicate detection
    let existingIds   = new Set();
    let existingNames = new Set();

    const ModelMap = { destinations: Destination, tours: Tour, visas: Visa, contacts: Contact, media: Media };
    const Model = ModelMap[type];
    if (Model) {
      const existing = await Model.find({}).select("id name country email url").lean();
      existing.forEach(e => {
        if (e.id)      existingIds.add(e.id);
        if (e.name)    existingNames.add(e.name.toLowerCase());
        if (e.country) existingNames.add(e.country.toLowerCase());
        if (e.email)   existingNames.add(e.email.toLowerCase());
      });
    }

    for (const item of items) {
      try {
        // Check duplicate by ID
        const isDupById   = item.id && existingIds.has(item.id);
        const itemKey     = (item.name || item.country || item.email || "").toLowerCase();
        const isDupByName = itemKey && existingNames.has(itemKey);

        if ((isDupById || isDupByName) && !allowDuplicates) {
          results.duplicates++;
          results.errors.push({
            item: item.id || itemKey,
            error: `Duplicate detected: ${isDupById ? "ID" : "name/key"} already exists`,
          });
          continue;
        }

        // Assign new ID if missing or duplicate
        const newItem = {
          ...item,
          id: (isDupById || !item.id) ? newId(type.slice(0, 4)) : item.id,
          createdAt: item.createdAt || Date.now(),
        };

        processedItems.push(newItem);
        results.valid++;
      } catch (itemErr) {
        results.errors.push({ item: item.id || "unknown", error: itemErr.message });
        if (!skipErrors) break;
      }
    }

    // Preview mode — return what would be imported
    if (preview) {
      return res.json({
        preview: true,
        results,
        sample: processedItems.slice(0, 5),
      });
    }

    // ── Commit import ────────────────────────────────────────────────────────
    if (!processedItems.length) {
      return res.status(400).json({ error: "No valid records to import after filtering", results });
    }

    if (!Model) return res.status(400).json({ error: `Unknown type: ${type}` });

    // Batch insert with upsert
    const ops = processedItems.map(item => ({
      updateOne: {
        filter:  { id: item.id },
        update:  { $set: item },
        upsert:  true,
      },
    }));

    const bulkResult = await Model.bulkWrite(ops, { ordered: false });
    results.inserted = bulkResult.upsertedCount;
    results.updated  = bulkResult.modifiedCount;

    return res.json({ success: true, results });
  } catch (err) {
    console.error("[Import] Failed:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ── Parsers ───────────────────────────────────────────────────────────────────

function parseCsv(base64OrString) {
  return new Promise((resolve, reject) => {
    let csvStr;
    try {
      csvStr = Buffer.from(base64OrString, "base64").toString("utf-8");
    } catch {
      csvStr = base64OrString;
    }

    const rows = [];
    const stream = Readable.from([csvStr]);
    stream
      .pipe(csvParse({ headers: true, ignoreEmpty: true, trim: true }))
      .on("data", row => rows.push(row))
      .on("end",  ()  => resolve(rows))
      .on("error", reject);
  });
}

function parseXlsx(base64) {
  const buf  = Buffer.from(base64, "base64");
  const wb   = xlsxRead(buf, { type: "buffer" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return xlsxUtils.sheet_to_json(ws, { defval: "" });
}
