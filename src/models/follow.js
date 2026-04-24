const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// 🔥 prevent duplicate request
followSchema.index({ requester: 1, recipient: 1 }, { unique: true });

module.exports =
  mongoose.models.Follow ||
  mongoose.model('Follow', followSchema);