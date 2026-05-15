/**
 * JourneyFlicker — Image Optimizer
 * ─────────────────────────────────
 * Scans source image folders, resizes/crops to exact aspect ratios,
 * strips EXIF metadata, converts to WebP (and optionally AVIF),
 * and optionally generates thumbnail variants.
 *
 * Usage:  node optimize.js [options]
 *   --avif        Also output AVIF copies
 *   --thumbs      Also output thumbnail copies
 *   --thumb-size  Thumbnail longest edge (default 300)
 */

"use strict";

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ─── CLI FLAGS ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const ENABLE_AVIF = args.includes("--avif");
const ENABLE_THUMBS = args.includes("--thumbs");
const THUMB_SIZE = (() => {
  const idx = args.indexOf("--thumb-size");
  return idx !== -1 && args[idx + 1] ? parseInt(args[idx + 1], 10) : 300;
})();

// ─── SUPPORTED INPUT EXTENSIONS ──────────────────────────────────────────────
// All formats Sharp (libvips) can decode as input.
// Add any new format here — the pipeline handles the rest automatically.
const SUPPORTED_EXTENSIONS = new Set([
  // ── JPEG variants (WhatsApp, cameras, scanners all use these) ───────────────
  ".jpg",
  ".jpeg",
  ".jfif",   // JPEG File Interchange Format — WhatsApp saves these
  ".jpe",    // Legacy JPEG extension
  ".jif",    // JPEG Interchange Format
  ".jfi",    // Short JFIF alias

  // ── PNG & lossless ──────────────────────────────────────────────────────────
  ".png",
  ".bmp",
  ".tiff",
  ".tif",

  // ── Modern / next-gen ───────────────────────────────────────────────────────
  ".webp",
  ".avif",
  ".heic",   // iPhone HEIC
  ".heif",   // Generic HEIF container

  // ── Other Sharp-supported inputs ────────────────────────────────────────────
  ".gif",    // First frame only — useful for animated cover stills
  ".svg",    // Sharp rasterises SVGs at native size before resizing
  ".pgm",    // Portable Graymap
  ".ppm",    // Portable Pixmap (some scanners)
  ".pbm",    // Portable Bitmap
]);

// ─── PIPELINE CONFIGURATION ───────────────────────────────────────────────────
// Base paths are relative to this script file's location (tools/image-optimizer/).
// Adjust ROOT if you move this script.
const ROOT = path.resolve(__dirname, "../../frontend/public");

/**
 * @typedef {Object} PipelineConfig
 * @property {string}   src         - Source folder (relative to ROOT)
 * @property {string}   dest        - Output folder (relative to ROOT)
 * @property {number}   width       - Target width in pixels
 * @property {number}   height      - Target height in pixels
 * @property {number}   quality     - WebP quality (1–100)
 * @property {string}   label       - Human-readable label for logs
 */

/** @type {PipelineConfig[]} */
const PIPELINES = [
  // ── Hero & Sliders ──────────────────────────────────────────────────────────
  {
    src: "images/hero",
    dest: "optimized/hero",
    width: 1920,
    height: 1080,
    quality: 82,
    label: "Hero Banners — all pages (16:9 · 1920×1080)",
  },
  {
    src: "images/sightseeing",
    dest: "optimized/sightseeing",
    width: 1280,
    height: 720,
    quality: 82,
    label: "Sightseeing Slider (16:9 · 1280×720)",
  },

  // ── Card Grids (portrait) ───────────────────────────────────────────────────
  {
    src: "images/destinations",
    dest: "optimized/destinations",
    width: 800,
    height: 1000,
    quality: 78,
    label: "Destination Cards — home carousel & grid (4:5 · 800×1000)",
  },
  {
    src: "images/tours",
    dest: "optimized/tours",
    width: 800,
    height: 1000,
    quality: 78,
    label: "Tour Cards — grid view (4:5 · 800×1000)",
  },
  {
    src: "images/visa",
    dest: "optimized/visa",
    width: 800,
    height: 1000,
    quality: 78,
    label: "Visa Cards — home carousel (4:5 · 800×1000)",
  },

  // ── Detail / Overview ───────────────────────────────────────────────────────
  {
    src: "images/overview",
    dest: "optimized/overview",
    width: 600,
    height: 800,
    quality: 78,
    label: "Tour/Dest Detail Overview Image (3:4 · 600×800)",
  },

  // ── Landscape Cards & Carousels ─────────────────────────────────────────────
  {
    src: "images/tour-thumbs",
    dest: "optimized/tour-thumbs",
    width: 800,
    height: 600,
    quality: 78,
    label: "Tour List Thumbnail — mobile (4:3 · 800×600)",
  },
  {
    src: "images/signature",
    dest: "optimized/signature",
    width: 1200,
    height: 900,
    quality: 80,
    label: "Signature Expeditions Carousel (4:3 · 1200×900)",
  },
  {
    src: "images/landmarks",
    dest: "optimized/landmarks",
    width: 800,
    height: 600,
    quality: 78,
    label: "Dest/Tour Landmarks Section (4:3 · 800×600)",
  },

  // ── Gallery & Long Banners ──────────────────────────────────────────────────
  {
    src: "images/gallery",
    dest: "optimized/gallery",
    width: 800,
    height: 800,
    quality: 75,
    label: "Visual Archive Gallery (1:1 · 800×800)",
  },
  {
    src: "images/itinerary",
    dest: "optimized/itinerary",
    width: 1600,
    height: 700,
    quality: 82,
    label: "Itinerary Day Banners (16:7 · 1600×700)",
  },
];

// ─── LOGGER ───────────────────────────────────────────────────────────────────
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  success: (msg) =>
    console.log(`${colors.green}✔${colors.reset}  ${msg}`),
  skip: (msg) =>
    console.log(`${colors.yellow}⚠${colors.reset}  ${colors.dim}${msg}${colors.reset}`),
  error: (msg) =>
    console.error(`${colors.red}✖${colors.reset}  ${colors.red}${msg}${colors.reset}`),
  section: (msg) =>
    console.log(
      `\n${colors.bright}${colors.magenta}▶  ${msg}${colors.reset}\n${"─".repeat(60)}`
    ),
  summary: (msg) =>
    console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/**
 * Ensure a directory exists, creating it (and parents) if necessary.
 * @param {string} dirPath
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log.info(`Created directory: ${path.relative(ROOT, dirPath)}`);
  }
}

/**
 * Return the file size in KB as a formatted string.
 * @param {string} filePath
 * @returns {string}
 */
function fileSizeKB(filePath) {
  try {
    const bytes = fs.statSync(filePath).size;
    return `${(bytes / 1024).toFixed(1)} KB`;
  } catch {
    return "? KB";
  }
}

/**
 * Derive the stem (filename without extension).
 * @param {string} file - Filename with extension
 * @returns {string}
 */
function stem(file) {
  return path.basename(file, path.extname(file));
}

// ─── CORE: PROCESS A SINGLE IMAGE ────────────────────────────────────────────

/**
 * Process one source image through a given pipeline config.
 *
 * @param {string}         srcFile  - Absolute path to the source image
 * @param {PipelineConfig} config   - Pipeline configuration
 * @returns {Promise<{ok: boolean, skipped?: boolean, file?: string, error?: string}>}
 */
async function processImage(srcFile, config) {
  const ext = path.extname(srcFile).toLowerCase();

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    return { ok: false, skipped: true, file: path.basename(srcFile) };
  }

  const baseName = stem(srcFile);
  const destDir = path.join(ROOT, config.dest);
  const thumbDir = path.join(ROOT, config.dest, "thumbs");

  ensureDir(destDir);
  if (ENABLE_THUMBS) ensureDir(thumbDir);

  // ── Build base Sharp pipeline (EXIF stripped by default) ──────────────────
  const sharpBase = () =>
    sharp(srcFile, { failOnError: false })
      .rotate()                       // auto-orient via EXIF before stripping
      .withMetadata({ exif: {} })     // strip all EXIF (pass empty exif object)
      .resize({
        width: config.width,
        height: config.height,
        fit: "cover",                 // crop to exact dimensions
        position: "attention",        // smart crop: keeps focal point
      });

  try {
    // ── WebP output ──────────────────────────────────────────────────────────
    const webpDest = path.join(destDir, `${baseName}.webp`);
    await sharpBase()
      .webp({ quality: config.quality, effort: 5 })
      .toFile(webpDest);

    const origSize = fileSizeKB(srcFile);
    const newSize = fileSizeKB(webpDest);

    log.success(
      `[WebP]  ${baseName}.webp  (${origSize} → ${newSize})`
    );

    // ── AVIF output (optional) ───────────────────────────────────────────────
    if (ENABLE_AVIF) {
      const avifDest = path.join(destDir, `${baseName}.avif`);
      await sharpBase()
        .avif({ quality: Math.max(config.quality - 5, 50), effort: 4 })
        .toFile(avifDest);
      log.success(
        `[AVIF]  ${baseName}.avif  (${fileSizeKB(avifDest)})`
      );
    }

    // ── Thumbnail output (optional) ──────────────────────────────────────────
    if (ENABLE_THUMBS) {
      const thumbDest = path.join(thumbDir, `${baseName}-thumb.webp`);
      await sharp(srcFile, { failOnError: false })
        .rotate()
        .withMetadata({ exif: {} })
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover", position: "attention" })
        .webp({ quality: 70, effort: 4 })
        .toFile(thumbDest);
      log.success(
        `[THUMB] ${baseName}-thumb.webp  (${fileSizeKB(thumbDest)})`
      );
    }

    return { ok: true, file: `${baseName}.webp` };
  } catch (err) {
    return { ok: false, error: `${path.basename(srcFile)}: ${err.message}` };
  }
}

// ─── CORE: PROCESS A PIPELINE ────────────────────────────────────────────────

/**
 * Run all images in a single pipeline configuration.
 * @param {PipelineConfig} config
 * @returns {Promise<{processed: number, skipped: number, errors: number}>}
 */
async function runPipeline(config) {
  const srcDir = path.join(ROOT, config.src);
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  log.section(`${config.label}  →  ${config.dest}`);

  if (!fs.existsSync(srcDir)) {
    log.skip(`Source folder not found, skipping: ${config.src}`);
    return { processed, skipped, errors };
  }

  const files = fs.readdirSync(srcDir).filter((f) => {
    const fullPath = path.join(srcDir, f);
    return fs.statSync(fullPath).isFile();
  });

  if (files.length === 0) {
    log.skip(`No files found in: ${config.src}`);
    return { processed, skipped, errors };
  }

  log.info(`Found ${files.length} file(s) in /${config.src}`);

  // Process sequentially to avoid memory spikes on large batches.
  // For parallelism, swap to Promise.allSettled(files.map(...)).
  for (const file of files) {
    const srcFile = path.join(srcDir, file);
    const result = await processImage(srcFile, config);

    if (result.skipped) {
      log.skip(`Skipped unsupported file: ${result.file}`);
      skipped++;
    } else if (result.ok) {
      processed++;
    } else {
      log.error(`Error processing: ${result.error}`);
      errors++;
    }
  }

  return { processed, skipped, errors };
}

// ─── ENTRY POINT ─────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();

  console.log(
    `\n${colors.bright}${colors.cyan}╔══════════════════════════════════════════════╗
║  JourneyFlicker — Image Optimizer v1.0.0    ║
╚══════════════════════════════════════════════╝${colors.reset}`
  );

  log.info(`Root path  : ${ROOT}`);
  log.info(`AVIF mode  : ${ENABLE_AVIF ? "enabled" : "disabled"}`);
  log.info(`Thumbnails : ${ENABLE_THUMBS ? `enabled (${THUMB_SIZE}px)` : "disabled"}`);

  const totals = { processed: 0, skipped: 0, errors: 0 };

  for (const pipeline of PIPELINES) {
    const result = await runPipeline(pipeline);
    totals.processed += result.processed;
    totals.skipped += result.skipped;
    totals.errors += result.errors;
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n${"═".repeat(60)}`);
  log.summary(`  Optimization complete in ${elapsed}s`);
  log.summary(`  ✔  Processed : ${totals.processed} image(s)`);
  log.summary(`  ⚠  Skipped   : ${totals.skipped} file(s)`);
  if (totals.errors > 0) {
    log.error(`  ✖  Errors    : ${totals.errors} file(s) — check logs above`);
  }
  console.log(`${"═".repeat(60)}\n`);

  if (totals.errors > 0) process.exit(1);
}

main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  process.exitCode = 1;
});
