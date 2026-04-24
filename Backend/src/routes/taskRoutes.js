const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');
const redisClient = require('../redis');

const cacheKey = (uid) => `tasks:${uid}`;

// GET /api/tasks — user-scoped, Redis-cached
router.get('/tasks', verifyToken, async (req, res) => {
  try {
    const key = cacheKey(req.user.uid);
    const cached = await redisClient.get(key).catch(() => null);
    if (cached) return res.json(JSON.parse(cached));

    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_uid = $1 ORDER BY created_at DESC',
      [req.user.uid]
    );

    await redisClient.setEx(key, 300, JSON.stringify(result.rows)).catch(() => null);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks — create a task for the authenticated user
router.post('/tasks', verifyToken, async (req, res) => {
  try {
    const { title, xp_reward, priority = 'MEDIUM' } = req.body;
    const result = await pool.query(
      `INSERT INTO tasks (user_uid, title, xp_reward, priority, status, progress, created_at)
       VALUES ($1, $2, $3, $4, 'PENDING', '0%', NOW()) RETURNING *`,
      [req.user.uid, title, xp_reward, priority]
    );
    await redisClient.del(cacheKey(req.user.uid)).catch(() => null);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/tasks/:id — toggle completion status
router.put('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const progress = status === 'COMPLETED' ? '100%' : '50%';
    const result = await pool.query(
      `UPDATE tasks SET status = $1, progress = $2
       WHERE id = $3 AND user_uid = $4 RETURNING *`,
      [status, progress, req.params.id, req.user.uid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await redisClient.del(cacheKey(req.user.uid)).catch(() => null);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/tasks/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM tasks WHERE id = $1 AND user_uid = $2 RETURNING id',
      [req.params.id, req.user.uid]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    await redisClient.del(cacheKey(req.user.uid)).catch(() => null);
    res.json({ message: 'Task deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
