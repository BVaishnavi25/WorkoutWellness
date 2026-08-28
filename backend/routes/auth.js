const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDB, writeDB } = require('../utils/db');

const router = express.Router();

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

router.post('/signup', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.find((u) => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const user = {
    id: 'u_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    name,
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(password, 10),
    fitnessLevel: 'beginner',
    conditions: [],
    history: [],
    stats: {
      heartRate: 0,
      caloriesBurned: 0,
      exerciseMin: 0,
      exerciseGoal: 45,
      streakDays: 0,
      streakLabel: 'No streak yet',
    },
    consistency: [],
    totalWorkouts: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  writeDB(db);

  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const db = readDB();
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.users.find((u) => u.email === normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

module.exports = router;
