import mongoose from "mongoose";

let isConnected = false;
let connectionPromise = null; // Store the promise so repeated calls await the same attempt

export function connectMongo() {
  if (isConnected) return Promise.resolve();
  if (connectionPromise) return connectionPromise; // Already connecting — return same promise

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[MongoDB] MONGODB_URI not set — MongoDB features disabled.");
    return Promise.resolve();
  }

  connectionPromise = mongoose
    .connect(uri, {
      dbName:                   process.env.MONGODB_DB || "journeyflicker",
      serverSelectionTimeoutMS: 10000,  // Increased from 5s → 10s for Railway cold starts
      socketTimeoutMS:          45000,
      connectTimeoutMS:         10000,
      maxPoolSize:              10,
    })
    .then(() => {
      isConnected = true;
      connectionPromise = null;
      console.log("[MongoDB] ✅ Connected to db:", mongoose.connection.db.databaseName);

      mongoose.connection.on("error", (err) => {
        console.error("[MongoDB] Connection error:", err.message);
        isConnected = false;
      });
      mongoose.connection.on("disconnected", () => {
        console.warn("[MongoDB] Disconnected — will reconnect on next request.");
        isConnected = false;
        connectionPromise = null;
      });
      mongoose.connection.on("reconnected", () => {
        console.log("[MongoDB] Reconnected.");
        isConnected = true;
      });
    })
    .catch((err) => {
      console.error("[MongoDB] ❌ Failed to connect:", err.message);
      isConnected = false;
      connectionPromise = null; // Allow retry on next request
      // Non-fatal — fall back to KV
    });

  return connectionPromise;
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default mongoose;
