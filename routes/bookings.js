const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const verifyToken = require('../middleware/auth');

// Create a new car booking (Private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { carId, driverNeeded, specialNote } = req.body;

    if (!carId || !driverNeeded) {
      return res.status(400).json({ success: false, message: 'Car ID and driver requirement are required.' });
    }

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const carIndex = global.memoryCars.findIndex(car => car._id === carId);
      if (carIndex === -1) {
        return res.status(404).json({ success: false, message: 'Car not found.' });
      }

      const car = global.memoryCars[carIndex];

      if (car.availability === 'Unavailable') {
        return res.status(400).json({ success: false, message: 'This car is currently unavailable for booking.' });
      }

      const newBooking = {
        _id: 'booking_' + Date.now() + Math.random().toString(36).substr(2, 5),
        carId,
        carName: car.name,
        carImage: car.image,
        price: car.price,
        email: req.user.email,
        driverNeeded,
        specialNote: specialNote || '',
        bookingDate: new Date(),
        status: 'Confirmed',
        createdAt: new Date(),
      };

      global.memoryBookings.push(newBooking);

      // Increment booking count on the memory car using $inc equivalence
      global.memoryCars[carIndex].booking_count = (global.memoryCars[carIndex].booking_count || 0) + 1;

      return res.status(201).json({
        success: true,
        message: 'Car booked successfully!',
        booking: newBooking,
      });
    }
    // --------------------------

    // Find the car being booked
    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found.' });
    }

    // Check if the car is available
    if (car.availability === 'Unavailable') {
      return res.status(400).json({ success: false, message: 'This car is currently unavailable for booking.' });
    }

    // Calculate total price
    const totalPrice = car.price;

    const newBooking = new Booking({
      carId,
      carName: car.name,
      carImage: car.image,
      price: totalPrice,
      email: req.user.email, // Logged in user's email
      driverNeeded,
      specialNote: specialNote || '',
      bookingDate: new Date(),
      status: 'Confirmed',
    });

    // Save booking
    const savedBooking = await newBooking.save();

    // Increment car booking count using $inc operator
    await Car.findByIdAndUpdate(carId, { 
      $inc: { booking_count: 1 } 
    });

    res.status(201).json({
      success: true,
      message: 'Car booked successfully!',
      booking: savedBooking,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to complete booking. Please try again.' });
  }
});

// Get all bookings made by the logged-in user (Private)
router.get('/', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const myBookings = global.memoryBookings.filter(booking => booking.email === email);
      myBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: myBookings.length, bookings: myBookings });
    }
    // --------------------------

    const bookings = await Booking.find({ email }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving your bookings.' });
  }
});

// Cancel/Delete a booking (Private - Owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const bookingId = req.params.id;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const bookingIndex = global.memoryBookings.findIndex(b => b._id === bookingId);
      if (bookingIndex === -1) {
        return res.status(404).json({ success: false, message: 'Booking not found.' });
      }

      const booking = global.memoryBookings[bookingIndex];

      // Verify ownership
      if (booking.email !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this booking.' });
      }

      // Decrement booking_count on the memory car
      const carIndex = global.memoryCars.findIndex(c => c._id === booking.carId);
      if (carIndex !== -1) {
        global.memoryCars[carIndex].booking_count = Math.max(0, (global.memoryCars[carIndex].booking_count || 1) - 1);
      }

      global.memoryBookings.splice(bookingIndex, 1);
      return res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
    }
    // --------------------------

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Verify ownership
    if (booking.email !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this booking.' });
    }

    await Booking.findByIdAndDelete(bookingId);

    // Decrement car booking count using $inc operator
    await Car.findByIdAndUpdate(booking.carId, {
      $inc: { booking_count: -1 }
    });

    res.status(200).json({ success: true, message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to cancel booking.' });
  }
});

module.exports = router;
