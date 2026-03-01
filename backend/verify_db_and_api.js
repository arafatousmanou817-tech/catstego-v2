const db = require('./db');

async function verify() {
  console.log('--- Verifying Database Schema ---');
  try {
    const tables = await db.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `);
    const tableNames = tables.rows.map(r => r.table_name);
    console.log('Tables found:', tableNames);

    const requiredTables = ['users', 'contacts', 'messages', 'push_subscriptions'];
    for (const table of requiredTables) {
      if (tableNames.includes(table)) {
        console.log(`✅ Table '${table}' exists`);
      } else {
        console.error(`❌ Table '${table}' is MISSING`);
      }
    }

    const indexes = await db.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `);
    const indexNames = indexes.rows.map(r => r.indexname);
    console.log('Indexes found:', indexNames);

    const requiredIndexes = ['idx_messages_sender_receiver', 'idx_messages_receiver_read'];
    for (const idx of requiredIndexes) {
      if (indexNames.includes(idx)) {
        console.log(`✅ Index '${idx}' exists`);
      } else {
        console.error(`❌ Index '${idx}' is MISSING`);
      }
    }

  } catch (err) {
    console.error('Error during verification:', err);
  } finally {
    process.exit(0);
  }
}

verify();