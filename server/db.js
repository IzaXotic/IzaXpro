const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[DB] FATAL: MONGODB_URI is not set. Set it in your environment variables.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[DB] FATAL: MongoDB connection error:', err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
