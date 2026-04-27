const comment = require("../models/comment");

module.exports = {
  USER_CREATED: 'User created successfully',
  USER_NOT_FOUND: 'User not found',
  USERNAME_EXISTS: 'Username already exists',
  USERNAME_REQUIRED: 'Username is required',
  USERNAME_INVALID: 'Username can only contain letters, numbers and underscore',
  USERNAME_TOO_SHORT: 'Username must be at least 3 characters',
  USERNAME_ALREADY_TAKEN: 'Username already taken',
  USERNAME_UPDATED: 'Username updated successfully',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  SERVER_ERROR: 'Something went wrong',
  NO_TOKEN: 'No token, access denied',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token expired, please login again',
  LOGOUT_SUCCESS: 'Logged out successfully',
  EMAIL_REQUIRED: 'Email is required',
  FORGOT_PASSWORD_EMAIL_SENT: 'Reset password link sent',
INVALID_RESET_TOKEN: 'Invalid or expired reset token',
PASSWORD_RESET_SUCCESS: 'Password reset successful',
PASSWORD_REQUIRED: 'Password is required',

  // For userService
  EMAIL_EXISTS: 'Email already exists',
  REQUIRED_FIELDS: 'Email, password and name are required',

  // For UserController
  LOGIN_SUCCESS: 'Login successful',
  PROFILE_FETCHED: 'Profile fetched successfully',
  USERS_RETRIEVED: 'Users retrieved successfully',
  USER_DELETED: 'User deleted successfully',
  USERS_WITH_POSTS_FETCHED: 'Users with posts fetched successfully',

  // For PostController
  POST_CREATED: 'Post created successfully',
  POST_NOT_FOUND: 'Post not found',
  POST_DELETED: 'Post deleted successfully',
  FEED_FETCHED: 'Posts fetched successfully',
  USER_POSTS_FETCHED: 'User posts fetched successfully',

  // For PostService
  POST_NOT_FOUND: 'Post not found',
  TITLE_REQUIRED: 'Title is required',

  //  For CommentService
  COMMENT_ADDED: 'Comment added successfully',
  COMMENT_NOT_FOUND: 'Comment not found',
  COMMENT_TEXT_REQUIRED: 'Comment text is required',
  POST_ID_REQUIRED: 'Post ID is required',
  PARENT_COMMENT_NOT_FOUND: 'Parent comment not found',
  REPLY_TO_DIFFERENT_POST: 'Cannot reply to a comment from a different post',
  COMMENT_ID_REQUIRED: 'Comment ID is required',

  // Follow Service
    FOLLOW_REQUEST_SENT: 'Follow request sent',
  FOLLOW_REQUEST_ALREADY_SENT: 'Follow request already sent',
  FOLLOW_ACCEPTED: 'Follow request accepted',
  FOLLOW_REJECTED: 'Follow request rejected',
  FOLLOW_NOT_FOUND: 'Follow request not found',
  NOT_AUTHORIZED: 'Not authorized',
  FOLLOWERS_FETCHED: 'Followers fetched successfully',
  FOLLOWING_FETCHED: 'Following fetched successfully',
  FOLLOW_REQUESTS_FETCHED: 'Follow requests fetched successfully',
  YOU_CANNOT_FOLLOW_YOURSELF: 'You cannot follow yourself',
  INVALID_ACTION: 'Invalid action',
  FOLLOW_STATS_FETCHED: 'Follow stats fetched successfully',
  UNFOLLOW_SUCCESS: 'Unfollowed successfully',
  FOLLOW_REQUEST_CANCELLED: 'Follow request cancelled',
  SEARCH_QUERY_REQUIRED: 'Search query is required',
};