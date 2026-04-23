const postService = require('../services/postService');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');
const asyncHandler = require('../utils/asyncHandler');

// ✅ Create Post
exports.createPost = asyncHandler(async (req, res) => {
  const post = await postService.createPost(req.body, req.user._id);

  res.status(statusCodes.CREATED).json({
    success: true,
    message: messages.POST_CREATED,
    // data: post,
  });
});


// ✅ Feed API
exports.getFeed = asyncHandler(async (req, res) => {
  const result = await postService.getFeed(req.query, req.user._id);

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FEED_FETCHED,
    ...result, // 🔥 flatten response (no nesting)
  });
});

exports.getUserPosts = asyncHandler(async (req, res) => {
  const { userId } = req.params; // 🔥 from URL

  const result = await postService.getUserPosts(
    req.query,
    userId,
    req.user._id // current logged-in user
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.USER_POSTS_FETCHED,
    ...result,
  });
});