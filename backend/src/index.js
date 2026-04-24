import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const PUBLIC_UPLOADS = path.join(__dirname, "..", "public", "uploads");
app.use("/uploads", express.static(PUBLIC_UPLOADS));

const DB_PATH = path.join(__dirname, "..", "data", "db.json");

async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e && typeof e === "object" && "code" in e && e.code === "ENOENT") {
      return { destinations: [], tours: [], visas: [] };
    }
    throw e;
  }
}

async function writeDb(next) {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(next, null, 2), "utf8");
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

const DestinationSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  description: z.string().optional().default(""),
  heroImageUrl: z.string().optional().default(""),
  essenceText: z.string().optional().default(""),
  landmarks: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      description: z.string(),
      imageUrl: z.string()
    })
  ).optional().default([]),
  bestSeasonsTitle: z.string().optional().default(""),
  bestSeasonsMonths: z.string().optional().default(""),
  seasonsHighlights: z.array(
    z.object({
      season: z.string(),
      description: z.string()
    })
  ).optional().default([]),
  galleryImages: z.array(z.string()).optional().default([]),
});

const TourSchema = z.object({
  name: z.string().min(1),
  region: z.string().min(1),
  days: z.number().int().positive(),
  price: z.string().min(1),
  category: z.string().min(1),
  rating: z.number().min(0).max(5).optional().default(0),
  heroImageUrl: z.string().optional().default(""),
  overviewDescription: z.string().optional().default(""),
  overviewExtended: z.string().optional().default(""),
  transport: z.string().optional().default(""),
  guide: z.string().optional().default(""),
  pickup: z.string().optional().default(""),
  itinerary: z.array(
    z.object({
      title: z.string(),
      description: z.string()
    })
  ).optional().default([]),
  sightseeing: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      icon: z.string()
    })
  ).optional().default([]),
  visualArchive: z.array(z.string()).optional().default([]),
  testimonials: z.array(
    z.object({
      quote: z.string(),
      author: z.string()
    })
  ).optional().default([]),
  departureWindows: z.array(z.string()).optional().default([]),
  maxGuests: z.number().optional().default(8),
});

const VisaSchema = z.object({
  country: z.string().min(1),
  processing: z.string().min(1),
  difficulty: z.string().min(1),
  fee: z.string().min(1),
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.post("/api/upload", async (req, res) => {
  const { name, data } = req.body;
  if (!name || !data) return res.status(400).json({ error: "Missing name or data base64" });

  const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return res.status(400).json({ error: "Invalid base64 format" });
  }

  const buffer = Buffer.from(matches[2], "base64");
  await fs.mkdir(PUBLIC_UPLOADS, { recursive: true });

  const ext = path.extname(name) || ".png";
  const safeName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
  const filePath = path.join(PUBLIC_UPLOADS, safeName);

  await fs.writeFile(filePath, buffer);
  res.json({ url: `http://localhost:4000/uploads/${safeName}` });
});

app.get("/api/destinations", async (_req, res) => {
  const db = await readDb();
  res.json(db.destinations);
});

app.get("/api/destinations/:id", async (req, res) => {
  const db = await readDb();
  const found = db.destinations.find((d) => d.id === req.params.id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});

app.post("/api/destinations", async (req, res) => {
  const parsed = DestinationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("dest"), ...parsed.data, createdAt: Date.now() };
  db.destinations.unshift(item);
  await writeDb(db);
  res.status(201).json(item);
});

app.put("/api/destinations/:id", async (req, res) => {
  const parsed = DestinationSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.destinations.findIndex((d) => d.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.destinations[idx] = { ...db.destinations[idx], ...parsed.data };
  await writeDb(db);
  res.json(db.destinations[idx]);
});

app.delete("/api/destinations/:id", async (req, res) => {
  const db = await readDb();
  const before = db.destinations.length;
  db.destinations = db.destinations.filter((d) => d.id !== req.params.id);
  if (db.destinations.length === before)
    return res.status(404).json({ message: "Not found" });
  await writeDb(db);
  res.status(204).end();
});

app.get("/api/tours", async (_req, res) => {
  const db = await readDb();
  res.json(db.tours);
});

app.get("/api/tours/:id", async (req, res) => {
  const db = await readDb();
  const found = db.tours.find((t) => t.id === req.params.id);
  if (!found) return res.status(404).json({ message: "Not found" });
  res.json(found);
});

app.post("/api/tours", async (req, res) => {
  const parsed = TourSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("tour"), ...parsed.data, createdAt: Date.now() };
  db.tours.unshift(item);
  await writeDb(db);
  res.status(201).json(item);
});

app.put("/api/tours/:id", async (req, res) => {
  const parsed = TourSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.tours.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.tours[idx] = { ...db.tours[idx], ...parsed.data };
  await writeDb(db);
  res.json(db.tours[idx]);
});

app.delete("/api/tours/:id", async (req, res) => {
  const db = await readDb();
  const before = db.tours.length;
  db.tours = db.tours.filter((t) => t.id !== req.params.id);
  if (db.tours.length === before)
    return res.status(404).json({ message: "Not found" });
  await writeDb(db);
  res.status(204).end();
});

app.get("/api/visas", async (_req, res) => {
  const db = await readDb();
  res.json(db.visas);
});

app.post("/api/visas", async (req, res) => {
  const parsed = VisaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const item = { id: newId("visa"), ...parsed.data, createdAt: Date.now() };
  db.visas.unshift(item);
  await writeDb(db);
  res.status(201).json(item);
});

app.put("/api/visas/:id", async (req, res) => {
  const parsed = VisaSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  const idx = db.visas.findIndex((v) => v.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.visas[idx] = { ...db.visas[idx], ...parsed.data };
  await writeDb(db);
  res.json(db.visas[idx]);
});

app.delete("/api/visas/:id", async (req, res) => {
  const db = await readDb();
  const before = db.visas.length;
  db.visas = db.visas.filter((v) => v.id !== req.params.id);
  if (db.visas.length === before)
    return res.status(404).json({ message: "Not found" });
  await writeDb(db);
  res.status(204).end();
});

// ── CONTACTS ────────────────────────────────────────────────────────────────

const ContactSchema = z.object({
  name:    z.string().min(1),
  email:   z.string().email(),
  type:    z.string().optional().default("General Inquiry"),
  message: z.string().optional().default(""),
});

app.get("/api/contacts", async (_req, res) => {
  const db = await readDb();
  res.json(db.contacts || []);
});

app.post("/api/contacts", async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  const item = { id: newId("msg"), ...parsed.data, read: false, createdAt: Date.now() };
  db.contacts.unshift(item);
  await writeDb(db);
  res.status(201).json(item);
});

app.patch("/api/contacts/:id/read", async (req, res) => {
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  const idx = db.contacts.findIndex((c) => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ message: "Not found" });
  db.contacts[idx].read = true;
  await writeDb(db);
  res.json(db.contacts[idx]);
});

app.delete("/api/contacts/:id", async (req, res) => {
  const db = await readDb();
  if (!db.contacts) db.contacts = [];
  const before = db.contacts.length;
  db.contacts = db.contacts.filter((c) => c.id !== req.params.id);
  if (db.contacts.length === before)
    return res.status(404).json({ message: "Not found" });
  await writeDb(db);
  res.status(204).end();
});


const port = process.env.PORT ? Number(process.env.PORT) : 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});

