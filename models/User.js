const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  photoURL: {
    type: String,
    default: '',
  },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
