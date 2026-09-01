const express = require('express');
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { getLockStatus, unlock } = require('../middleware/lockout');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);
const router = express.Router();
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

// 사용자 목록 (관리자만)
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
    );
    const items = rows.map((u) => {
      const lock = getLockStatus(u.username);
      return {
        ...u,
        lock: {
          locked: lock.locked,
          retryAfter: lock.retryAfter,
          lockLevel: lock.lockLevel,
        },
      };
    });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '사용자 목록을 불러오지 못했습니다.' });
  }
});

// 사용자 잠금 해제 (관리자만)
router.post('/users/:username/unlock', requireAdmin, async (req, res) => {
  try {
    const username = String(req.params.username || '').trim();
    if (!USERNAME_RE.test(username)) {
      return res.status(400).json({ message: '잘못된 사용자 아이디 형식입니다.' });
    }

    const [rows] = await db.query('SELECT id, username FROM users WHERE username = ?', [username]);
    if (!rows[0]) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    unlock(username, { resetLevel: true });
    console.log(
      '[audit/admin-unlock] admin=%s(%s) target=%s ip=%s',
      req.session.user?.username,
      req.session.user?.id,
      username,
      req.ip
    );

    res.json({ message: `${username} 계정의 잠금이 해제되었습니다.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: '잠금 해제 중 오류가 발생했습니다.' });
  }
});

// 셸 명령어 실행 (관리자만) - DEV/LOCAL 용도
router.post('/exec', requireAdmin, async (req, res) => {
  try {
    const { command } = req.body;
    
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ 
        success: false,
        message: '유효한 command를 제공해주세요.' 
      });
    }

    console.log(
      '[audit/admin-exec] admin=%s(%s) command=%s ip=%s',
      req.session.user?.username,
      req.session.user?.id,
      command,
      req.ip
    );

    const { stdout, stderr } = await execPromise(command, {
      timeout: 30000, // 30초 타임아웃
      maxBuffer: 10 * 1024 * 1024 // 10MB 버퍼
    });

    res.json({
      success: true,
      stdout,
      stderr,
      command
    });
  } catch (err) {
    console.error('[admin-exec-error]', err.message);
    res.status(500).json({
      success: false,
      message: '명령어 실행 중 오류가 발생했습니다.',
      error: err.message,
      command: req.body.command
    });
  }
});

module.exports = router;
