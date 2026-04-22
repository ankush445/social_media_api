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

  const { postId } = req.params;
  const result = await commentService.getComments(
    postId,
    req.user._id,
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    data: result.data,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

exports.getReplies = asyncHandler(async (req, res) => {

  const { commentId } = req.params;
  const result = await commentService.getReplies(
    commentId,
    req.user._id,
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    data: result.data,
    nextCursor: result.nextCursor,
    hasMore: result.hasMore,
  });
});

exports.toggleLike = asyncHandler(async (req, res) => {

  const { commentId } = req.params;

  const result = await commentService.toggleLikeComment(
    commentId,
    req.user._id
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    ... result, // { liked: true/false }
  });
});