const Comment = require('../models/comment');
const Like = require('../models/like');

const ApiError = require('../utils/appError');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');


const formatComment = (comment, options = {}) => {
  return {
    id: comment._id,
    text: comment.text,
    user: comment.userId,
    likeCount: options.likeCount ?? comment.likeCount ?? 0, // 🔥 FIX
    isLiked: options.isLiked || false,
    replyCount: options.replyCount || 0,
     // 🔥 only include when exists
    parentCommentId: comment.parentCommentId || null,
    createdAt: comment.createdAt,
  };
};

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

  await comment.populate("userId", "name email");

// 🔥 return consistent response
return formatComment(comment, {
  isLiked: false,
  replyCount: 0,
});
};

exports.getComments = async (postId, userId, query) => {

  // ✅ Validations (same style as yours)
  if (!postId) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.POST_ID_REQUIRED
    );
  }
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const filter = {
    postId,
    parentCommentId: null,
  };

  if (cursor) {
    filter.createdAt = { $lt: new Date(cursor) };
  }

  const comments = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name")
    .lean();

  const commentIds = comments.map(c => c._id);

  // 🔥 reply count
  const replyCounts = await Comment.aggregate([
    { $match: { parentCommentId: { $in: commentIds } } },
    { $group: { _id: "$parentCommentId", count: { $sum: 1 } } }
  ]);

  const replyMap = {};
  replyCounts.forEach(r => {
    replyMap[r._id.toString()] = r.count;
  });

  // 🔥 get total like counts and self like
const likeCounts = await Like.aggregate([
  { $match: { commentId: { $in: commentIds } } },
  {
    $group: {
      _id: "$commentId",
      count: { $sum: 1 }
    }
  }
]);

const likeMap = {};
likeCounts.forEach(l => {
  likeMap[l._id.toString()] = l.count;
});

// 🔥 likes by current user (for isLiked)
const likes = await Like.find({
  commentId: { $in: commentIds },
  userId
});

const likedSet = new Set(
  likes.map(l => l.commentId.toString())
);

 const formatted = comments.map(c =>
  formatComment(c, {
    isLiked: likedSet.has(c._id.toString()),
    replyCount: replyMap[c._id.toString()] || 0,
    likeCount: likeMap[c._id.toString()] || 0, // 🔥 FIX
  })
);

  const hasMore = comments.length === limit;
  const nextCursor = hasMore
    ? comments[comments.length - 1].createdAt
    : null;

  return { data: formatted, nextCursor, hasMore };
};

exports.getReplies = async (commentId, userId, query) => {
    // ✅ Validations (same style as yours)
  if (!commentId) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.COMMENT_ID_REQUIRED
    );
  }
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const filter = { parentCommentId: commentId };

  if (cursor) {
    filter.createdAt = { $lt: new Date(cursor) };
  }

  const replies = await Comment.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("userId", "name")
    .lean();

  const replyIds = replies.map(r => r._id);



  // 🔥 total like counts
const likeCounts = await Like.aggregate([
  { $match: { commentId: { $in: replyIds } } },
  {
    $group: {
      _id: "$commentId",
      count: { $sum: 1 }
    }
  }
]);

const likeMap = {};
likeCounts.forEach(l => {
  likeMap[l._id.toString()] = l.count;
});

// 🔥 current user likes
const likes = await Like.find({
  commentId: { $in: replyIds },
  userId
});

const likedSet = new Set(
  likes.map(l => l.commentId.toString())
);

 const formatted = replies.map(r =>
  formatComment(r, {
    isLiked: likedSet.has(r._id.toString()),
    likeCount: likeMap[r._id.toString()] || 0, // 🔥 FIX
  })
);

  const hasMore = replies.length === limit;
  const nextCursor = hasMore
    ? replies[replies.length - 1].createdAt
    : null;

  return { data: formatted, nextCursor, hasMore };
};

exports.toggleLikeComment = async (commentId, userId) => {

  if (!commentId) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.COMMENT_ID_REQUIRED
    );
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(
      statusCodes.NOT_FOUND,
      messages.COMMENT_NOT_FOUND
    );
  }

  const existing = await Like.findOne({ commentId, userId });

  if (existing) {
    await existing.deleteOne();

await Comment.findByIdAndUpdate(commentId, {
  $inc: { likeCount: -1 },
  $max: { likeCount: 0 }
});

    return { liked: false };
  }

  await Like.create({ commentId, userId });

  await Comment.findByIdAndUpdate(commentId, {
    $inc: { likeCount: 1 },
  });

  return { liked: true };
};