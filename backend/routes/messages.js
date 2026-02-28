const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/messages/:contactId - Historique conversation
router.get('/:contactId', verifyToken, (req, res) => {
  const { contactId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const messages = db.prepare(`
      SELECT m.*, 
        s.username as sender_username, s.avatar_color as sender_color,
        r.username as receiver_username
      FROM messages m
      JOIN users s ON s.id = m.sender_id
      JOIN users r ON r.id = m.receiver_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).all(req.user.id, contactId, contactId, req.user.id, limit, offset);

    // Marquer comme lus
    db.prepare(`
      UPDATE messages SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(contactId, req.user.id);

    res.json(messages.reverse());
  } catch (err) {
    console.error('Erreur get messages:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/messages - Résumé des conversations (dernier message par contact)
router.get('/', verifyToken, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT 
        m.*,
        CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
        u.username as other_username,
        u.avatar_color as other_color,
        (SELECT COUNT(*) FROM messages 
         WHERE sender_id = u.id AND receiver_id = ? AND is_read = 0) as unread_count
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END
      WHERE m.id IN (
        SELECT MAX(id) FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        GROUP BY CASE WHEN sender_id < receiver_id THEN sender_id || '_' || receiver_id
                      ELSE receiver_id || '_' || sender_id END
      )
      ORDER BY m.created_at DESC
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json(conversations);
  } catch (err) {
    console.error('Erreur get conversations:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/messages - Envoyer un message (HTTP fallback)
router.post('/', verifyToken, (req, res) => {
  const { receiverId, content, type = 'text' } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: 'receiverId et content requis' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, receiverId, content, type);

    const message = db.prepare(`
      SELECT m.*, s.username as sender_username, s.avatar_color as sender_color
      FROM messages m JOIN users s ON s.id = m.sender_id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(message);
  } catch (err) {
    console.error('Erreur send message:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
