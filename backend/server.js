require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? false // même origine, CORS non nécessaire
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true
  },
  maxHttpBufferSize: 10 * 1024 * 1024
});

// Middleware
app.use(cors({
  origin: ALLOWED_ORIGINS,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/messages', require('./routes/messages'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '2.0.0' }));

// Map userId -> socketId
const onlineUsers = new Map();

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token manquant'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Token invalide'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id;
  console.log(`✅ Utilisateur connecté: ${socket.user.username} (${socket.id})`);

  // Enregistrer l'utilisateur en ligne
  onlineUsers.set(userId, socket.id);
  db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(userId);

  // Diffuser la liste des utilisateurs en ligne
  io.emit('online_users', Array.from(onlineUsers.keys()));

  // Rejoindre une salle de conversation
  socket.on('join_room', ({ roomId }) => {
    socket.join(roomId);
    console.log(`${socket.user.username} rejoint la salle ${roomId}`);
  });

  // Quitter une salle
  socket.on('leave_room', ({ roomId }) => {
    socket.leave(roomId);
  });

  // Envoyer un message
  socket.on('send_message', (data) => {
    const { receiverId, content, type = 'text', tempId } = data;

    try {
      const result = db.prepare(
        'INSERT INTO messages (sender_id, receiver_id, content, type) VALUES (?, ?, ?, ?)'
      ).run(userId, receiverId, content, type);

      const message = db.prepare(`
        SELECT m.*, s.username as sender_username, s.avatar_color as sender_color
        FROM messages m JOIN users s ON s.id = m.sender_id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

      const roomId = [userId, receiverId].sort((a, b) => a - b).join('_');

      // Envoyer au destinataire s'il est en ligne
      const receiverSocketId = onlineUsers.get(parseInt(receiverId));
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', { ...message, tempId });
      }

      // Confirmer à l'expéditeur
      socket.emit('message_sent', { ...message, tempId });

    } catch (err) {
      console.error('Erreur send_message socket:', err);
      socket.emit('message_error', { error: 'Erreur lors de l\'envoi', tempId });
    }
  });

  // Indicateur de frappe
  socket.on('typing', ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(parseInt(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', {
        userId,
        username: socket.user.username
      });
    }
  });

  socket.on('stop_typing', ({ receiverId }) => {
    const receiverSocketId = onlineUsers.get(parseInt(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { userId });
    }
  });

  // Marquer messages comme lus
  socket.on('mark_read', ({ senderId }) => {
    db.prepare(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0'
    ).run(senderId, userId);

    const senderSocketId = onlineUsers.get(parseInt(senderId));
    if (senderSocketId) {
      io.to(senderSocketId).emit('messages_read', { byUserId: userId });
    }
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log(`❌ Déconnexion: ${socket.user.username}`);
    onlineUsers.delete(userId);
    db.prepare('UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(userId);
    io.emit('online_users', Array.from(onlineUsers.keys()));
  });
});

// Serve frontend static files in production
const frontendDist = path.join(__dirname, 'dist');
app.use(express.static(frontendDist));

// SPA fallback — toutes les routes non-API renvoient index.html
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendDist, 'index.html'));
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🐱 CatStego V2 démarré sur http://localhost:${PORT}`);
});
