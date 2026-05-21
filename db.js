const mongoose = require('mongoose');
require('./memoryDb');

let cachedConnection = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    global.useMemoryDB = false;
    return mongoose.connection;
  }

  if (cachedConnection) {
    try {
      await cachedConnection;
      global.useMemoryDB = false;
      return mongoose.connection;
    } catch (e) {
      cachedConnection = null;
    }
  }

  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/drivefleet';
  console.log('Connecting to MongoDB...');

  cachedConnection = mongoose.connect(mongoURI, {
    dbName: 'drivefleet',
    serverSelectionTimeoutMS: 15000
  });

  try {
    const conn = await cachedConnection;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMemoryDB = false;
    global.dbError = null;
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Ensure MongoDB is running or update MONGO_URI in .env file.');
    console.log('Running in local memory fallback mode for routes to prevent server crash.');
    global.useMemoryDB = true;
    global.dbError = error.message;
    cachedConnection = null; // Clear cache on error to allow retry
    return null;
  }
};

module.exports = connectDB;
