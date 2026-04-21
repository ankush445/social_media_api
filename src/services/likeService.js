const Like = require('../models/like');
// const ApiError = require('../utils/appError');
// const statusCodes = require('../constants/statusCodes');

exports.toggleLike = async (postId, userId) => {
  const existing = await Like.findOne({ postId, userId });

  if (existing) {
    await Like.deleteOne({ _id: existing._id });
    return { liked: false };
  }

  await Like.create({ postId, userId });
  return { liked: true };
};