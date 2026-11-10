const router = require('express').Router();
const userMiddleware = require('../middleware/userMiddleware');
const { addBookmark, deleteBookmark, getBookmarks } = require('../controllers/userBookmark');

router.use(userMiddleware);
router.get('/', userMiddleware, getBookmarks);
router.post('/:problemId', userMiddleware, addBookmark);
router.delete('/:problemId', userMiddleware, deleteBookmark);
module.exports = router;
