const mongoose = require('mongoose');
require('./memoryDb');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/drivefleet';
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(mongoURI, {
      dbName: 'drivefleet',
      serverSelectionTimeoutMS: 15000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    global.useMemoryDB = false; // Disable memory DB since real DB is working!
    global.dbError = null;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Ensure MongoDB is running or update MONGO_URI in .env file.');
    console.log('Running in local memory fallback mode for routes to prevent server crash.');
    global.useMemoryDB = true; // Stay in memory fallback mode
    global.dbError = error.message;
  }
};

module.exports = connectDB;
