const User = require('../models/user');
const Post = require('../models/post');
const Like = require('../models/like');
const Comment = require('../models/comment');
const Follow = require('../models/follow');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const crypto = require('crypto');


const ApiError = require('../utils/appError'); // 🔥 fix name
const statusCodes = require('../constants/statusCodes');
const messages = require('../constants/messages');

// 🔐 Token Generator (reuse)
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
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
  const { email, password, name, username } = data;

  if (!email || !password || !name || !username) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.REQUIRED_FIELDS);
  }

  // email check
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.EMAIL_EXISTS);
  }

  // 🔥 username check
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.USERNAME_EXISTS);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    username,
    password: hashedPassword,
  });

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  user.password = undefined;
  user.__v = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

// ✅ Login
exports.login = async (data) => {
  const { email, password } = data;

  const user = await User.findOne({
  $or: [{ email }, { username: email }]
  }).select('+password');

  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.INVALID_CREDENTIALS);
  }
  // 🔥 ensure username exists for old users
  if (!user.username) {
  const base = user.email.split('@')[0];

  let username = base;
  let count = 1;

  while (await User.findOne({ username })) {
    username = `${base}${count}`;
    count++;
  }

  user.username = username;
  await user.save();
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

exports.checkUsernameAvailability = async (username) => {
  if (!username) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.USERNAME_REQUIRED);
  }
  const usernameRegex = /^[a-z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_INVALID
    );
  }

  if (username.length < 3) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_TOO_SHORT
    );
  }
  const user = await User.findOne({ username });

  return {
    available: !user,
  };
};

exports.forgotPassword = async (email) => {
  if (!email) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.EMAIL_REQUIRED);
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  // 🔥 generate token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // 🔒 hash token (store in DB)
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 min

  await user.save({ validateBeforeSave: false });
  // 👉 real app → email bhejte hain
  return {
    resetToken, // 🔥 for testing
  };
};

exports.resetPassword = async (token, password) => {
  console.log('Received token:', token); // 🔥 debug
  if (!token ) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.INVALID_RESET_TOKEN);
  }
  if (!password) {
    throw new ApiError(statusCodes.BAD_REQUEST, messages.PASSWORD_REQUIRED);
  }
  // 🔒 hash incoming token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.INVALID_RESET_TOKEN
    );
  }

  // 🔥 update password
  const hashedPassword = await bcrypt.hash(password, 10);

  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return true;
};

exports.updateUsername = async (userId, username) => {
  if (!username) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_REQUIRED
    );
  }

  username = username.toLowerCase().trim();

  const usernameRegex = /^[a-z0-9_]+$/;

  if (!usernameRegex.test(username)) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_INVALID
    );
  }

  if (username.length < 3) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_TOO_SHORT
    );
  }

  const existing = await User.findOne({ username });

  if (existing && existing._id.toString() !== userId) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.USERNAME_ALREADY_TAKEN
    );
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { username },
    { new: true }
  ).select('-password -refreshToken -__v');

  return user;
};
// ✅ Get Users
// exports.getUsers = async (query) => {
//   const {
//     search = '',
//     sortBy = 'createdAt',
//     order = 'desc',
//     limit = 10,
//     cursor,
//   } = query;

//   const searchFilter = search
//     ? {
//         $or: [
//           { name: { $regex: search, $options: 'i' } },
//           { email: { $regex: search, $options: 'i' } },
//         ],
//       }
//     : {};

//   const cursorFilter = cursor
//     ? { _id: { $gt: new mongoose.Types.ObjectId(cursor) } } // 🔥 fix
//     : {};

//   const finalFilter = {
//     ...searchFilter,
//     ...cursorFilter,
//   };

//   const sortOrder = order === 'asc' ? 1 : -1;

//   const users = await User.find(finalFilter)
//     .select('-password -__v -refreshToken') // 🔥 secure
//     .sort({ [sortBy]: sortOrder })
//     .limit(parseInt(limit));

//   return {
//     users,
//     nextCursor: users.length > 0 ? users[users.length - 1]._id : null,
//     hasMore: users.length === parseInt(limit),
//   };
// };

// // ✅ My Profile with Posts
// exports.getMyProfileWithPosts = async (userId) => {
//   const user = await User.aggregate([
//     {
//       $match: {
//         _id: new mongoose.Types.ObjectId(userId),
//       },
//     },
//     {
//       $lookup: {
//         from: 'posts',
//         let: { userId: '$_id' },
//         pipeline: [
//           {
//             $match: {
//               $expr: { $eq: ['$userId', '$$userId'] },
//             },
//           },
//           {
//             $project: {
//               __v: 0,
//             },
//           },
//         ],
//         as: 'posts',
//       },
//     },
//     {
//       $project: {
//         name: 1,
//         email: 1,
//         posts: 1,
//       },
//     },
//   ]);

//   if (!user.length) {
//     throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
//   }

//   return user[0];
// };

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

exports.getSuggestedUsers = async (userId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 🔥 Step 1: get users I already follow
  const following = await Follow.find({
  requester: userObjectId,
  status: { $in: ['accepted', 'pending'] }, // 🔥 FIX
}).select('recipient');

  const followingIds = following.map(f => f.recipient);

  // include self
  followingIds.push(userObjectId);

  // 🧠 cursor filter
  const cursorFilter = cursor
    ? { _id: { $gt: new mongoose.Types.ObjectId(cursor) } }
    : {};

  const users = await User.aggregate([
    {
      $match: {
        _id: { $nin: followingIds }, // ❌ exclude following
        ...cursorFilter,
      },
    },

    // 🔥 mutual friends (common following)
{
  $lookup: {
    from: 'follows',
    let: { targetUserId: '$_id' },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$recipient', '$$targetUserId'] },
              { $in: ['$requester', followingIds] },
              { $eq: ['$status', 'accepted'] },
            ],
          },
        },
      },

      // 🔥 join user data
      {
        $lookup: {
          from: 'users',
          localField: 'requester',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },

      // 🎯 only required fields
      {
        $project: {
          _id: 0,
          'user._id': 1,
          'user.name': 1,
          'user.username': 1,
        },
      },

      // 🔥 limit to 2 users
      { $limit: 2 },
    ],
    as: 'mutualUsers',
  },
},
{
  $lookup: {
    from: 'follows',
    let: { targetUserId: '$_id' },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$recipient', '$$targetUserId'] },
              { $in: ['$requester', followingIds] },
              { $eq: ['$status', 'accepted'] },
            ],
          },
        },
      },
      { $count: 'count' },
    ],
    as: 'mutualCountData',
  },
},

{
  $addFields: {
    mutualCount: {
      $ifNull: [{ $arrayElemAt: ['$mutualCountData.count', 0] }, 0],
    },
  },
},

 {
  $project: {
    name: 1,
    username: 1,
    mutualCount: 1,
    mutualUsers: '$mutualUsers.user', // 🔥 clean array
  },
},

    {
      $sort: { mutualCount: -1, createdAt: -1 }, // 🔥 better UX
    },

    {
      $limit: limit,
    },
  ]);

  return {
    users,
    nextCursor: users.length > 0 ? users[users.length - 1]._id : null,
    hasMore: users.length === limit,
  };
};

exports.searchUsers = async (userId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;
  const search = query.search || '';

  if (!search) {
    throw new ApiError(
      statusCodes.BAD_REQUEST,
      messages.SEARCH_QUERY_REQUIRED
    );
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);

  // 🧠 cursor
  const cursorFilter = cursor
    ? { _id: { $gt: new mongoose.Types.ObjectId(cursor) } }
    : {};

  const users = await User.aggregate([
    {
      $match: {
        _id: { $ne: userObjectId }, // ❌ exclude self
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ],
        ...cursorFilter,
      },
    },

    // 🔥 relation check (follow status)
    {
      $lookup: {
        from: 'follows',
        let: { targetUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$requester', userObjectId] },
                  { $eq: ['$recipient', '$$targetUserId'] },
                ],
              },
            },
          },
        ],
        as: 'relation',
      },
    },

    {
      $addFields: {
        followStatus: {
          $cond: [
            { $gt: [{ $size: '$relation' }, 0] },
            { $arrayElemAt: ['$relation.status', 0] },
            'none',
          ],
        },
      },
    },

    {
      $project: {
        name: 1,
        username: 1,
        email: 1,
        followStatus: 1, // 🔥 important
      },
    },

    {
      $sort: { createdAt: -1 },
    },

    {
      $limit: limit,
    },
  ]);

  return {
    users,
    nextCursor: users.length > 0 ? users[users.length - 1]._id : null,
    hasMore: users.length === limit,
  };
};