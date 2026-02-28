const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// GET /api/contacts - Liste mes contacts
router.get('/', verifyToken, (req, res) => {
  try {
    const contacts = db.prepare(`
      SELECT u.id, u.username, u.email, u.avatar_color, u.last_seen, c.created_at as added_at
      FROM contacts c
      JOIN users u ON u.id = c.contact_id
      WHERE c.user_id = ?
      ORDER BY u.username ASC
    `).all(req.user.id);

    res.json(contacts);
  } catch (err) {
    console.error('Erreur get contacts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/contacts/search?q=xxx - Chercher des utilisateurs
router.get('/search', verifyToken, (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Recherche trop courte' });
  }

  try {
    const users = db.prepare(`
      SELECT id, username, email, avatar_color
      FROM users
      WHERE (username LIKE ? OR email LIKE ?) AND id != ?
      LIMIT 10
    `).all(`%${q}%`, `%${q}%`, req.user.id);

    // Indiquer si déjà dans les contacts
    const contactIds = db.prepare(
      'SELECT contact_id FROM contacts WHERE user_id = ?'
    ).all(req.user.id).map(c => c.contact_id);

    const result = users.map(u => ({
      ...u,
      isContact: contactIds.includes(u.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur search contacts:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/contacts/add - Ajouter un contact
router.post('/add', verifyToken, (req, res) => {
  const { contactId } = req.body;

  if (!contactId) {
    return res.status(400).json({ error: 'contactId requis' });
  }

  if (contactId === req.user.id) {
    return res.status(400).json({ error: 'Vous ne pouvez pas vous ajouter vous-même' });
  }

  try {
    const targetUser = db.prepare('SELECT id, username, email, avatar_color FROM users WHERE id = ?').get(contactId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    const existing = db.prepare(
      'SELECT id FROM contacts WHERE user_id = ? AND contact_id = ?'
    ).get(req.user.id, contactId);

    if (existing) {
      return res.status(409).json({ error: 'Déjà dans vos contacts' });
    }

    db.prepare('INSERT INTO contacts (user_id, contact_id) VALUES (?, ?)').run(req.user.id, contactId);

    res.status(201).json({ message: 'Contact ajouté', contact: targetUser });
  } catch (err) {
    console.error('Erreur add contact:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/contacts/:id - Supprimer un contact
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const result = db.prepare(
      'DELETE FROM contacts WHERE user_id = ? AND contact_id = ?'
    ).run(req.user.id, req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact introuvable' });
    }

    res.json({ message: 'Contact supprimé' });
  } catch (err) {
    console.error('Erreur delete contact:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
