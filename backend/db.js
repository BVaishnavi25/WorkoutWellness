// Lightweight JSON-file "database". Good enough for a demo/starter backend
// without requiring MongoDB/Postgres to be installed — swap this module out
// for a real driver (e.g. Mongoose) later without touching the routes, since
// every route only calls readDB()/writeDB().
const fs = require('fs');
const path = require('path');

const DB_FILE = process.env.DB_FILE
  ? path.resolve(__dirname, '..', process.env.DB_FILE)
  : path.resolve(__dirname, '..', 'data', 'db.json');

function readDB() {
  const raw = fs.readFileSync(DB_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readDB, writeDB, DB_FILE };
