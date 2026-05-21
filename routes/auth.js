const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const verifyToken = require('../middleware/auth');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }

    // Server-side Password Validation
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    if (!hasUppercase || !hasLowercase || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must have an uppercase letter, a lowercase letter, and be at least 6 characters.',
      });
    }

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const existingUser = global.memoryUsers.find(u => u.email === email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        _id: 'user_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name,
        email,
        photoURL: photoURL || '',
        password: hashedPassword,
      };

      global.memoryUsers.push(newUser);
      return res.status(201).json({
        success: true,
        message: 'Registration successful! Please login.',
      });
    }
    // --------------------------

    // Check if user already exists in real MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      name,
      email,
      photoURL: photoURL || '',
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please login.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter both email and password.' });
    }

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      const user = global.memoryUsers.find(u => u.email === email);
      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid email or password.' });
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
        process.env.JWT_SECRET || 'drivefleet_secret_key_123',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          dateOfBirth: user.dateOfBirth || '',
          phone: user.phone || ''
        },
      });
    }
    // --------------------------

    // Check user in real MongoDB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
      process.env.JWT_SECRET || 'drivefleet_secret_key_123',
      { expiresIn: '7d' }
    );

    // Store in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || ''
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
});

// Google Login Simulation
router.post('/google-login', async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Invalid user data from Google.' });
    }

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      let user = global.memoryUsers.find(u => u.email === email);
      if (!user) {
        user = {
          _id: 'user_' + Date.now() + Math.random().toString(36).substr(2, 5),
          name,
          email,
          photoURL: photoURL || '',
          password: 'google_oauth_dummy_hashed_password',
        };
        global.memoryUsers.push(user);
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
        process.env.JWT_SECRET || 'drivefleet_secret_key_123',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Logged in with Google successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          dateOfBirth: user.dateOfBirth || '',
          phone: user.phone || ''
        },
      });
    }
    // --------------------------

    // Check if user exists in real MongoDB
    let user = await User.findOne({ email });
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10) + 'A1a';
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      user = new User({
        name,
        email,
        photoURL: photoURL || '',
        password: hashedPassword,
      });
      await user.save();
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
      process.env.JWT_SECRET || 'drivefleet_secret_key_123',
      { expiresIn: '7d' }
    );

    // Store in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Logged in with Google successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || ''
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error during Google login.' });
  }
});

// Update User Profile & Settings
router.put('/update-profile', verifyToken, async (req, res) => {
  try {
    const { name, email, photoURL, dateOfBirth, phone } = req.body;

    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      let user = global.memoryUsers.find(u => u._id === req.user.id);
      if (!user) {
        // Self-Healing: If user is logged in via JWT but server restarted and wiped memory, automatically restore them!
        user = {
          _id: req.user.id,
          name: req.user.name || 'User',
          email: req.user.email,
          photoURL: req.user.photoURL || '',
          password: 'google_oauth_dummy_hashed_password',
          dateOfBirth: '',
          phone: '',
        };
        global.memoryUsers.push(user);
      }

      // Check email uniqueness in memory
      if (email && email !== user.email) {
        const emailExists = global.memoryUsers.some(u => u.email === email && u._id !== req.user.id);
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email is already taken by another account.' });
        }
        user.email = email;
      }

      if (name) user.name = name;
      if (photoURL !== undefined) user.photoURL = photoURL;
      if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
      if (phone !== undefined) user.phone = phone;

      // Re-sign token with updated info
      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
        process.env.JWT_SECRET || 'drivefleet_secret_key_123',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Profile updated successfully!',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          dateOfBirth: user.dateOfBirth || '',
          phone: user.phone || ''
        }
      });
    }
    // --------------------------

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check email uniqueness in MongoDB
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email is already taken by another account.' });
      }
      user.email = email;
    }

    if (name) user.name = name;
    if (photoURL !== undefined) user.photoURL = photoURL;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Re-sign token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, photoURL: user.photoURL },
      process.env.JWT_SECRET || 'drivefleet_secret_key_123',
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        dateOfBirth: user.dateOfBirth || '',
        phone: user.phone || ''
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error updating profile.' });
  }
});

// Get current logged-in user profile (for reloading protection)
router.get('/me', verifyToken, async (req, res) => {
  try {
    // --- MEMORY DB FALLBACK ---
    if (global.useMemoryDB) {
      let user = global.memoryUsers.find(u => u._id === req.user.id);
      if (!user) {
        // Self-Healing: Restructure memory object on the fly from cookie JWT payload
        user = {
          _id: req.user.id,
          name: req.user.name || 'User',
          email: req.user.email,
          photoURL: req.user.photoURL || '',
          password: 'google_oauth_dummy_hashed_password',
          dateOfBirth: '',
          phone: '',
        };
        global.memoryUsers.push(user);
      }
      return res.status(200).json({
        success: true,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          dateOfBirth: user.dateOfBirth || '',
          phone: user.phone || ''
        }
      });
    }
    // --------------------------

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error retrieving user profile.' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ success: true, message: 'Logged out successfully!' });
});

module.exports = router;
