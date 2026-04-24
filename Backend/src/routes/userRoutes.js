const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/users/me
router.get('/users/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE uid = $1', [req.user.uid]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', verifyToken, async (req, res) => {
  const { uid, email } = req.user;
  const { display_name } = req.body;
  
  console.log(`[BACKEND] Creating/Updating user UID: ${uid}`);

  try {
    const query = `
      INSERT INTO users (uid, email, display_name, xp, level)
      VALUES ($1, $2, $3, 0, 1)
      ON CONFLICT (uid) 
      DO UPDATE SET email = EXCLUDED.email 
      RETURNING *;
    `;
    const values = [uid, email || 'no-email@questify.app', display_name || 'Adventurer'];
    const result = await pool.query(query, values);
    
    console.log(`[BACKEND] ✅ User synced successfully: ${uid}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`[BACKEND] ❌ Database error:`, err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/xp — update XP and level
router.put('/users/xp', verifyToken, async (req, res) => {
  try {
    const { xp, level } = req.body;
    const result = await pool.query(
      'UPDATE users SET xp = $1, level = $2 WHERE uid = $3 RETURNING *',
      [xp, level, req.user.uid]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/logout — clear server-side cache on logout
const redisClient = require('../redis');
router.post('/users/logout', verifyToken, async (req, res) => {
  try {
    await redisClient.del(`tasks:${req.user.uid}`).catch(() => null);
    res.json({ message: 'Server-side session cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — admin only, for debugging
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT uid, email, display_name, xp, level FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;