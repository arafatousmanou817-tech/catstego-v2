const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/messages/:contactId - Historique conversation
router.get('/:contactId', verifyToken, async (req, res) => {
  const { contactId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const messages = await db.query(`
      SELECT m.*,
        s.username as sender_username, s.avatar_color as sender_color,
        r.username as receiver_username
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE (m.sender_id = $1 AND m.receiver_id = $2)
         OR (m.sender_id = $2 AND m.receiver_id = $1)
      ORDER BY m.created_at DESC
      LIMIT $3 OFFSET $4
    `, [req.user.id, contactId, limit, offset]);

    await db.query(`
      UPDATE messages SET is_read = 1
      WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0
    `, [contactId, req.user.id]);

    res.json(messages.rows.reverse());
  } catch (err) {
    console.error('Erreur get messages:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages - Résumé des conversations
router.get('/', verifyToken, async (req, res) => {
  const uid = req.user.id;
  try {
    const conversations = await db.query(`
      SELECT DISTINCT ON (pair)
        CASE WHEN m.sender_id < m.receiver_id
             THEN m.sender_id || '_' || m.receiver_id
             ELSE m.receiver_id || '_' || m.sender_id END as pair,
        m.*,
        CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.username as other_username,
        u.avatar_color as other_color,
        (SELECT COUNT(*) FROM messages
         WHERE sender_id = u.id AND receiver_id = $1 AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = $1 THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = $1 OR m.receiver_id = $1
      ORDER BY pair, m.created_at DESC
    `, [uid]);

    res.json(conversations.rows);
  } catch (err) {
    console.error('Erreur get conversations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages - Envoyer un message (HTTP fallback)
router.post('/', verifyToken, async (req, res) => {
  const { receiverId, content, type = 'text' } = req.body;
  if (!receiverId || !content)
    return res.status(400).json({ error: 'receiverId et content requis' });

  try {
    const result = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES ($1, $2, $3, $4) RETURNING id',
      [req.user.id, receiverId, content, type]
    );
    const msg = await db.query(`
      SELECT m.*, s.username as sender_username, s.avatar_color as sender_color
      FROM messages m JOIN users s ON s.id = m.sender_id
      WHERE m.id = $1
    `, [result.rows[0].id]);

    res.status(201).json(msg.rows[0]);
  } catch (err) {
    console.error('Erreur send message:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
