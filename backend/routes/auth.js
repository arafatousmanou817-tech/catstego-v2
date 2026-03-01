const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { COLORS } = require('../config');
const { sendVerificationEmail } = require('../utils/email');
require('dotenv').config();

const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

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
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60000);

    await db.query(
      'INSERT INTO users (username, email, password_hash, avatar_color, verification_code, verification_expires) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, email, passwordHash, avatarColor, verificationCode, verificationExpires]
    );

    // Tentative d'envoi du mail (on continue même si ça échoue, le code est loggé sur le serveur)
    await sendVerificationEmail(email, verificationCode);

    const isSimulation = !process.env.EMAIL_HOST || process.env.EMAIL_USER === 'user@example.com';
    res.status(201).json({
      message: isSimulation
        ? `[SIMULATION] Compte créé. Code : ${verificationCode}`
        : 'Compte créé avec succès. Un code de vérification a été envoyé.',
      email
    });
  } catch (err) {
    console.error('🔴 Erreur register:', err.message);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requis' });

  try {
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 15 * 60000);

    const result = await db.query(
      'UPDATE users SET verification_code = $1, verification_expires = $2 WHERE email = $3 AND is_verified = FALSE RETURNING id',
      [verificationCode, verificationExpires, email]
    );

    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Compte introuvable ou déjà vérifié' });

    await sendVerificationEmail(email, verificationCode);

    const isSimulation = !process.env.EMAIL_HOST || process.env.EMAIL_USER === 'user@example.com';
    res.json({
      message: isSimulation
        ? `[SIMULATION] Nouveau code : ${verificationCode}`
        : 'Nouveau code envoyé'
    });
  } catch (err) {
    console.error('🔴 Erreur resend:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ error: 'Email et code requis' });

  try {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND verification_code = $2 AND verification_expires > NOW()',
      [email, code]
    );
    const user = result.rows[0];

    if (!user)
      return res.status(400).json({ error: 'Code invalide ou expiré' });

    await db.query(
      'UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, avatarColor: user.avatar_color },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Email vérifié avec succès',
      token,
      user: { id: user.id, username: user.username, email: user.email, avatarColor: user.avatar_color }
    });
  } catch (err) {
    console.error('🔴 Erreur verify-email:', err.message);
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

    if (!user.is_verified) {
      // Pour faciliter le test si le mail ne part pas (pas de config SMTP)
      const isSimulation = !process.env.EMAIL_HOST || process.env.EMAIL_USER === 'user@example.com';
      let error = 'Compte non vérifié. Veuillez entrer le code reçu par email.';
      if (isSimulation) {
        error = `[SIMULATION] Compte non vérifié. Utilisez le code : ${user.verification_code}`;
      }
      return res.status(403).json({
        error,
        needsVerification: true,
        email: user.email
      });
    }

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
    console.error('🔴 Erreur login:', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
