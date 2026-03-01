const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const COLORS = ['#FF6B35', '#E94560', '#7B2FBE', '#00C9A7', '#F7C59F', '#3A86FF'];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ error: 'Tous les champs sont obligatoires' });
  if (username.length < 3)
    return res.status(400).json({ error: "Le nom d'utilisateur doit faire au moins 3 caractères" });
  if (password.length < 6)
    return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: 'Email invalide' });

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existing.rows.length > 0)
      return res.status(409).json({ error: "Email ou nom d'utilisateur déjà utilisé" });

    const passwordHash = await bcrypt.hash(password, 12);
    const avatarColor = randomColor();

    const result = await db.query(
      'INSERT INTO users (username, email, password_hash, avatar_color) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, passwordHash, avatarColor]
    );
    const userId = result.rows[0].id;

    const token = jwt.sign(
      { id: userId, username, email, avatarColor },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: { id: userId, username, email, avatarColor }
    });
  } catch (err) {
    console.error('Erreur register:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword)
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });

    await db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, avatarColor: user.avatar_color },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarColor: user.avatar_color }
    });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
