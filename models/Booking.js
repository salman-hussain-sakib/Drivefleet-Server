const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car',
    required: true,
  },
  carName: {
    type: String,
    required: true,
  },
  carImage: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  email: {
    type: String,
    required: true, // Email of the user who is booking
  },
  driverNeeded: {
    type: String, // "Yes" or "No"
    required: true,
  },
  specialNote: {
    type: String,
    default: "",
  },
  bookingDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "Confirmed",
  },
}, { timestamps: true });

module.exports = mongoose.model('Booking', BookingSchema);
