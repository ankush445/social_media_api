const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
}
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);