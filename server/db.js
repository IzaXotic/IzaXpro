const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] MONGODB_URI not set — using JSON flat files');
    return false;
  }
  try {
    await mongoose.connect(uri);
    console.log('[DB] MongoDB connected');
    return true;
  } catch (err) {
    console.error('[DB] MongoDB connection error:', err.message);
    return false;
  }
};

module.exports = connectDB;
