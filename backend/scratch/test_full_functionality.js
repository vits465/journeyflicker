import 'dotenv/config';
import mongoose from 'mongoose';

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB });
    console.log('Connected to MongoDB.');

    // 1. Delete test destination
    const destRes = await mongoose.connection.db.collection('destinations').deleteOne({ name: 'TEST-AUTO' });
    console.log('Deleted TEST-AUTO destination:', destRes.deletedCount);

    // 2. Revert tour name
    const tourRes = await mongoose.connection.db.collection('tours').updateOne(
      { name: /Incredible India.*UPDATED/ },
      { $set: { name: 'Incredible India – Golden Triangle Tour' } }
    );
    console.log('Reverted tour name:', tourRes.modifiedCount);

    // 3. Test API Upload (Simulated)
    const BASE = 'http://localhost:5174';
    console.log('Logging in for upload test...');
    const loginRes = await fetch(BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Fliker', password: 'JourneyFliker0465' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) throw new Error('Login failed: ' + JSON.stringify(loginData));

    // Small 1x1 transparent PNG base64
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    console.log('Testing image upload...');
    const uploadRes = await fetch(BASE + '/api/upload', {
      method: 'POST',
      headers: { 
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'test-functional-upload.png', data: testImage })
    });
    const uploadData = await uploadRes.json();
    console.log('Upload Result:', JSON.stringify(uploadData, null, 2));

    if (uploadData.url) {
      // The admin panel code calls POST /api/media after POST /api/upload
      // Let's mimic that to ensure it goes into the MongoDB collection
      console.log('Registering media item in database...');
      const mediaRes = await fetch(BASE + '/api/media', {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: uploadData.url,
          name: 'test-functional-upload.png',
          size: '1KB',
          type: 'image/png',
          date: new Date().toLocaleDateString(),
          folder: 'General'
        })
      });
      const mediaData = await mediaRes.json();
      console.log('Media Register Result:', JSON.stringify(mediaData, null, 2));

      // Finally check MongoDB
      const mediaItem = await mongoose.connection.db.collection('media').findOne({ url: uploadData.url });
      console.log('Media record in MongoDB:', mediaItem ? '✅ FOUND' : '❌ NOT FOUND');
      
      // Cleanup the test media
      if (mediaItem) {
        await mongoose.connection.db.collection('media').deleteOne({ url: uploadData.url });
        console.log('Cleaned up test media record.');
      }
    }

    await mongoose.disconnect();
    console.log('Test complete.');
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
