/**
 * migrate.js — One-time KV → MongoDB migration
 * Run via: POST /api/admin/migrate (admin only)
 */
import express from "express";
import { isMongoConnected } from "../db/mongoose.js";
import mongoose from "mongoose";
import { Destination, Tour, Visa, Contact, Media, CoEditor, Settings } from "../db/models/index.js";
import { Redis } from "@upstash/redis";
const kv = new Redis({
  url:   process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

export const router = express.Router();

router.post("/", async (req, res) => {
  if (!isMongoConnected()) {
    return res.status(400).json({ error: "MongoDB not connected. Set MONGODB_URI env variable." });
  }

  const log = [];
  const DB_KEY = "jf:db";

  try {
    // Load data from KV
    log.push("Reading data from Vercel KV...");
    const db = await kv.get(DB_KEY);
    if (!db) {
      return res.status(404).json({ error: "No data found in KV. Nothing to migrate.", log });
    }

    const results = {};

    // Destinations
    if (db.destinations?.length) {
      const existing = await Destination.countDocuments();
      if (existing === 0) {
        await Destination.insertMany(db.destinations, { ordered: false });
        results.destinations = db.destinations.length;
        log.push(`✓ Migrated ${db.destinations.length} destinations`);
      } else {
        log.push(`⚠ Skipped destinations — ${existing} already exist in MongoDB`);
        results.destinations = 0;
      }
    } else {
      log.push("ℹ No destinations to migrate");
      results.destinations = 0;
    }

    // Tours
    if (db.tours?.length) {
      const existing = await Tour.countDocuments();
      if (existing === 0) {
        await Tour.insertMany(db.tours, { ordered: false });
        results.tours = db.tours.length;
        log.push(`✓ Migrated ${db.tours.length} tours`);
      } else {
        log.push(`⚠ Skipped tours — ${existing} already exist`);
        results.tours = 0;
      }
    } else {
      log.push("ℹ No tours to migrate");
      results.tours = 0;
    }

    // Visas
    if (db.visas?.length) {
      const existing = await Visa.countDocuments();
      if (existing === 0) {
        await Visa.insertMany(db.visas, { ordered: false });
        results.visas = db.visas.length;
        log.push(`✓ Migrated ${db.visas.length} visas`);
      } else {
        log.push(`⚠ Skipped visas — ${existing} already exist`);
        results.visas = 0;
      }
    } else {
      log.push("ℹ No visas to migrate");
      results.visas = 0;
    }

    // Contacts
    if (db.contacts?.length) {
      const existing = await Contact.countDocuments();
      if (existing === 0) {
        await Contact.insertMany(db.contacts, { ordered: false });
        results.contacts = db.contacts.length;
        log.push(`✓ Migrated ${db.contacts.length} contacts`);
      } else {
        log.push(`⚠ Skipped contacts — ${existing} already exist`);
        results.contacts = 0;
      }
    } else {
      log.push("ℹ No contacts to migrate");
      results.contacts = 0;
    }

    // Media
    if (db.media?.length) {
      const existing = await Media.countDocuments();
      if (existing === 0) {
        await Media.insertMany(db.media, { ordered: false });
        results.media = db.media.length;
        log.push(`✓ Migrated ${db.media.length} media items`);
      } else {
        log.push(`⚠ Skipped media — ${existing} already exist`);
        results.media = 0;
      }
    } else {
      log.push("ℹ No media to migrate");
      results.media = 0;
    }

    // Co-Editor Accounts (with hashed passwords)
    if (db.coEditorAccounts?.length) {
      const existing = await CoEditor.countDocuments();
      if (existing === 0) {
        await CoEditor.insertMany(db.coEditorAccounts, { ordered: false });
        results.coEditors = db.coEditorAccounts.length;
        log.push(`✓ Migrated ${db.coEditorAccounts.length} co-editor accounts`);
      } else {
        log.push(`⚠ Skipped co-editors — ${existing} already exist`);
        results.coEditors = 0;
      }
    } else {
      log.push("ℹ No co-editor accounts to migrate");
      results.coEditors = 0;
    }

    // Settings (hero, seo, api_settings from separate KV keys)
    const HERO_KEY        = "jf:hero";
    const SEO_KEY         = "jf:seo";
    const API_SETTINGS_KEY = "jf:api_settings";

    for (const [key, settingsKey] of [["hero", HERO_KEY], ["seo", SEO_KEY], ["api_settings", API_SETTINGS_KEY]]) {
      try {
        const value = await kv.get(settingsKey);
        if (value) {
          await Settings.updateOne(
            { key },
            { $set: { key, value, updatedAt: Date.now() } },
            { upsert: true }
          );
          log.push(`✓ Migrated settings: ${key}`);
        }
      } catch (e) {
        log.push(`⚠ Failed to migrate settings ${key}: ${e.message}`);
      }
    }

    log.push("✅ Migration complete!");
    return res.json({ success: true, results, log });
  } catch (err) {
    log.push(`✗ Migration failed: ${err.message}`);
    console.error("[Migrate] Error:", err);
    return res.status(500).json({ error: err.message, log });
  }
});

/** GET /api/admin/migrate/status — Check migration status */
router.get("/status", async (req, res) => {
  if (!isMongoConnected()) {
    return res.json({ mongoConnected: false, counts: {} });
  }

  const [destinations, tours, visas, contacts, media, coEditors] = await Promise.all([
    Destination.countDocuments(),
    Tour.countDocuments(),
    Visa.countDocuments(),
    Contact.countDocuments(),
    Media.countDocuments(),
    CoEditor.countDocuments(),
  ]);

  return res.json({
    mongoConnected: true,
    counts: { destinations, tours, visas, contacts, media, coEditors },
    dbName: mongoose.connection?.name || "journeyflicker",
    dbHost: mongoose.connection?.host || "localhost",
  });
});
