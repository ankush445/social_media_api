const commentService = require('../services/commentService');
const asyncHandler = require('../utils/asyncHandler');
const statusCodes = require('../constants/statusCodes');

exports.addComment = asyncHandler(async (req, res) => {

  const comment = await commentService.addComment(
    req.body,
    req.user._id
  );

  res.status(statusCodes.CREATED).json({
    success: true,
    data: comment,
  });
});

exports.getComments = asyncHandler(async (req, res) => {
  const result = await commentService.getComments(
    req.params.postId,
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    data: result.comments,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

exports.toggleLike = asyncHandler(async (req, res) => {

  const result = await commentService.toggleLikeComment(
    req.params.commentId,
    req.user._id
  );

  res.status(200).json({
    success: true,
    data: result,
  });
});