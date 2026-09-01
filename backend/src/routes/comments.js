const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const logger = require('../logger');
const ACTIONS = require('../constants/actions');
const RESULTS = require('../constants/results');

const router = express.Router();

function isAdmin(req) {
  return req.session.user && req.session.user.role === 'ADMIN';
}

router.post('/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const { content } = req.body || {};
    if (!content || !content.trim()) {
      return res.status(400).json({ message: '댓글 내용을 입력하세요.' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: '댓글은 1000자 이하여야 합니다.' });
    }

    const [[post]] = await db.query('SELECT id FROM posts WHERE id = ?', [req.params.postId]);
    if (!post) return res.status(404).json({ message: '게시글이 없습니다.' });

    const [result] = await db.query(
      'INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)',
      [post.id, req.session.user.id, content.trim()]
    );

    logger.info(`USER_ACTION action=${ACTIONS.CREATE_COMMENT} actor_id=${req.session.user.id} actor_name=${req.session.user.username} postId=${post.id} commentId=${result.insertId} result=${RESULTS.SUCCESS} ip=${req.ip}`);
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ message: '댓글 작성 중 오류가 발생했습니다.' });
  }
});

router.delete('/comments/:id', requireAuth, async (req, res) => {
  try {
    const [[comment]] = await db.query('SELECT * FROM comments WHERE id = ?', [req.params.id]);
    if (!comment) return res.status(404).json({ message: '댓글이 없습니다.' });
    if (comment.author_id !== req.session.user.id && !isAdmin(req)) {
      logger.warn(`USER_ACTION action=${ACTIONS.DELETE_COMMENT} actor_id=${req.session.user.id} actor_name=${req.session.user.username} commentId=${comment.id} original_author_id=${comment.author_id} result=${RESULTS.DENIED} ip=${req.ip}`);
      return res.status(403).json({ message: '삭제 권한이 없습니다.' });
    }

    await db.query('DELETE FROM comments WHERE id = ?', [comment.id]);
    logger.info(`USER_ACTION action=${ACTIONS.DELETE_COMMENT} actor_id=${req.session.user.id} actor_name=${req.session.user.username} commentId=${comment.id} original_author_id=${comment.author_id} result=${RESULTS.SUCCESS} ip=${req.ip}`);
    res.json({ message: '삭제했습니다.' });
  } catch (err) {
    logger.error(err.message);
    res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
