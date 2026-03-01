const express = require('express');
const router = express.Router();
const webpush = require('web-push');
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

webpush.setVapidDetails(
  'mailto:catstego@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// GET /api/push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

// POST /api/push/subscribe
router.post('/subscribe', verifyToken, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth)
    return res.status(400).json({ error: 'Subscription invalide' });

  try {
    await db.query(`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4
    `, [req.user.id, endpoint, keys.p256dh, keys.auth]);

    res.json({ message: 'Abonné aux notifications' });
  } catch (err) {
    console.error('Erreur subscribe:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/push/unsubscribe
router.post('/unsubscribe', verifyToken, async (req, res) => {
  const { endpoint } = req.body;
  try {
    await db.query(
      'DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2',
      [req.user.id, endpoint]
    );
    res.json({ message: 'Désabonné' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Fonction utilitaire : envoyer une push à un user (appelée depuis server.js)
const sendPushToUser = async (userId, payload) => {
  try {
    const result = await db.query(
      'SELECT * FROM push_subscriptions WHERE user_id = $1',
      [userId]
    );

    const sends = result.rows.map(async (sub) => {
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };
      try {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
      } catch (err) {
        // Subscription expirée → supprimer
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
        }
      }
    });

    await Promise.allSettled(sends);
  } catch (err) {
    console.error('Erreur sendPushToUser:', err);
  }
};

module.exports = { router, sendPushToUser };
