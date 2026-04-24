const express = require('express');
const router = express.Router();
const pool = require('../db');
const { auth } = require('../firebase');

// Middleware: verify Firebase ID token
async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// Get inventory for current user
router.get('/inventory', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM inventory WHERE user_uid = $1',
      [req.user.uid]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add item to inventory
router.post('/inventory', verifyToken, async (req, res) => {
  try {
    const { item_name, quantity } = req.body;
    await pool.query(
      'INSERT INTO inventory (user_uid, item_name, quantity) VALUES ($1, $2, $3)',
      [req.user.uid, item_name, quantity]
    );
    res.json({ message: 'Item added to inventory!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update item quantity
router.put('/inventory/:id', verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    await pool.query(
      'UPDATE inventory SET quantity = $1 WHERE id = $2 AND user_uid = $3',
      [quantity, req.params.id, req.user.uid]
    );
    res.json({ message: 'Inventory updated!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
