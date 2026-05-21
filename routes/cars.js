const express = require('express');
const router = express.Router();
const Car = require('../models/Car');
const verifyToken = require('../middleware/auth');

// Get all cars with search and filter
router.get('/', async (req, res) => {
  try {
    const { search, type } = req.query;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      let filteredCars = [...global.memoryCars];

      // Regex search by car name simulation
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filteredCars = filteredCars.filter(car => searchRegex.test(car.name));
      }

      // Filter by car type (SUV, Sedan, Hatchback, Luxury, etc.)
      if (type && type !== 'All') {
        filteredCars = filteredCars.filter(car => car.type.toLowerCase() === type.toLowerCase());
      }

      // Sort by newest
      filteredCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json({
        success: true,
        count: filteredCars.length,
        cars: filteredCars,
      });
    }
    // --------------------------

    let query = {};

    // Apply regex search by car name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Apply filter by car type (SUV, Sedan, Hatchback, Luxury, etc.)
    if (type && type !== 'All') {
      query.type = type;
    }

    const cars = await Car.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: cars.length, cars });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving car listings.' });
  }
});

// Get cars listed by the logged-in user (Private)
router.get('/my-cars', verifyToken, async (req, res) => {
  try {
    const email = req.user.email;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const myCars = global.memoryCars.filter(car => car.owner === email);
      myCars.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: myCars.length, cars: myCars });
    }
    // --------------------------

    const cars = await Car.find({ owner: email }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: cars.length, cars });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving your listed cars.' });
  }
});

// Get a single car detail by ID
router.get('/:id', async (req, res) => {
  try {
    const carId = req.params.id;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const car = global.memoryCars.find(car => car._id === carId);
      if (!car) {
        return res.status(404).json({ success: false, message: 'Car not found.' });
      }
      return res.status(200).json({ success: true, car });
    }
    // --------------------------

    const car = await Car.findById(carId);
    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found.' });
    }
    res.status(200).json({ success: true, car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error retrieving car details.' });
  }
});

// Add a new car listing (Private)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, price, type, image, seats, location, description, availability } = req.body;

    if (!name || !price || !type || !image || !seats || !location || !description) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields.' });
    }

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const newCar = {
        _id: 'car_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name,
        price: Number(price),
        type,
        image,
        seats: Number(seats),
        location,
        description,
        availability: availability || 'Available',
        owner: req.user.email,
        booking_count: 0,
        createdAt: new Date(),
      };

      global.memoryCars.push(newCar);
      return res.status(201).json({ success: true, message: 'Car listed successfully!', car: newCar });
    }
    // --------------------------

    const newCar = new Car({
      name,
      price: Number(price),
      type,
      image,
      seats: Number(seats),
      location,
      description,
      availability: availability || 'Available',
      owner: req.user.email,
      booking_count: 0,
    });

    const savedCar = await newCar.save();
    res.status(201).json({ success: true, message: 'Car listed successfully!', car: savedCar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create car listing.' });
  }
});

// Update a car listing (Private - Owner only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const carId = req.params.id;
    const { name, price, type, image, seats, location, description, availability } = req.body;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const carIndex = global.memoryCars.findIndex(car => car._id === carId);

      if (carIndex === -1) {
        return res.status(404).json({ success: false, message: 'Car not found.' });
      }

      const car = global.memoryCars[carIndex];

      // Verify ownership
      if (car.owner !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this listing.' });
      }

      // Update fields
      if (name) car.name = name;
      if (price) car.price = Number(price);
      if (type) car.type = type;
      if (image) car.image = image;
      if (seats) car.seats = Number(seats);
      if (location) car.location = location;
      if (description) car.description = description;
      if (availability) car.availability = availability;

      global.memoryCars[carIndex] = car;
      return res.status(200).json({ success: true, message: 'Car listing updated successfully!', car });
    }
    // --------------------------

    let car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found.' });
    }

    // Verify ownership
    if (car.owner !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this listing.' });
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name;
    if (price) updateData.price = Number(price);
    if (type) updateData.type = type;
    if (image) updateData.image = image;
    if (seats) updateData.seats = Number(seats);
    if (location) updateData.location = location;
    if (description) updateData.description = description;
    if (availability) updateData.availability = availability;

    const updatedCar = await Car.findByIdAndUpdate(carId, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Car listing updated successfully!', car: updatedCar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update car listing.' });
  }
});

// Delete a car listing (Private - Owner only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const carId = req.params.id;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const carIndex = global.memoryCars.findIndex(car => car._id === carId);

      if (carIndex === -1) {
        return res.status(404).json({ success: false, message: 'Car not found.' });
      }

      const car = global.memoryCars[carIndex];

      // Verify ownership
      if (car.owner !== req.user.email) {
        return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this listing.' });
      }

      global.memoryCars.splice(carIndex, 1);
      return res.status(200).json({ success: true, message: 'Car listing deleted successfully!' });
    }
    // --------------------------

    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ success: false, message: 'Car not found.' });
    }

    // Verify ownership
    if (car.owner !== req.user.email) {
      return res.status(403).json({ success: false, message: 'Unauthorized. You do not own this listing.' });
    }

    await Car.findByIdAndDelete(carId);
    res.status(200).json({ success: true, message: 'Car listing deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete car listing.' });
  }
});

module.exports = router;
