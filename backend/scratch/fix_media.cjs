const mongoose = require('mongoose');
const uri = 'mongodb://adichauha465_db_user:mO1Q8PK7cBAagLJs@ac-xdyfa8g-shard-00-00.6gistn5.mongodb.net:27017,ac-xdyfa8g-shard-00-01.6gistn5.mongodb.net:27017,ac-xdyfa8g-shard-00-02.6gistn5.mongodb.net:27017/Journey-data?ssl=true&replicaSet=atlas-wakbqb-shard-0&authSource=admin&retryWrites=true&w=majority&appName=journeyflicker-cluster';

async function fix() {
  await mongoose.connect(uri);
  const result = await mongoose.connection.db.collection('media').updateMany(
    { deletedAt: { $exists: false } },
    { $set: { deletedAt: null } }
  );
  console.log('Modified documents:', result.modifiedCount);
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
