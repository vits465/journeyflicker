import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import readline from "readline";
import { connectMongo, isMongoConnected } from "../src/db/mongoose.js";
import { Tour } from "../src/db/models/index.js";
import { compressItineraryAlgorithmic, compressItineraryAI } from "../src/lib/itinerary-compressor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, "../data/db.json");
const envPath = path.resolve(__dirname, "../.env");

// Load environment variables relative to the script location
dotenv.config({ path: envPath });

// Utility to generate a valid ID matching index.js format
function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Simple CLI Argument parser
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith("--")) {
      let [key, val] = arg.split("=");
      if (val) {
        // Strip surrounding single/double quotes if present
        val = val.replace(/^['"]|['"]$/g, "");
      }
      args[key.slice(2)] = val;
    }
  });
  return args;
}

// Setup console colors
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  fgGreen: "\x1b[32m",
  fgBlue: "\x1b[34m",
  fgYellow: "\x1b[33m",
  fgRed: "\x1b[31m",
  fgCyan: "\x1b[36m",
  bgBlack: "\x1b[40m"
};

function logHeader(msg) {
  console.log(`\n${colors.fgBlue}${colors.bright}=== ${msg} ===${colors.reset}\n`);
}

function logSuccess(msg) {
  console.log(`${colors.fgGreen}✅ ${msg}${colors.reset}`);
}

function logInfo(msg) {
  console.log(`${colors.fgCyan}ℹ ${msg}${colors.reset}`);
}

function logWarn(msg) {
  console.log(`${colors.fgYellow}⚠️ ${msg}${colors.reset}`);
}

function logError(msg) {
  console.log(`${colors.fgRed}❌ ${msg}${colors.reset}`);
}

// Ask user interactive questions
function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

// Load all tours from MongoDB and fallback to local db.json
async function getTours() {
  let tours = [];

  // Try MongoDB first if configured
  if (process.env.MONGODB_URI) {
    try {
      logInfo("Connecting to MongoDB Atlas...");
      await connectMongo();
      if (isMongoConnected()) {
        logSuccess("Connected to MongoDB Atlas.");
        tours = await Tour.find({}).lean();
        if (tours.length > 0) {
          logInfo(`Loaded ${tours.length} tours from MongoDB.`);
          return tours;
        }
      }
    } catch (err) {
      logWarn(`Failed to load from MongoDB: ${err.message}. Falling back to db.json.`);
    }
  }

  // Fallback to local db.json
  if (fs.existsSync(dbPath)) {
    try {
      logInfo(`Reading seed data from local db.json: ${dbPath}`);
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      tours = db.tours || [];
      logInfo(`Loaded ${tours.length} tours from local db.json.`);
    } catch (err) {
      logError(`Error parsing db.json: ${err.message}`);
    }
  } else {
    logError(`db.json not found at ${dbPath}`);
  }

  return tours;
}

// Sync the generated tour back to db.json and MongoDB
async function saveTour(newTour) {
  let savedLocal = false;
  let savedMongo = false;

  // 1. Save to local db.json
  if (fs.existsSync(dbPath)) {
    try {
      const raw = fs.readFileSync(dbPath, "utf-8");
      const db = JSON.parse(raw);
      
      // Ensure the tour array exists
      if (!db.tours) db.tours = [];
      
      // Check if duplicate ID exists, if so overwrite, otherwise append
      const idx = db.tours.findIndex(t => t.id === newTour.id);
      if (idx >= 0) {
        db.tours[idx] = newTour;
      } else {
        db.tours.push(newTour);
      }
      
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
      savedLocal = true;
      logSuccess("Saved new itinerary to local db.json successfully.");
    } catch (err) {
      logError(`Failed to save to db.json: ${err.message}`);
    }
  }

  // 2. Save to MongoDB
  if (process.env.MONGODB_URI) {
    try {
      if (!isMongoConnected()) {
        await connectMongo();
      }
      
      if (isMongoConnected()) {
        // Upsert the tour
        await Tour.findOneAndUpdate(
          { id: newTour.id },
          { $set: newTour },
          { upsert: true, new: true }
        );
        savedMongo = true;
        logSuccess("Saved/Upserted new itinerary to MongoDB Atlas database successfully.");
      }
    } catch (err) {
      logError(`Failed to save to MongoDB: ${err.message}`);
    }
  }

  // 3. Clear Redis Cache (if configured)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      logInfo("Upstash Redis detected. Invalidating 'tours' cache...");
      const setKey = "jf:set:tours";
      // We will perform a simple API invalidation by fetching and clearing
      const url = `${process.env.KV_REST_API_URL}/smembers/${setKey}`;
      const headers = { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` };
      
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const keys = data.result || [];
        if (keys.length > 0) {
          // Delete all cached paths
          const delUrl = `${process.env.KV_REST_API_URL}/del`;
          await fetch(delUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify([setKey, ...keys])
          });
          logSuccess(`Cleared Redis cache keys: ${keys.join(", ")}`);
        } else {
          logInfo("No active Redis cache found for prefix 'tours'.");
        }
      }
    } catch (err) {
      logWarn(`Failed to invalidate Redis cache: ${err.message}`);
    }
  }

  return savedLocal || savedMongo;
}


// Core compression functions are now imported from "../src/lib/itinerary-compressor.js"


// ── Main Execution Flow ──────────────────────────────────────────────────
async function run() {
  logHeader("JOURNEYFLICKER ITINERARY COMPRESSION ENGINE");

  const args = parseArgs();
  
  // 1. Gather all tours
  const tours = await getTours();
  if (tours.length === 0) {
    logError("No tours found in backend database or db.json. Exiting.");
    process.exit(1);
  }

  let selectedTour = null;
  let targetDays = null;
  let mode = null; // 'algo' or 'ai'
  let apiKey = args.key || process.env.GEMINI_API_KEY;

  // 2. Resolve parameters (cli arguments vs. interactive prompts)
  if (args.tour) {
    // Headless mode
    selectedTour = tours.find(t => 
      t.name.toLowerCase().includes(args.tour.toLowerCase()) || 
      t.id.toLowerCase() === args.tour.toLowerCase()
    );
    if (!selectedTour) {
      logError(`Could not find tour matching query: "${args.tour}"`);
      process.exit(1);
    }
    
    targetDays = parseInt(args.days, 10);
    if (isNaN(targetDays) || targetDays < 2 || targetDays > 5) {
      logWarn("Invalid days parameter. Defaulting to 3 days.");
      targetDays = 3;
    }

    mode = args.mode || "algo";
    if (mode === "ai" && !apiKey) {
      logWarn("AI mode requested but no GEMINI_API_KEY was found in environment or --key. Falling back to algorithmic mode.");
      mode = "algo";
    }

    logInfo(`Selected Tour: ${selectedTour.name} (Duration: ${selectedTour.days} Days)`);
    logInfo(`Target Duration: ${targetDays} Days`);
    logInfo(`Compression Mode: ${mode.toUpperCase()}`);
  } else {
    // Interactive mode
    console.log(`${colors.bright}Available Tours to Shorten:${colors.reset}`);
    tours.forEach((t, i) => {
      console.log(`  [${i + 1}] ${colors.fgCyan}${t.name}${colors.reset} (${t.days} Days, ${t.region}) - ${colors.dim}${t.id}${colors.reset}`);
    });

    const tourIndexInput = await askQuestion(`\nSelect tour number [1-${tours.length}]: `);
    const tourIndex = parseInt(tourIndexInput, 10) - 1;
    if (isNaN(tourIndex) || tourIndex < 0 || tourIndex >= tours.length) {
      logError("Invalid selection. Exiting.");
      process.exit(1);
    }
    selectedTour = tours[tourIndex];
    logSuccess(`Selected: ${selectedTour.name} (${selectedTour.days} Days)`);

    const daysInput = await askQuestion("Enter target duration in days (e.g. 3 or 4) [3]: ");
    targetDays = parseInt(daysInput, 10) || 3;
    if (isNaN(targetDays) || targetDays < 2 || targetDays > 10) {
      logError("Invalid duration. Must be between 2 and 10 days. Exiting.");
      process.exit(1);
    }
    
    if (targetDays >= selectedTour.days) {
      logError(`Target duration (${targetDays} days) must be shorter than the original tour (${selectedTour.days} days). Exiting.`);
      process.exit(1);
    }

    console.log(`\n${colors.bright}Compression Modes:${colors.reset}`);
    console.log(`  [1] ${colors.fgCyan}Smart Algorithmic Compiler${colors.reset} (Deterministic day-merging, 100% robust, zero API keys required)`);
    console.log(`  [2] ${colors.fgCyan}Gemini AI Luxury Curation${colors.reset} (Organically rewrites and polishes copy into a brand new tour)`);

    const modeInput = await askQuestion("\nSelect compression mode [1]: ");
    if (modeInput === "2") {
      mode = "ai";
      if (!apiKey) {
        logWarn("No GEMINI_API_KEY detected in your environment variable (.env).");
        const enteredKey = await askQuestion("Please enter your Gemini API Key (or press enter to skip and fall back to Algorithmic): ");
        if (enteredKey) {
          apiKey = enteredKey;
        } else {
          logWarn("No API key entered. Falling back to Smart Algorithmic mode.");
          mode = "algo";
        }
      }
    } else {
      mode = "algo";
    }
  }

  // 3. Compress itinerary
  let compressedTour = null;
  if (mode === "ai" && apiKey) {
    compressedTour = await compressItineraryAI(selectedTour, targetDays, apiKey);
  } else {
    compressedTour = compressItineraryAlgorithmic(selectedTour, targetDays);
  }

  // 4. Print summary preview
  logHeader("NEW ITINERARY PREVIEW");
  console.log(`${colors.bright}Name:${colors.reset}        ${colors.fgGreen}${compressedTour.name}${colors.reset}`);
  console.log(`${colors.bright}Category:${colors.reset}    ${compressedTour.category}`);
  console.log(`${colors.bright}Region:${colors.reset}      ${compressedTour.region}`);
  console.log(`${colors.bright}Duration:${colors.reset}    ${colors.fgBlue}${compressedTour.days} Days${colors.reset}`);
  console.log(`${colors.bright}Price:${colors.reset}       ${colors.fgYellow}${compressedTour.price}${colors.reset}`);
  console.log(`${colors.bright}Overview:${colors.reset}    ${compressedTour.overviewDescription}`);
  console.log(`\n${colors.bright}Itinerary Breakdown:${colors.reset}`);
  
  compressedTour.itinerary.forEach(day => {
    console.log(`  ${colors.fgCyan}${day.title}${colors.reset}`);
    console.log(`    ${colors.dim}Schedule: ${day.schedule || "N/A"}${colors.reset}`);
    console.log(`    ${colors.dim}Hotel:    ${day.accommodation || "N/A"}${colors.reset}`);
    console.log(`    ${colors.dim}Meals:    ${day.meals || "N/A"}${colors.reset}`);
    console.log(`    ${day.description.slice(0, 120)}...`);
  });

  // 5. Save the itinerary
  let proceedSave = true;
  if (!args.tour) {
    const confirmInput = await askQuestion(`\nSave this new itinerary to database and local files? (y/n) [y]: `);
    proceedSave = confirmInput.toLowerCase() !== "n";
  }

  if (proceedSave) {
    const success = await saveTour(compressedTour);
    if (success) {
      logSuccess(`\nSuccessfully created new itinerary!`);
      logSuccess(`ID: ${compressedTour.id}`);
      logSuccess(`Name: ${compressedTour.name}`);
      console.log(`You can now check it in the local app or admin panel.`);
    } else {
      logError("Failed to save the new itinerary.");
    }
  } else {
    logInfo("Save cancelled by user.");
  }

  // If Mongoose is connected, close connection safely
  try {
    const mongoose = (await import("mongoose")).default;
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      logInfo("Closed database connections.");
    }
  } catch {}

  logHeader("PROCESS COMPLETE");
}

run().catch(err => {
  logError(`Fatal process error: ${err.stack || err.message}`);
  process.exit(1);
});
