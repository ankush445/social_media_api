const Comment = require('../models/comment');
const ApiError = require('../utils/appError');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');


exports.addComment = async (data, userId) => {
  if (!data) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.COMMENT_TEXT_REQUIRED
    );
  }

  const { text, postId, parentCommentId } = data;

  // ✅ Validations (same style as yours)
  if (!postId) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.POST_ID_REQUIRED
    );
  }

  if (!text) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.COMMENT_TEXT_REQUIRED
    );
  }

  // 🔥 NEW: Reply validation
  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId);

    if (!parent) {
      throw new ApiError(
        statusCodes.NOT_FOUND,
        messages.PARENT_COMMENT_NOT_FOUND
      );
    }

    // Optional: ensure same post
    if (parent.postId.toString() !== postId) {
      throw new ApiError(
        statusCodes.BAD_REQUEST,
        messages.REPLY_TO_DIFFERENT_POST
      );
    }
  }

  // ✅ Create comment or reply
  const comment = await Comment.create({
    text,
    userId,
    postId,
    parentCommentId: parentCommentId || null, // 🔥 key line
  });

  // ✅ Better way (no extra DB query)
  await comment.populate("userId", "name email");

  return comment;
};

exports.getComments = async (postId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const filter = {
    postId,
  };

  // 🧠 Apply cursor filter
  if (cursor) {
    filter.createdAt = {
      $lt: new Date(cursor),
    };
  }

  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 }) // latest first
    .limit(limit)
    .populate('userId', 'name email')
    .select('-__v');

  // 🧠 next cursor
  const nextCursor =
    comments.length > 0
      ? comments[comments.length - 1].createdAt
      : null;

  return {
    comments,
    nextCursor,
    hasMore: comments.length === limit
  };
};

exports.toggleLikeComment = async (commentId, userId) => {

  const existing = await Like.findOne({ commentId, userId });

  if (existing) {
    await existing.deleteOne();

    await Comment.findByIdAndUpdate(commentId, {
      $inc: { likesCount: -1 },
    });

    return { liked: false };
  }

  await Like.create({ commentId, userId });

  await Comment.findByIdAndUpdate(commentId, {
    $inc: { likesCount: 1 },
  });

  return { liked: true };
};