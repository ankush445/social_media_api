const User = require('../models/User');
const Post = require('../models/post');
const Like = require('../models/like');
const Comment = require('../models/comment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const ApiError = require('../utils/appError'); // 🔥 fix name
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');

// 🔐 Token Generator (reuse)
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// ✅ Signup
exports.signup = async (data) => {
  const { email, password, name } = data;

  if (!email || !password || !name) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.REQUIRED_FIELDS);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.EMAIL_EXISTS);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // 🔥 generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  // save refresh token
  user.refreshToken = refreshToken;
  await user.save();

  // clean response
  user.password = undefined;
  user.__v = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

// ✅ Login
exports.login = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.INVALID_CREDENTIALS);
  }

  // 🔥 generate tokens
  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  user.password = undefined;
  user.__v = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

// ✅ Get Users
exports.getUsers = async (query) => {
  const {
    search = '',
    sortBy = 'createdAt',
    order = 'desc',
    limit = 10,
    cursor,
  } = query;

  const searchFilter = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ],
      }
    : {};

  const cursorFilter = cursor
    ? { _id: { $gt: new mongoose.Types.ObjectId(cursor) } } // 🔥 fix
    : {};

  const finalFilter = {
    ...searchFilter,
    ...cursorFilter,
  };

  const sortOrder = order === 'asc' ? 1 : -1;

  const users = await User.find(finalFilter)
    .select('-password -__v -refreshToken') // 🔥 secure
    .sort({ [sortBy]: sortOrder })
    .limit(parseInt(limit));

  return {
    users,
    nextCursor: users.length > 0 ? users[users.length - 1]._id : null,
    hasMore: users.length === parseInt(limit),
  };
};

// ✅ My Profile with Posts
exports.getMyProfileWithPosts = async (userId) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: 'posts',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$userId', '$$userId'] },
            },
          },
          {
            $project: {
              __v: 0,
            },
          },
        ],
        as: 'posts',
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        posts: 1,
      },
    },
  ]);

  if (!user.length) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  return user[0];
};

// ✅ Users with Posts
exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  await Post.deleteMany({ userId: id });
  await Like.deleteMany({ userId: id });
  await Comment.deleteMany({ userId: id });

  return user;
};