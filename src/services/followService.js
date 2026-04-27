const Follow = require('../models/follow');
const ApiError = require('../utils/appError');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');

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

// ✅ Followers
exports.getFollowers = async (userId) => {
  return await Follow.find({
    recipient: userId,
    status: 'accepted',
  }).populate('requester', 'name username');
};

// ✅ Following
exports.getFollowing = async (userId) => {
  return await Follow.find({
    requester: userId,
    status: 'accepted',
  }).populate('recipient', 'name username');
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