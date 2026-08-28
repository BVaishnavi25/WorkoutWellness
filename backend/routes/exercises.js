const express = require('express');
const { readDB } = require('../utils/db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.exercises);
});

router.get('/:id', (req, res) => {
  const db = readDB();
  const ex = db.exercises.find((e) => e.id === Number(req.params.id));
  if (!ex) return res.status(404).json({ error: 'Exercise not found.' });
  res.json(ex);
});

module.exports = router;
