const likeService = require('../services/likeService');
const asyncHandler = require('../utils/asyncHandler');
const statusCodes = require('../constants/statusCodes');

exports.toggleLike = asyncHandler(async (req, res) => {
  const result = await likeService.toggleLike(
    req.params.postId,
    req.user._id
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    ...result,
  });
});

