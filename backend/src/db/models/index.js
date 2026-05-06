import mongoose from "mongoose";

// ── Destination ───────────────────────────────────────────────────────────────
const DestinationSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  region: { type: String, required: true, index: true },
  description: { type: String, default: "" },
  heroImageUrl: { type: String, default: "" },
  essenceText: { type: String, default: "" },
  landmarks: [{
    title: String, category: String, description: String, imageUrl: String,
    _id: false,
  }],
  bestSeasonsTitle: { type: String, default: "" },
  bestSeasonsMonths: { type: String, default: "" },
  seasonsHighlights: [{ season: String, description: String, _id: false }],
  galleryImages: [String],
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

// ── Tour ──────────────────────────────────────────────────────────────────────
const TourSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  region: { type: String, required: true, index: true },
  days: { type: Number, required: true },
  price: { type: String, required: true },
  category: { type: String, required: true, index: true },
  rating: { type: Number, default: 0 },
  heroImageUrl: { type: String, default: "" },
  overviewDescription: { type: String, default: "" },
  overviewExtended: { type: String, default: "" },
  transport: { type: String, default: "" },
  guide: { type: String, default: "" },
  pickup: { type: String, default: "" },
  itinerary: [{
    title: String, description: String, imageUrl: String,
    schedule: String, accommodation: String, meals: String, _id: false,
  }],
  sightseeing: [{ title: String, description: String, icon: String, imageUrl: String, _id: false }],
  visualArchive: [String],
  testimonials: [{ quote: String, author: String, _id: false }],
  departureWindows: [{ range: String, label: String, _id: false }],
  maxGuests: { type: Number, default: 8 },
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

// ── Visa ──────────────────────────────────────────────────────────────────────
const VisaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  country: { type: String, required: true, index: true },
  processing: { type: String, required: true },
  difficulty: { type: String, required: true },
  fee: { type: String, default: "" },
  heroImageUrl: { type: String, default: "" },
  description: { type: String, default: "" },
  visaType: { type: String, default: "" },
  documents: [String],
  requirements: [mongoose.Schema.Types.Mixed],
  additionalDetails: [String],
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

// ── Contact ───────────────────────────────────────────────────────────────────
const ContactSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, index: true },
  type: { type: String, default: "General Inquiry" },
  message: { type: String, default: "" },
  read: { type: Boolean, default: false, index: true },
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

// ── Media ─────────────────────────────────────────────────────────────────────
const MediaSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  url: { type: String, required: true },
  cloudinaryPublicId: { type: String, default: "", index: true },
  name: { type: String, required: true },
  size: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  type: { type: String, required: true },
  date: { type: String, required: true },
  folder: { type: String, default: "General", index: true },
  hash: { type: String, default: "", index: true },
  usedIn: [{ entity: String, id: String, field: String }],
  deletedAt: { type: Number, default: null },
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

// ── Backup ────────────────────────────────────────────────────────────────────
const BackupSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  filename: { type: String, required: true },
  checksum: { type: String, default: "" },
  size: { type: Number, default: 0 },
  collections: {
    destinations: { type: Number, default: 0 },
    tours: { type: Number, default: 0 },
    visas: { type: Number, default: 0 },
    contacts: { type: Number, default: 0 },
    media: { type: Number, default: 0 },
  },
  storagePath: { type: String, default: "" },
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
  restoredAt: { type: Number, default: null },
  createdBy: { type: String, default: "System" },
}, { timestamps: false, versionKey: false });

// ── CoEditor ──────────────────────────────────────────────────────────────────
const CoEditorSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const AdminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// ── Settings ──────────────────────────────────────────────────────────────────
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Number, default: () => Date.now() },
}, { timestamps: false, versionKey: false });

// ── SystemLog ─────────────────────────────────────────────────────────────────
const SystemLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  level: { type: String, default: "error", index: true }, // 'error', 'warn', 'info'
  source: { type: String, default: "frontend", index: true }, // 'frontend', 'backend'
  message: { type: String, required: true },
  stack: { type: String, default: "" },
  url: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  resolved: { type: Boolean, default: false, index: true },
  createdAt: { type: Number, default: () => Date.now(), index: -1 },
}, { timestamps: false, versionKey: false });

export const Destination  = mongoose.models.Destination  || mongoose.model("Destination",  DestinationSchema);
export const Tour         = mongoose.models.Tour         || mongoose.model("Tour",          TourSchema);
export const Visa         = mongoose.models.Visa         || mongoose.model("Visa",          VisaSchema);
export const Contact      = mongoose.models.Contact      || mongoose.model("Contact",       ContactSchema);
export const Media        = mongoose.models.Media        || mongoose.model("Media",         MediaSchema);
export const Backup       = mongoose.models.Backup       || mongoose.model("Backup",        BackupSchema);
export const CoEditor     = mongoose.models.CoEditor     || mongoose.model("CoEditor",      CoEditorSchema);
export const Admin        = mongoose.models.Admin        || mongoose.model("Admin",         AdminSchema);
export const Settings     = mongoose.models.Settings     || mongoose.model("Settings",      SettingsSchema);
export const SystemLog    = mongoose.models.SystemLog    || mongoose.model("SystemLog",     SystemLogSchema);
