const comment = require("../models/comment");

module.exports = {
  USER_CREATED: 'User created successfully',
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  EMAIL_EXISTS: 'Email already exists',
  SERVER_ERROR: 'Something went wrong',
  NO_TOKEN: 'No token, access denied',
  INVALID_TOKEN: 'Invalid or expired token',
  TOKEN_EXPIRED: 'Token expired, please login again',
  LOGOUT_SUCCESS: 'Logged out successfully',

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

};