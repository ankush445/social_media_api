const Post = require('../models/post');
const ApiError = require('../utils/appError');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');
const mongoose = require('mongoose');


// ✅ Create Post
exports.createPost = async (data, userId) => {
  const { title, content } = data;

  if (!title) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.TITLE_REQUIRED);
  }

  const post = await Post.create({
    title,
    content,
    userId,
  });

  post.__v = undefined; // 🔥 hide __v
  return post;
};

// ✅ Feed API (Cursor + Aggregation)
exports.getFeed = async (query, userId) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;
  const search = query.search || '';

  // 🔍 Search filter
  const searchFilter = search
    ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // 🧠 Cursor filter
  const cursorFilter = cursor
    ? {
        createdAt: {
          $lt: new Date(cursor),
        },
      }
    : {};

  // 🔗 Combine filters
  const finalMatch = {
    ...searchFilter,
    ...cursorFilter,
  };

  const posts = await Post.aggregate([
    {
      $match: finalMatch,
    },

    {
      $sort: { createdAt: -1 },
    },

    {
      $limit: limit,
    },

    // 👤 User join
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // ❤️ Likes
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'postId',
        as: 'likes',
      },
    },

    // 💬 Comments
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'postId',
        as: 'comments',
      },
    },

    // 🔥 isLiked
    {
      $lookup: {
        from: 'likes',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$postId', '$$postId'] },
                  { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                ],
              },
            },
          },
        ],
        as: 'likedByMe',
      },
    },

    {
      $addFields: {
        likeCount: { $size: '$likes' },
        commentCount: { $size: '$comments' },
        isLiked: { $gt: [{ $size: '$likedByMe' }, 0] },
      },
    },

    {
      $project: {
        title: 1,
        content: 1,
        createdAt: 1,
        likeCount: 1,
        commentCount: 1,
        isLiked: 1,
        'user._id': 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
  ]);

  return {
    posts,
    nextCursor:
      posts.length > 0 ? posts[posts.length - 1].createdAt : null,
    hasMore: posts.length === limit,
  };
};

exports.getUserPosts = async (query, profileUserId, currentUserId) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;
  const search = query.search || '';

  // 🔍 Search filter
  const searchFilter = search
    ? {
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  // 🧠 Cursor filter
  const cursorFilter = cursor
    ? {
        createdAt: {
          $lt: new Date(cursor),
        },
      }
    : {};

  // 🔥 USER FILTER (IMPORTANT)
  const userFilter = {
    userId: new mongoose.Types.ObjectId(profileUserId),
  };

  // 🔗 Combine all
  const finalMatch = {
    ...userFilter,
    ...searchFilter,
    ...cursorFilter,
  };

  const posts = await Post.aggregate([
    { $match: finalMatch },

    { $sort: { createdAt: -1 } },

    { $limit: limit },

    // 👤 user join
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // ❤️ likes
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'postId',
        as: 'likes',
      },
    },

    // 💬 comments
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'postId',
        as: 'comments',
      },
    },

    // 🔥 isLiked
    {
      $lookup: {
        from: 'likes',
        let: { postId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$postId', '$$postId'] },
                  {
                    $eq: [
                      '$userId',
                      new mongoose.Types.ObjectId(currentUserId),
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: 'likedByMe',
      },
    },

    {
      $addFields: {
        likeCount: { $size: '$likes' },
        commentCount: { $size: '$comments' },
        isLiked: { $gt: [{ $size: '$likedByMe' }, 0] },
      },
    },

    {
      $project: {
        title: 1,
        content: 1,
        createdAt: 1,
        likeCount: 1,
        commentCount: 1,
        isLiked: 1,
        'user._id': 1,
        'user.name': 1,
        'user.email': 1,
      },
    },
  ]);

  return {
    posts,
    nextCursor:
      posts.length > 0 ? posts[posts.length - 1].createdAt : null,
    hasMore: posts.length === limit,
  };
};