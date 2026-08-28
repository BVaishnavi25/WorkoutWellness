const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

router.get('/me', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json(publicUser(user));
});

router.put('/me', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const allowed = ['name', 'fitnessLevel', 'conditions', 'stats'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) user[key] = req.body[key];
  }

  writeDB(db);
  res.json(publicUser(user));
});

module.exports = router;
