# DriveFleet Car Rental Platform - API Server

This is the server-side API application for **DriveFleet**, a premium Car Rental Platform. Built using Node.js, Express, MongoDB, and JSON Web Tokens (JWT).

## Features

- **Secure JWT Authentication**: Generates tokens and stores them in secure HTTPOnly cookies.
- **Car Listings CRUD**: Add, read, update, and delete car listings with strict owner-authorization.
- **Regex Search & Filter**: Search cars by name ($regex) and filter by type (SUV, Sedan, Hatchback, etc.).
- **Car Booking System**: Book cars, track booking details, and increment car bookings dynamically using `$inc`.
- **Error Handling**: Custom global error handler ensuring zero server crashes.

## Technologies Used

- **Node.js** & **Express.js** (Server runtime & routing)
- **MongoDB** & **Mongoose** (Database & schema modeling)
- **jsonwebtoken** (Secure user session tokens)
- **cookie-parser** (To read secure HTTPOnly cookies)
- **bcryptjs** (Hashing user passwords)
- **cors** (Cross-origin resource sharing configuration)
- **dotenv** (Protecting credentials)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (enforces password validation)
- `POST /api/auth/login` - Login user and issue HTTPOnly JWT cookie
- `POST /api/auth/google-login` - Google Authentication simulation
- `GET /api/auth/me` - Retrieve current logged-in user profile (private route)
- `POST /api/auth/logout` - Clear JWT cookie

### Cars CRUD
- `GET /api/cars` - Fetch all listings (supports `?search=name` & `?type=SUV` query filters)
- `GET /api/cars/my-cars` - Fetch cars listed by the logged-in user (private route)
- `GET /api/cars/:id` - Fetch single car details
- `POST /api/cars` - Add a new car listing (private route)
- `PUT /api/cars/:id` - Update owned car listing (private route, owner only)
- `DELETE /api/cars/:id` - Delete owned car listing (private route, owner only)

### Bookings
- `POST /api/bookings` - Create a booking (private route, increments `booking_count` using `$inc`)
- `GET /api/bookings` - Fetch all bookings made by logged-in user (private route)

## Getting Started

1. Clone or navigate to the directory:
   ```bash
   cd drivefleet-server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   node index.js
   ```
