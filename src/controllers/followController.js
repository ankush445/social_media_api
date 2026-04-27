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
      action === 'accepted'
        ? messages.FOLLOW_ACCEPTED
        : messages.FOLLOW_REJECTED,
  });
});

// ✅ Followers
exports.getFollowers = asyncHandler(async (req, res) => {
  const data = await followService.getFollowers(req.user._id);

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOWERS_FETCHED,
    data,
  });
});

// ✅ Following
exports.getFollowing = asyncHandler(async (req, res) => {
  const data = await followService.getFollowing(req.user._id);

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.FOLLOWING_FETCHED,
    data,
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