const router = require('express').Router();
const authMiddleware = require('../middleware/authMiddleware');
const likeController = require('../controllers/likeController');

router.post('/:postId', authMiddleware, likeController.toggleLike);

module.exports = router;