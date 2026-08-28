const express = require('express');
const { readDB, writeDB } = require('../utils/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/workouts/sync — log a completed session (mirrors the frontend's syncSession())
router.post('/sync', requireAuth, (req, res) => {
  const { name, reps, minutes, calories } = req.body || {};
  if (!name || minutes === undefined) {
    return res.status(400).json({ error: 'name and minutes are required.' });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const entry = {
    name,
    reps: reps || 0,
    minutes,
    calories: calories || Math.round((minutes / 60) * 7 * 60),
    ts: Date.now(),
    when: new Date().toLocaleString(),
  };

  user.history = user.history || [];
  user.history.unshift(entry);
  user.totalWorkouts = (user.totalWorkouts || 0) + 1;
  user.stats = user.stats || {};
  user.stats.caloriesBurned = (user.stats.caloriesBurned || 0) + entry.calories;
  user.stats.exerciseMin = (user.stats.exerciseMin || 0) + minutes;

  writeDB(db);
  res.status(201).json(entry);
});

// GET /api/workouts/history?range=daily|weekly|monthly
router.get('/history', requireAuth, (req, res) => {
  const db = readDB();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const range = req.query.range || 'all';
  const history = user.history || [];
  const now = new Date();

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const startOfWeek = (d) => {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  };

  let filtered = history;
  if (range === 'daily') {
    filtered = history.filter((h) => isSameDay(new Date(h.ts), now));
  } else if (range === 'weekly') {
    const start = startOfWeek(now);
    filtered = history.filter((h) => new Date(h.ts) >= start);
  } else if (range === 'monthly') {
    filtered = history.filter((h) => {
      const d = new Date(h.ts);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }

  const totals = filtered.reduce(
    (acc, h) => ({
      workouts: acc.workouts + 1,
      minutes: acc.minutes + (h.minutes || 0),
      reps: acc.reps + (h.reps || 0),
      calories: acc.calories + (h.calories || 0),
    }),
    { workouts: 0, minutes: 0, reps: 0, calories: 0 }
  );

  res.json({ range, totals, entries: filtered });
});

module.exports = router;
