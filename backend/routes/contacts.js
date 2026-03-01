const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/contacts
router.get('/', verifyToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.username, u.email, u.avatar_color, u.last_seen, c.created_at as added_at
      FROM contacts c
      JOIN users u ON u.id = c.contact_id
      WHERE c.user_id = $1
      ORDER BY u.username ASC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Erreur get contacts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/contacts/search?q=xxx
router.get('/search', verifyToken, async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2)
    return res.status(400).json({ error: 'Recherche trop courte' });

  try {
    const users = await db.query(`
      SELECT id, username, email, avatar_color
      FROM users
      WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2
      LIMIT 10
    `, [`%${q}%`, req.user.id]);

    const contactIds = await db.query(
      'SELECT contact_id FROM contacts WHERE user_id = $1',
      [req.user.id]
    );
    const contactIdSet = new Set(contactIds.rows.map(c => c.contact_id));

    const result = users.rows.map(u => ({
      ...u,
      isContact: contactIdSet.has(u.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur search contacts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contacts/add
router.post('/add', verifyToken, async (req, res) => {
  const { contactId } = req.body;

  if (!contactId)
    return res.status(400).json({ error: 'contactId requis' });
  if (parseInt(contactId) === req.user.id)
    return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });

  try {
    const targetUser = await db.query(
      'SELECT id, username, email, avatar_color FROM users WHERE id = $1',
      [contactId]
    );
    if (targetUser.rows.length === 0)
      return res.status(404).json({ error: 'Utilisateur introuvable' });

    const existing = await db.query(
      'SELECT id FROM contacts WHERE user_id = $1 AND contact_id = $2',
      [req.user.id, contactId]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: 'Déjà dans vos contacts' });

    await db.query(
      'INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2)',
      [req.user.id, contactId]
    );

    res.status(201).json({ message: 'Contact ajouté', contact: targetUser.rows[0] });
  } catch (err) {
    console.error('Erreur add contact:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM contacts WHERE user_id = $1 AND contact_id = $2',
      [req.user.id, req.params.id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Contact introuvable' });

    res.json({ message: 'Contact supprimé' });
  } catch (err) {
    console.error('Erreur delete contact:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
