const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./db');
const authRoutes = require('./routes/auth');
const carRoutes = require('./routes/cars');
const bookingRoutes = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB middleware to handle serverless cold starts
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error("Database connection middleware error:", err.message);
  }
  next();
});

// Trust Vercel's reverse proxy for secure cookies
app.set('trust proxy', 1);

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://drivefleet-client.vercel.app',
    process.env.CLIENT_URL // Adding an environment variable for flexibility
  ].filter(Boolean), 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));
app.use(express.json());
app.use(cookieParser());

// Request logging for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the DriveFleet Car Rental Platform API!',
    status: 'Healthy',
    db_status: global.useMemoryDB ? 'Memory Fallback' : 'Connected to Atlas',
    db_error: global.dbError || 'None',
  });
});

app.get('/api/diagnose-db', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    let collections = [];
    let counts = {};
    if (state === 1) {
      const cols = await mongoose.connection.db.listCollections().toArray();
      collections = cols.map(c => c.name);
      for (const name of collections) {
        counts[name] = await mongoose.connection.db.collection(name).countDocuments();
      }
    }

    res.status(200).json({
      success: true,
      mongoose_state: states[state],
      useMemoryDB: global.useMemoryDB,
      dbError: global.dbError,
      mongoURI: process.env.MONGO_URI ? `${process.env.MONGO_URI.substring(0, 25)}...` : 'Not Set',
      collections,
      counts
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`DriveFleet API Server is running on port ${PORT}`);
});
