const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/xp_logs — XP history for current user
router.get('/xp_logs', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM xp_logs WHERE users_uid = $1 ORDER BY created_at DESC',
      [req.user.uid]  // FIXED: was req.users.uid
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/xp_logs — add an XP log entry
router.post('/xp_logs', verifyToken, async (req, res) => {
  try {
    const { task_id, xp_earned } = req.body;
    const result = await pool.query(
      'INSERT INTO xp_logs (users_uid, task_id, xp_earned, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [req.user.uid, task_id, xp_earned]  // FIXED: was req.users.uid
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
