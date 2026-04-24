const { auth } = require('../firebase');

/**
 * Verifies the Firebase ID token in the Authorization header.
 * On success, attaches the decoded token to req.user.
 */
async function verifyToken(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = header.split(' ')[1];
    const decoded = await auth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
  }
}

module.exports = { verifyToken };
