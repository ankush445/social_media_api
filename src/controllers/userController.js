const userService = require('../services/userService');
const { CREATED, SUCCESS } = require('../constants/statusCodes');
const messages = require('../constants/messages');
const statusCodes = require('../constants/statusCodes');
const asyncHandler = require('../utils/asyncHandler');
const jwt = require('jsonwebtoken');
const User = require('../models/user');


// ✅ Signup
exports.signup = asyncHandler(async (req, res) => {
  const result = await userService.signup(req.body);

  res.status(CREATED).json({
    success: true,
    message: messages.USER_CREATED,
    data: result, // 🔥 already { user, token }
  });
});

// ✅ Login
exports.login = asyncHandler(async (req, res) => {
  const result = await userService.login(req.body);

  res.status(SUCCESS).json({
    success: true,
    message: messages.LOGIN_SUCCESS, // 🔥 fixed typo
    data: result, // 🔥 cleaner (no manual nesting)
  });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET
  );

  const user = await User.findById(decoded.id);

  if (!user || user.refreshToken !== refreshToken) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const newAccessToken = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }  // Change to '15m' for real apps
  );

  res.json({
    success: true,
    accessToken: newAccessToken,
  });
});
// ✅ Logout
exports.logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  user.refreshToken = null;
  await user.save();

  res.json({ success: true, message: messages.LOGOUT_SUCCESS });
});

exports.checkUsername = asyncHandler(async (req, res) => {
  const { username } = req.query;

  const result = await userService.checkUsernameAvailability(username);

  res.json({
    success: true,
    ...result,
  });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await userService.forgotPassword(email);

  res.json({
    success: true,
    message: messages.FORGOT_PASSWORD_EMAIL_SENT,
    ... result, // 🔥 remove in production
  });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  await userService.resetPassword(token, password);

  res.json({
    success: true,
    message: messages.PASSWORD_RESET_SUCCESS,
  });
});

exports.updateUsername = asyncHandler(async (req, res) => {
  const { username } = req.body;

  const user = await userService.updateUsername(
    req.user._id,
    username
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: messages.USERNAME_UPDATED,
    data: user,
  });
});

// ✅ My Profile
// exports.getMyProfile = asyncHandler(async (req, res) => {
//   const data = await userService.getMyProfileWithPosts(req.user._id);

//   res.status(SUCCESS).json({
//     success: true,
//     message: messages.PROFILE_FETCHED,
//     data,
//   });
// });

// ✅ Get Users (pagination/search)
// exports.getUsers = asyncHandler(async (req, res) => {
//   const result = await userService.getUsers(req.query);

//   res.status(SUCCESS).json({
//     success: true,
//     message: messages.USERS_RETRIEVED,
//     data: result,
//   });
// });

// // ✅ Get Users with Posts
exports.getUserProfile = asyncHandler(async (req, res) => {
  const result = await userService.getUserProfile(
    req.params.userId, // profile user
    req.user._id,      // current user
    req.query
  );

  res.status(statusCodes.SUCCESS).json({
    success: true,
    message: 'Profile fetched successfully',
    ...result,
  });
});

// ✅ Delete User
exports.deleteUser = asyncHandler(async (req, res) => {

  const userId = req.user._id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: messages.USER_NOT_FOUND,
    });
  }

  await userService.deleteUser(userId);

  res.status(200).json({
    success: true,
    message: messages.USER_DELETED,
  });
});

exports.getSuggestedUsers = asyncHandler(async (req, res) => {
  const result = await userService.getSuggestedUsers(
    req.user._id,
    req.query
  );

  res.json({
    success: true,
    message: messages.USERS_RETRIEVED,
    ...result,
  });
});
exports.searchUsers = asyncHandler(async (req, res) => {
  const result = await userService.searchUsers(
    req.user._id,
    req.query
  );

  res.json({
    success: true,
    message: messages.USERS_RETRIEVED,
    ...result,
  });
});