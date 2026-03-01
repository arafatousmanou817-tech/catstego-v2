const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#FF6B35',
      is_verified BOOLEAN DEFAULT FALSE,
      verification_code TEXT,
      verification_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      last_seen TIMESTAMP
    );

    -- Migration pour les tables existantes
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_verified') THEN
        ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_code') THEN
        ALTER TABLE users ADD COLUMN verification_code TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='verification_expires') THEN
        ALTER TABLE users ADD COLUMN verification_expires TIMESTAMP;
      END IF;
    END $$;

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      contact_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, contact_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, endpoint)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
    CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON messages(receiver_id, is_read);
  `);
  console.log('✅ Base de données PostgreSQL initialisée');
};

initDB().catch(err => {
  console.error('❌ Erreur init DB:', err.message);
  process.exit(1);
});

module.exports = pool;
