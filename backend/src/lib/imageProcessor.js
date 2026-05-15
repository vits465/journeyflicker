/**
 * imageProcessor.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automatic image optimization middleware for JourneyFlicker admin uploads.
 *
 * Usage:
 *   import { processImageForSection } from "./imageProcessor.js";
 *   const optimized = await processImageForSection(base64DataUri, sectionKey);
 *   // returns a new base64 data URI (image/webp) ready to upload to Cloudinary
 *
 * Section keys (pass the `section` field from the upload request body):
 *   "hero"         → 1920×1080  16:9  q82
 *   "sightseeing"  → 1280×720   16:9  q82
 *   "destinations" → 800×1000   4:5   q78
 *   "tours"        → 800×1000   4:5   q78
 *   "visa"         → 800×1000   4:5   q78
 *   "overview"     → 600×800    3:4   q78
 *   "tour-thumbs"  → 800×600    4:3   q78
 *   "signature"    → 1200×900   4:3   q80
 *   "landmarks"    → 800×600    4:3   q78
 *   "gallery"      → 800×800    1:1   q75
 *   "itinerary"    → 1600×700   16:7  q82
 *
 * If no matching section is found the original image is returned unchanged.
 */

import sharp from "sharp";

// ─── SECTION → SPEC MAP ───────────────────────────────────────────────────────
// Mirrors the exact CSS aspect ratios used on the frontend.
// Key   = value passed in req.body.section (case-insensitive)
// width / height = target crop dimensions in pixels
// quality = WebP quality (1–100)

const SECTION_SPECS = {
  // Hero & Sliders
  hero:         { width: 1920, height: 1080, quality: 82 },
  sightseeing:  { width: 1280, height: 720,  quality: 82 },

  // Portrait card grids — aspect-[4/5]
  destinations: { width: 800,  height: 1000, quality: 78 },
  tours:        { width: 800,  height: 1000, quality: 78 },
  visa:         { width: 800,  height: 1000, quality: 78 },

  // Portrait detail overview — aspect-[3/4]
  overview:     { width: 600,  height: 800,  quality: 78 },

  // Landscape cards & carousels — aspect-[4/3]
  "tour-thumbs": { width: 800,  height: 600,  quality: 78 },
  signature:    { width: 1200, height: 900,  quality: 80 },
  landmarks:    { width: 800,  height: 600,  quality: 78 },

  // Gallery — aspect-square
  gallery:      { width: 800,  height: 800,  quality: 75 },

  // Itinerary banners — aspect-[16/7]
  itinerary:    { width: 1600, height: 700,  quality: 82 },
};

// ─── CORE PROCESSOR ──────────────────────────────────────────────────────────

/**
 * Process a base64 image data URI for a specific admin section.
 *
 * - Detects section spec from sectionKey
 * - Auto-orients (fixes rotated phone photos)
 * - Smart-crops to exact dimensions (keeps focal point, never stretches)
 * - Strips all EXIF metadata (privacy + smaller file)
 * - Converts to WebP
 *
 * @param {string} base64DataUri  — Original image as "data:<mime>;base64,<data>"
 * @param {string} sectionKey     — Section identifier (e.g. "hero", "tours")
 * @returns {Promise<{ dataUri: string, originalBytes: number, optimizedBytes: number, spec: object|null, skipped: boolean }>}
 */
export async function processImageForSection(base64DataUri, sectionKey) {
  const key  = (sectionKey || "").toLowerCase().trim();
  const spec = SECTION_SPECS[key] ?? null;

  // ── Decode base64 to buffer ─────────────────────────────────────────────────
  const rawBase64  = base64DataUri.replace(/^data:[^;]+;base64,/, "");
  const inputBuf   = Buffer.from(rawBase64, "base64");
  const originalBytes = inputBuf.byteLength;

  // ── No matching section — return original unchanged ─────────────────────────
  if (!spec) {
    console.log(`[ImageProcessor] No spec for section "${key}" — skipping optimization`);
    return {
      dataUri:        base64DataUri,
      originalBytes,
      optimizedBytes: originalBytes,
      spec:           null,
      skipped:        true,
    };
  }

  try {
    // ── Run Sharp pipeline ──────────────────────────────────────────────────
    const outputBuf = await sharp(inputBuf, { failOnError: false })
      .rotate()                       // auto-orient from EXIF before stripping
      .withMetadata({ exif: {} })     // strip all EXIF (privacy + size)
      .resize({
        width:    spec.width,
        height:   spec.height,
        fit:      "cover",            // crop — never stretches
        position: "attention",        // smart focal-point crop (faces, subjects)
      })
      .webp({ quality: spec.quality, effort: 5 })
      .toBuffer();

    const optimizedBytes = outputBuf.byteLength;
    const dataUri = `data:image/webp;base64,${outputBuf.toString("base64")}`;

    const savedPct = (((originalBytes - optimizedBytes) / originalBytes) * 100).toFixed(1);
    console.log(
      `[ImageProcessor] "${key}" → ${spec.width}×${spec.height} WebP q${spec.quality} | ` +
      `${(originalBytes / 1024).toFixed(1)} KB → ${(optimizedBytes / 1024).toFixed(1)} KB (${savedPct > 0 ? "-" : "+"}${Math.abs(savedPct)}%)`
    );

    return { dataUri, originalBytes, optimizedBytes, spec, skipped: false };

  } catch (err) {
    // On any Sharp error fall back to the original — never block the upload
    console.error(`[ImageProcessor] Sharp failed for section "${key}": ${err.message} — using original`);
    return {
      dataUri:        base64DataUri,
      originalBytes,
      optimizedBytes: originalBytes,
      spec,
      skipped:        true,
      error:          err.message,
    };
  }
}

/**
 * List all known sections and their specs — useful for API documentation.
 * @returns {Object}
 */
export function getSectionSpecs() {
  return { ...SECTION_SPECS };
}
