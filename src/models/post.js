const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: String,

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // relation
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);