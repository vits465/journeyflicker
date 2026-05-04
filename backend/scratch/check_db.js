import { connectMongo } from '../src/db/mongoose.js';
import { Tour } from '../src/db/models/index.js';
import 'dotenv/config';

async function check() {
  try {
    await connectMongo();
    const count = await Tour.countDocuments();
    console.log('Total Tours in MongoDB:', count);
    const sample = await Tour.findOne().lean();
    if (sample) {
       console.log('Sample Tour:', JSON.stringify(sample, null, 2));
    } else {
       console.log('No tours found.');
    }
  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    process.exit(0);
  }
}

check();
