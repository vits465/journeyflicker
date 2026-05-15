# JourneyFlicker — Image Optimizer

A production-grade image optimization pipeline for the JourneyFlicker travel website.  
Built on **Sharp.js** — the fastest Node.js image processing library.

---

## Features

| Feature | Detail |
|---|---|
| 🔄 Resize & crop | Exact aspect ratios per content type, smart focal-point cropping |
| 🖼️ WebP output | All images converted to WebP |
| 🆕 AVIF (optional) | Pass `--avif` flag for next-gen format |
| 🖼️ Thumbnails (optional) | Pass `--thumbs` for lightweight thumbnail copies |
| 🔒 EXIF stripped | Personal/GPS metadata removed automatically |
| 📂 Auto folder creation | Output directories created on first run |
| 🎨 Smart quality | Per-pipeline quality tuning |
| 📋 Detailed logs | Coloured console output with file sizes before→after |

---

## Folder Structure

```
journeyflicker/
├── tools/
│   └── image-optimizer/
│       ├── optimize.js        ← Main script
│       ├── package.json
│       └── README.md
│
└── frontend/
    └── public/
        ├── images/            ← DROP YOUR SOURCE IMAGES HERE
        │   ├── hero/              16:9  — 1920×1080
        │   ├── sightseeing/       16:9  — 1280×720
        │   ├── destinations/      4:5   — 800×1000
        │   ├── tours/             4:5   — 800×1000
        │   ├── visa/              4:5   — 800×1000
        │   ├── overview/          3:4   — 600×800  (portrait)
        │   ├── tour-thumbs/       4:3   — 800×600  (mobile list)
        │   ├── signature/         4:3   — 1200×900
        │   ├── landmarks/         4:3   — 800×600
        │   ├── gallery/           1:1   — 800×800
        │   └── itinerary/         16:7  — 1600×700
        │
        └── optimized/         ← GENERATED OUTPUT (auto-created)
            ├── hero/
            ├── sightseeing/
            ├── destinations/
            ├── tours/
            ├── visa/
            ├── overview/
            ├── tour-thumbs/
            ├── signature/
            ├── landmarks/
            ├── gallery/
            └── itinerary/
```

---

## Aspect Ratio Reference — Matched to Website CSS

| Site Section | CSS Class | Folder | Dimensions | Ratio | Quality |
|---|---|---|---|---|---|
| Hero Slider (all pages) | `h-screen / object-cover` | `hero/` | 1920 × 1080 | 16:9 | 82 |
| Sightseeing main slider | `aspect-[16/9]` | `sightseeing/` | 1280 × 720 | 16:9 | 82 |
| Destination cards | `aspect-[4/5]` | `destinations/` | 800 × 1000 | 4:5 | 78 |
| Tour cards (grid) | `aspect-[4/5]` | `tours/` | 800 × 1000 | 4:5 | 78 |
| Visa cards | `aspect-[4/5]` | `visa/` | 800 × 1000 | 4:5 | 78 |
| Tour/Dest detail overview | `aspect-[3/4]` | `overview/` | 600 × 800 | 3:4 | 78 |
| Tour list thumbnail (mobile) | `aspect-[4/3]` | `tour-thumbs/` | 800 × 600 | 4:3 | 78 |
| Signature Expeditions carousel | `aspect-[4/3]` | `signature/` | 1200 × 900 | 4:3 | 80 |
| Dest/Tour landmarks section | `aspect-[4/3]` | `landmarks/` | 800 × 600 | 4:3 | 78 |
| Visual archive gallery | `aspect-square` | `gallery/` | 800 × 800 | 1:1 | 75 |
| Itinerary day image | `aspect-[16/7]` | `itinerary/` | 1600 × 700 | 16:7 | 82 |

---

## Installation

```bash
# 1 — Navigate to this tool directory
cd tools/image-optimizer

# 2 — Install dependencies
npm install
```

> **Node.js ≥ 18** required. Sharp bundles its own native libvips — no extra system libs needed.

---

## Usage

```bash
# Standard WebP optimization (recommended for most runs)
npm run optimize

# Also generate AVIF copies (bonus next-gen format)
npm run optimize:avif

# Also generate 300px thumbnails
npm run optimize:thumbs

# Full run: WebP + AVIF + thumbnails (300px)
npm run optimize:full

# Full run with larger thumbnails (500px)
npm run optimize:full:lg-thumbs
```

### Running Directly with Node

```bash
node optimize.js
node optimize.js --avif
node optimize.js --thumbs --thumb-size 400
node optimize.js --avif --thumbs --thumb-size 300
```

---

## CLI Flags

| Flag | Default | Description |
|---|---|---|
| `--avif` | off | Generate `.avif` copies alongside `.webp` |
| `--thumbs` | off | Generate thumbnail copies in `thumbs/` sub-folder |
| `--thumb-size <px>` | `300` | Longest edge of thumbnail in pixels |

---

## Supported Input Formats

`.jpg` · `.jpeg` · `.png` · `.gif` · `.tiff` · `.tif` · `.bmp` · `.webp` · `.avif` · `.heic` · `.heif`

All other files are **skipped** with a console warning.

---

## Output Structure (with all flags enabled)

```
optimized/
└── hero/
    ├── banner-maldives.webp       ← Full-size WebP
    ├── banner-maldives.avif       ← AVIF copy (--avif)
    └── thumbs/
        └── banner-maldives-thumb.webp   ← Thumbnail (--thumbs)
```

---

## Using Optimized Images in React

```tsx
// Standard WebP
<img src="/optimized/hero/banner.webp" alt="Hero" />

// Progressive enhancement with AVIF fallback
<picture>
  <source srcSet="/optimized/hero/banner.avif" type="image/avif" />
  <source srcSet="/optimized/hero/banner.webp" type="image/webp" />
  <img src="/optimized/hero/banner.jpg" alt="Hero" loading="lazy" />
</picture>
```

---

## Adding to Root package.json (optional shortcut)

Add this to your root `package.json` scripts to run the optimizer from anywhere in the project:

```json
{
  "scripts": {
    "images": "cd tools/image-optimizer && npm run optimize",
    "images:full": "cd tools/image-optimizer && npm run optimize:full"
  }
}
```

---

## Notes

- **EXIF data** is stripped from all output images (privacy & size).  
- **Auto-rotation** is applied before stripping so portrait shots stay upright.  
- **Smart cropping** uses Sharp's `attention` strategy — it detects faces and salient regions.  
- Images are processed **sequentially** to avoid memory spikes on large batches. For parallelism on powerful machines, see the comment in `optimize.js → runPipeline`.
