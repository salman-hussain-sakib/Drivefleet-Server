const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
  _id: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true, // SUV, Sedan, Hatchback, Luxury, etc.
  },
  image: {
    type: String,
    required: true,
  },
  seats: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  availability: {
    type: String,
    required: true, // "Available" or "Unavailable"
    default: "Available",
  },
  owner: {
    type: String, // Store owner's email address
    required: true,
  },
  booking_count: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Car', CarSchema);
