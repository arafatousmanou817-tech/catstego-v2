require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { router: pushRouter, sendPushToUser } = require('./routes/push');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? false
  : ['http://localhost:5173', 'http://localhost:3000'];

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ['GET', 'POST'], credentials: true },
  maxHttpBufferSize: 10 * 1024 * 1024
});

app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/push', pushRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Serve frontend
const frontendDist = path.join(__dirname, 'dist');
app.use(express.static(frontendDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

// Socket.IO
const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token manquant'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`✅ Connecté: ${socket.user.username}`);

  onlineUsers.set(userId, socket.id);
  db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]).catch(console.error);
  io.emit('online_users', Array.from(onlineUsers.keys()));

  socket.on('join_room', ({ roomId }) => socket.join(roomId));
  socket.on('leave_room', ({ roomId }) => socket.leave(roomId));

  socket.on('send_message', async (data) => {
    const { receiverId, content, type = 'text', tempId } = data;
    try {
      const result = await db.query(
        'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES ($1, $2, $3, $4) RETURNING id',
        [userId, receiverId, content, type]
      );
      const msg = await db.query(`
        SELECT m.*, s.username as sender_username, s.avatar_color as sender_color
        FROM messages m JOIN users s ON s.id = m.sender_id
        WHERE m.id = $1
      `, [result.rows[0].id]);

      const message = msg.rows[0];
      const receiverSocketId = onlineUsers.get(parseInt(receiverId));
      if (receiverSocketId) io.to(receiverSocketId).emit('receive_message', { ...message, tempId });
      socket.emit('message_sent', { ...message, tempId });

      // Envoyer une push notification si le destinataire n'est pas sur l'app
      const isOnline = onlineUsers.has(parseInt(receiverId));
      if (!isOnline) {
        const isImage = type === 'catstego_image';
        await sendPushToUser(parseInt(receiverId), {
          title: `🐱 ${socket.user.username}`,
          body: isImage ? '🔒 Vous avez reçu une image CatStego' : content.slice(0, 100),
          tag: `msg-${userId}`,
          url: '/chat',
          senderId: userId,
          icon: '/cat-icon.png'
        });
      }
    } catch (err) {
      console.error('Erreur send_message socket:', err);
      socket.emit('message_error', { error: "Erreur lors de l'envoi", tempId });
    }
  });

  socket.on('typing', ({ receiverId }) => {
    const s = onlineUsers.get(parseInt(receiverId));
    if (s) io.to(s).emit('user_typing', { userId, username: socket.user.username });
  });

  socket.on('stop_typing', ({ receiverId }) => {
    const s = onlineUsers.get(parseInt(receiverId));
    if (s) io.to(s).emit('user_stop_typing', { userId });
  });

  socket.on('mark_read', ({ senderId }) => {
    db.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = $1 AND receiver_id = $2 AND is_read = 0',
      [senderId, userId]
    ).then(() => {
      const s = onlineUsers.get(parseInt(senderId));
      if (s) io.to(s).emit('messages_read', { byUserId: userId });
    }).catch(console.error);
  });

  socket.on('disconnect', () => {
    console.log(`❌ Déconnecté: ${socket.user.username}`);
    onlineUsers.delete(userId);
    db.query('UPDATE users SET last_seen = NOW() WHERE id = $1', [userId]).catch(console.error);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🐱 CatStego V2 démarré sur http://localhost:${PORT}`));
