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
exports.getUserProfile = async (profileUserId, reqUserId, query) => {
  const limit = parseInt(query.limit) || 10;
  const cursor = query.cursor;

  const userObjectId = new mongoose.Types.ObjectId(profileUserId);
  const currentUserId = new mongoose.Types.ObjectId(reqUserId);

  // 🔥 1. USER DETAILS
  const user = await User.findById(userObjectId)
    .select('name email username')
    .lean();

  if (!user) {
    throw new ApiError(statusCodes.NOT_FOUND, messages.USER_NOT_FOUND);
  }

  // 🔥 followers count
  const followers = await Follow.countDocuments({
    recipient: userObjectId,
    status: 'accepted',
  });

  // 🔥 following count
  const following = await Follow.countDocuments({
    requester: userObjectId,
    status: 'accepted',
  });

  // 🔥 post count
  const postCount = await Post.countDocuments({
    userId: userObjectId,
  });

  // 🔥 2. FOLLOW STATUS (IMPORTANT 🔥)
  let followStatus = 'none';

if (!userObjectId.equals(currentUserId)) {
  // 🔥 my relation (accepted / pending)
  const myRelation = await Follow.findOne({
    requester: currentUserId,
    recipient: userObjectId,
  }).select('status');

  // 🔥 reverse relation (only accepted)
  const isFollower = await Follow.findOne({
    requester: userObjectId,
    recipient: currentUserId,
    status: 'accepted',
  });

  const myStatus = myRelation?.status || null;

  if (myStatus === 'accepted' && isFollower) {
    followStatus = 'mutual';
  } else if (myStatus === 'pending') {
    followStatus = 'pending';
  } else if (myStatus === 'accepted') {
    followStatus = 'following';
  } else if (isFollower) {
    followStatus = 'follower';
  } else {
    followStatus = 'none';
  }
}

  // 🔥 3. POSTS (Cursor Pagination)
  const postFilter = { userId: userObjectId };

  if (cursor) {
    postFilter.createdAt = { $lt: new Date(cursor) };
  }

const posts = await Post.aggregate([
  {
    $match: postFilter,
  },
  {
    $sort: { createdAt: -1 },
  },
  {
    $limit: limit,
  },

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
                { $eq: ['$userId', currentUserId] },
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

      // 🔥 ADD USER INFO HERE
      user: {
        _id: userObjectId,
        name: user.name,
        username: user.username,
      },
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
      user: 1, // 🔥 include
    },
  },
]);

  return {
    user: {
      ...user,
      followers,
      following,
      postCount,
      followStatus, // 🔥 ADD HERE
    },

    posts,

    nextCursor:
      posts.length > 0
        ? posts[posts.length - 1].createdAt
        : null,

    hasMore: posts.length === limit,
  };
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

  const cursorFilter = cursor
    ? { _id: { $gt: new mongoose.Types.ObjectId(cursor) } }
    : {};

  const users = await User.aggregate([
    {
      $match: {
        _id: { $ne: userObjectId },
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
        ],
        ...cursorFilter,
      },
    },

    // 🔥 my relation (accepted + pending)
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
        as: 'myRelation',
      },
    },

    // 🔥 reverse relation (only accepted)
    {
      $lookup: {
        from: 'follows',
        let: { targetUserId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$requester', '$$targetUserId'] },
                  { $eq: ['$recipient', userObjectId] },
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
        followStatus: {
          $switch: {
            branches: [
              // mutual
              {
                case: {
                  $and: [
                    { $eq: ['$myStatus', 'accepted'] },
                    { $gt: [{ $size: '$isFollower' }, 0] },
                  ],
                },
                then: 'mutual',
              },

              // pending
              {
                case: { $eq: ['$myStatus', 'pending'] },
                then: 'pending',
              },

              // following
              {
                case: { $eq: ['$myStatus', 'accepted'] },
                then: 'following',
              },

              // follower
              {
                case: { $gt: [{ $size: '$isFollower' }, 0] },
                then: 'follower',
              },
            ],
            default: 'none',
          },
        },
      },
    },

    {
      $project: {
        name: 1,
        username: 1,
        email: 1,
        followStatus: 1,
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
    nextCursor:
      users.length > 0 ? users[users.length - 1]._id : null,
    hasMore: users.length === limit,
  };
};