const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
 // 👉 THIS MAKES REPLY SYSTEM
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },

  // 👉 THIS FOR LIKE COUNT
  likesCount: {
    type: Number,
    default: 0,
  }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);