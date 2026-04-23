const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    sparse: true, // 🔥 IMPORTANT
    lowercase: true,
    trim: true,
    minlength: 3,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Invalid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  refreshToken: {
  type: String,
},
resetPasswordToken: {
  type: String,
},
resetPasswordExpire: {
  type: Date,
},
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', userSchema);