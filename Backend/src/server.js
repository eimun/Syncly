const express = require('express');
const cors = require('cors');
require('dotenv').config();

require('./firebase'); // initialise Firebase Admin once

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Hardened CORS for Web Browser testing
// Permissive CORS for development
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body));
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('Questify Backend is running ✅'));

app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/taskRoutes'));
app.use('/api', require('./routes/xpLogRoutes'));
app.use('/api', require('./routes/inventoryRoutes'));

// DB health-check
const pool = require('./db');
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
