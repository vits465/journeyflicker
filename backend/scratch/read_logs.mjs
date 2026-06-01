import mongoose from 'mongoose';

const MONGODB_URI = "mongodb://adichauha465_db_user:mO1Q8PK7cBAagLJs@ac-xdyfa8g-shard-00-00.6gistn5.mongodb.net:27017,ac-xdyfa8g-shard-00-01.6gistn5.mongodb.net:27017,ac-xdyfa8g-shard-00-02.6gistn5.mongodb.net:27017/Journey-data?ssl=true&replicaSet=atlas-wakbqb-shard-0&authSource=admin&retryWrites=true&w=majority&appName=journeyflicker-cluster";

const SystemLogSchema = new mongoose.Schema({
  id: String,
  level: String,
  source: String,
  message: String,
  stack: String,
  url: String,
  userAgent: String,
  resolved: Boolean,
  createdAt: Number
}, { timestamps: false, versionKey: false });

const SystemLog = mongoose.models.SystemLog || mongoose.model("SystemLog", SystemLogSchema);

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully. Fetching latest error logs...");
    
    const logs = await SystemLog.find({}).sort({ createdAt: -1 }).limit(20).lean();
    console.log(`Found ${logs.length} logs:`);
    for (const log of logs) {
      console.log("=========================================");
      console.log(`ID: ${log.id}`);
      console.log(`Created: ${new Date(log.createdAt).toISOString()}`);
      console.log(`Message: ${log.message}`);
      console.log(`URL: ${log.url}`);
      console.log(`UserAgent: ${log.userAgent}`);
      console.log(`Stack:\n${log.stack}`);
      console.log("=========================================\n");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

run();
