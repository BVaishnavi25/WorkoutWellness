const express = require('express');
const { readDB } = require('../utils/db');

const router = express.Router();

router.get('/', (req, res) => {
  const db = readDB();
  res.json(db.plans);
});

module.exports = router;
