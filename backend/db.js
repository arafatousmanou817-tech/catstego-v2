let db;
try {
  const Database = require('better-sqlite3');
  const path = require('path');
  require('dotenv').config();

  const dbPath = process.env.DB_PATH || './catstego.db';
  db = new Database(path.resolve(dbPath));

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#FF6B35',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      contact_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (contact_id) REFERENCES users(id),
      UNIQUE(user_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
  `);

  console.log('✅ Base de données SQLite initialisée');
} catch (err) {
  console.error('❌ ERREUR CRITIQUE - Impossible d\'initialiser SQLite:', err.message);
  console.error(err.stack);
  process.exit(1);
}

module.exports = db;
