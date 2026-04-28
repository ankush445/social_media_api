const followService = require('../services/followService');
const asyncHandler = require('../utils/asyncHandler');
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');

// ✅ Send Request
exports.sendFollowRequest = asyncHandler(async (req, res) => {
  await followService.sendFollowRequest(
    req.user._id,
    req.params.userId
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOW_REQUEST_SENT,
  });
});

// ✅ Accept / Reject
exports.respondFollowRequest = asyncHandler(async (req, res) => {
  await followService.respondFollowRequest(
    req.user._id,
    req.params.requestId,
    req.body.action
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message:
      req.body.action === 'accepted'
        ? messages.FOLLOW_ACCEPTED
        : messages.FOLLOW_REJECTED,
  });
});

// ✅ Requests
exports.getFollowRequests = asyncHandler(async (req, res) => {
  const result = await followService.getFollowRequests(
    req.user._id,
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOW_REQUESTS_FETCHED,
    ...result,
  });
});

// ✅ Stats
exports.getFollowStats = asyncHandler(async (req, res) => {
  const data = await followService.getFollowStats(req.user._id);

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOW_STATS_FETCHED,
    data,
  });
});


exports.unfollowUser = asyncHandler(async (req, res) => {
  await followService.unfollowUser(
    req.user._id,
    req.params.userId
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.UNFOLLOW_SUCCESS,
  });
});

exports.cancelFollowRequest = asyncHandler(async (req, res) => {
  await followService.cancelFollowRequest(
    req.user._id,
    req.params.userId
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOW_REQUEST_CANCELLED,
  });
});

// ✅ Following
exports.getFollowing = asyncHandler(async (req, res) => {
  const result = await followService.getFollowing(
    req.params.userId,   // 🔥 target user
    req.user._id,        // 🔥 current user
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOWING_FETCHED,
    ...result,
  });
});

// ✅ Followers
exports.getFollowers = asyncHandler(async (req, res) => {
  const result = await followService.getFollowers(
    req.params.userId,   // 🔥 target user
    req.user._id,        // 🔥 current user
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOWERS_FETCHED,
    ...result,
  });
});

// ✅ Remove follower
exports.removeFollower = asyncHandler(async (req, res) => {
  await followService.removeFollower(
    req.user._id,
    req.params.followerId
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOWER_REMOVED,
  });
});