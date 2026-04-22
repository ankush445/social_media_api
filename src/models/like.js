const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Only one like per user per entity
likeSchema.index(
  { userId: 1, postId: 1 },
  {
    unique: true,
    partialFilterExpression: { postId: { $exists: true, $ne: null } }
  }
);

likeSchema.index(
  { userId: 1, commentId: 1 },
  {
    unique: true,
    partialFilterExpression: { commentId: { $exists: true, $ne: null } }
  }
);

module.exports = mongoose.model("Like", likeSchema);