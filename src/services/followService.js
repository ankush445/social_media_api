const Follow = require('../models/follow');
const ApiError = require('../utils/appError');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');

const mongoose = require('mongoose');


// ✅ Send Follow Request
exports.sendFollowRequest = async (userId, targetUserId) => {
if (userId.toString() === targetUserId.toString()) {
        throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.YOU_CANNOT_FOLLOW_YOURSELF
    );
  }

  const existing = await Follow.findOne({
    requester: userId,
    recipient: targetUserId,
  });

  if (existing) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.FOLLOW_REQUEST_ALREADY_SENT
    );
  }

  return await Follow.create({
    requester: userId,
    recipient: targetUserId,
  });
};

// ✅ Accept / Reject
exports.respondFollowRequest = async (userId, requestId, action) => {
if (!action) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.INVALID_ACTION
    );
  }

  const follow = await Follow.findById(requestId);

  if (!follow) {
    throw new ApiError(
      statusCodes.NOT_FOUND,
      messages.FOLLOW_NOT_FOUND
    );
  }

  if (follow.recipient.toString() !== userId.toString()) {
    throw new ApiError(
      statusCodes.FORBIDDEN || 403,
      messages.NOT_AUTHORIZED
    );
  }

  if (!['accepted', 'rejected'].includes(action)) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.INVALID_ACTION
    );
  }

  follow.status = action;
  await follow.save();

  return follow;
};

// ✅ Pending Requests
exports.getFollowRequests = async (userId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const filter = {
    recipient: userId,
    status: 'pending',
  };

  // 🧠 cursor filter (createdAt based)
  if (cursor) {
    filter.createdAt = { $lt: new Date(cursor) };
  }

  const requests = await Follow.find(filter)
    .sort({ createdAt: -1 }) // latest first
    .limit(limit)
    .select('-__v')
    .populate('requester', 'name username')
    .lean(); // 🔥 important

  return {
    data: requests,
    nextCursor:
      requests.length > 0
        ? requests[requests.length - 1].createdAt
        : null,
    hasMore: requests.length === limit,
  };
};

// ✅ Stats
exports.getFollowStats = async (userId) => {
  const followers = await Follow.countDocuments({
    recipient: userId,
    status: 'accepted',
  });

  const following = await Follow.countDocuments({
    requester: userId,
    status: 'accepted',
  });

  return { followers, following };
};

exports.unfollowUser = async (userId, targetUserId) => {
  const follow = await Follow.findOne({
    requester: userId,
    recipient: targetUserId,
    status: 'accepted',
  });

  if (!follow) {
    throw new ApiError(
      statusCodes.NOT_FOUND,
      messages.FOLLOW_NOT_FOUND
    );
  }

  await follow.deleteOne();

  return true;
};

exports.cancelFollowRequest = async (userId, targetUserId) => {
  const follow = await Follow.findOne({
    requester: userId,
    recipient: targetUserId,
    status: 'pending',
  });

  if (!follow) {
    throw new ApiError(
      statusCodes.NOT_FOUND,
      messages.FOLLOW_NOT_FOUND
    );
  }

  await follow.deleteOne();

  return true;
};

// 🔥 COMMON FUNCTION (reuse)
// 🔥 COMMON FUNCTION (UPDATED)
const buildRelationLookup = (currentId, type) => [
    // 🔥 my relation (accepted + pending)
  {
    $lookup: {
      from: 'follows',
      let: { userId: '$user._id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$requester', currentId] },
                { $eq: ['$recipient', '$$userId'] },
              ],
            },
          },
        },
      ],
      as: 'myRelation',
    },
  },

  // 🔥 this user follows current user (only accepted)
  {
    $lookup: {
      from: 'follows',
      let: { userId: '$user._id' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$requester', '$$userId'] },
                { $eq: ['$recipient', currentId] },
                { $eq: ['$status', 'accepted'] },
              ],
            },
          },
        },
      ],
      as: 'isFollower',
    },
  },

  // 🔥 extract my status
  {
    $addFields: {
      myStatus: {
        $ifNull: [{ $arrayElemAt: ['$myRelation.status', 0] }, null],
      },
    },
  },

  // 🔥 FINAL RELATION LOGIC
{
  $addFields: {
    relationType: {
      $switch: {
        branches: [
          {
            case: {
              $and: [
                { $eq: ['$myStatus', 'accepted'] },
                { $gt: [{ $size: '$isFollower' }, 0] },
              ],
            },
            then: 'mutual',
          },
          {
            case: { $eq: ['$myStatus', 'pending'] },
            then: 'pending',
          },
          {
            case: { $eq: ['$myStatus', 'accepted'] },
            then: 'following',
          },
          {
            case: { $gt: [{ $size: '$isFollower' }, 0] },
            then: 'follower',
          },
        ],
        default: type === 'followers' ? 'follower' : 'following',
      },
    },
  },
}
];
// ✅ FOLLOWERS API
exports.getFollowers = async (targetUserId, currentUserId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;
  const search = query.search || '';

  const targetId = new mongoose.Types.ObjectId(targetUserId);
  const currentId = new mongoose.Types.ObjectId(currentUserId);

  const cursorFilter = cursor
    ? { createdAt: { $lt: new Date(cursor) } }
    : {};

  const searchFilter = search
    ? {
        $or: [
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.username': { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const data = await Follow.aggregate([
    {
      $match: {
        recipient: targetId,
        status: 'accepted',
        ...cursorFilter,
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'requester',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    { $match: searchFilter },

...buildRelationLookup(currentId, 'followers'),
    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        username: '$user.username',
        relationType: 1,
        createdAt: 1,
      },
    },

    { $sort: { createdAt: -1 } },
    { $limit: limit },
  ]);

  return {
    data,
    nextCursor:
      data.length > 0 ? data[data.length - 1].createdAt : null,
    hasMore: data.length === limit,
  };
};

// ✅ FOLLOWING API
exports.getFollowing = async (targetUserId, currentUserId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;
  const search = query.search || '';

  const targetId = new mongoose.Types.ObjectId(targetUserId);
  const currentId = new mongoose.Types.ObjectId(currentUserId);

  const cursorFilter = cursor
    ? { createdAt: { $lt: new Date(cursor) } }
    : {};

  const searchFilter = search
    ? {
        $or: [
          { 'user.name': { $regex: search, $options: 'i' } },
          { 'user.username': { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const data = await Follow.aggregate([
    {
      $match: {
        requester: targetId,
        status: 'accepted',
        ...cursorFilter,
      },
    },

    {
      $lookup: {
        from: 'users',
        localField: 'recipient',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    { $match: searchFilter },

    ...buildRelationLookup(currentId, 'following'),

    {
      $project: {
        _id: '$user._id',
        name: '$user.name',
        username: '$user.username',
        relationType: 1,
        createdAt: 1,
      },
    },

    { $sort: { createdAt: -1 } },
    { $limit: limit },
  ]);

  return {
    data,
    nextCursor:
      data.length > 0 ? data[data.length - 1].createdAt : null,
    hasMore: data.length === limit,
  };
};

// ✅ Remove follower
exports.removeFollower = async (currentUserId, followerId) => {
  const currentId = new mongoose.Types.ObjectId(currentUserId);
  const followerObjectId = new mongoose.Types.ObjectId(followerId);

  // 🔍 check follow exists
  const follow = await Follow.findOne({
    requester: followerObjectId,
    recipient: currentId,
    status: 'accepted',
  });

  if (!follow) {
    throw new ApiError(
      statusCodes.NOT_FOUND,
      messages.FOLLOW_NOT_FOUND
    );
  }

  // ❌ remove relation
  await Follow.deleteOne({ _id: follow._id });

  return;
};