require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  try {
    const queries = [
      // 1. Tables de base
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar_color TEXT DEFAULT '#FF6B35',
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      // 2. Migrations (Colonnes manquantes)
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP',
      // 3. Autres tables
      `CREATE TABLE IF NOT EXISTS contacts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          contact_id INTEGER NOT NULL REFERENCES users(id),
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, contact_id)
        )`,
      `CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          sender_id INTEGER NOT NULL REFERENCES users(id),
          receiver_id INTEGER NOT NULL REFERENCES users(id),
          content TEXT NOT NULL,
          type TEXT DEFAULT 'text',
          is_read INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        )`,
      `CREATE TABLE IF NOT EXISTS push_subscriptions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id),
          endpoint TEXT NOT NULL,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, endpoint)
        )`,
      `CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id)`,
      `CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read)`
    ];

    for (const query of queries) {
      await pool.query(query).catch(err => {
        // Ignorer les erreurs d'index ou de colonnes déjà existantes selon le driver
        if (!err.message.includes('already exists')) {
          console.warn(`⚠️ Warning sur query [${query.slice(0, 30)}...]:`, err.message);
        }
      });
    }

    console.log('✅ Base de données PostgreSQL initialisée');
  } catch (err) {
    console.error('❌ Erreur lors de l\'initialisation de la DB:', err.message);
  }
};

initDB().catch(err => {
  console.error('❌ Erreur init DB:', err.message);
  process.exit(1);
});

module.exports = pool;
