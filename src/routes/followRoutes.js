const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const authMiddleware = require('../middleware/authMiddleware');

// 🔥 Send follow request
router.post(
  '/:userId',
  authMiddleware,
  followController.sendFollowRequest
);

// 🔥 Accept / Reject
router.put(
  '/respond/:requestId',
  authMiddleware,
  followController.respondFollowRequest
);

// 🔥 Followers
router.get(
  '/followers',
  authMiddleware,
  followController.getFollowers
);

// 🔥 Following
router.get(
  '/following',
  authMiddleware,
  followController.getFollowing
);

// 🔥 Pending requests
router.get(
  '/requests',
  authMiddleware,
  followController.getFollowRequests
);

// 🔥 Stats
router.get(
  '/stats',
  authMiddleware,
  followController.getFollowStats
);

// 🔥 Unfollow
router.delete(
  '/unfollow/:userId',
  authMiddleware,
  followController.unfollowUser
);

// 🔥 Cancel request
router.delete(
  '/cancel/:userId',
  authMiddleware,
  followController.cancelFollowRequest
);

module.exports = router;