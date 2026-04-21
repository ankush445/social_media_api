const router = require('express').Router();
const commentController = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleWare');

router.post('/add-comment', authMiddleware ,commentController.addComment);
router.get('/:postId', authMiddleware, commentController.getComments);
router.post('/:commentId/like', authMiddleware, commentController.toggleLike);

module.exports = router;