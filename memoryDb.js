// In-memory Database Fallback for local, zero-config, network-independent running

const initialCars = [
  {
    _id: "car_tesla_001",
    name: "Tesla Model S Plaid",
    price: 150,
    type: "Sedan",
    image: "https://images.unsplash.com/photo-1617704548623-340376564e68?w=800&auto=format&fit=crop",
    seats: 5,
    location: "San Francisco, CA",
    description: "Experience the future of driving with Tesla's flagship electric sedan. 1,020 horsepower, 0-60 in 1.99s, and cutting-edge Autopilot. Unmatched speed and luxury combined.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
  },
  {
    _id: "car_porsche_002",
    name: "Porsche 911 Carrera GTS",
    price: 250,
    type: "Luxury",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop",
    seats: 4,
    location: "Los Angeles, CA",
    description: "The quintessential sports car. Breathtaking handling, rear-engine agility, and iconic design. Perfect for cruising the coastline or attacking canyon curves in style.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
  },
  {
    _id: "car_rover_003",
    name: "Range Rover Autobiography",
    price: 180,
    type: "SUV",
    image: "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop",
    seats: 7,
    location: "Miami, FL",
    description: "The pinnacle of SUV refinement. Offering exceptional all-terrain capability coupled with a gorgeous leather cabin, massage seats, and executive road presence.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
  },
  {
    _id: "car_bmw_004",
    name: "BMW M4 Competition",
    price: 200,
    type: "Luxury",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop",
    seats: 4,
    location: "New York, NY",
    description: "A precision driving instrument. High-performance twin-turbo inline 6-cylinder, aggressive styling, and a race-track tuned suspension. A true driver's masterpiece.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 15,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
  },
  {
    _id: "car_audi_005",
    name: "Audi Q7 Premium Plus",
    price: 120,
    type: "SUV",
    image: "https://images.unsplash.com/photo-1606152421802-db97b9c7a11b?w=800&auto=format&fit=crop",
    seats: 7,
    location: "Chicago, IL",
    description: "Spacious, smart, and incredibly comfortable. Boasting Audi's legendary Quattro AWD system, virtual cockpit display, and ample cargo space for family road trips.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
  },
  {
    _id: "car_merc_006",
    name: "Mercedes-Benz C-Class Coupe",
    price: 110,
    type: "Sedan",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop",
    seats: 5,
    location: "Seattle, WA",
    description: "Sleek sporty elegance. Blending cutting-edge cabin tech with smooth turbo performance, ambient lighting, and world-class safety features.",
    availability: "Available",
    owner: "admin@drivefleet.com",
    booking_count: 10,
    createdAt: new Date(),
  }
];

global.memoryUsers = [];
global.memoryCars = [...initialCars];
global.memoryBookings = [];

// Flag indicating if memory DB fallback is in active use
global.useMemoryDB = false; // Let Mongoose buffer commands until connected or explicitly failed

console.log("Memory DB Fallback Initialized with 6 Premium Cars.");

module.exports = {
  initialCars
};
