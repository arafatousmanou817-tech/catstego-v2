# 🐱 CatStego — Messages Secrets dans des Chats

Application de **stéganographie** complète : cachez des messages secrets dans des photos de chats et partagez-les via un chat chiffré en temps réel.

---

## 🚀 Installation & Lancement

### Prérequis

- **Node.js** v18+
- **npm** v9+

### Étape 1 — Backend

```bash
cd backend
npm install
node server.js
```

Le serveur démarre sur `http://localhost:3001`

### Étape 2 — Frontend (dans un autre terminal)

```bash
cd frontend
npm install
npm run dev
```

L'app s'ouvre sur `http://localhost:5173`

---

## 🧱 Stack Technique

| Composant       | Technologie                   |
| --------------- | ----------------------------- |
| Frontend        | React 18 + Vite + TailwindCSS |
| Backend         | Node.js + Express             |
| Base de données | Postgres                      |
| Temps réel      | Socket.IO                     |
| Auth            | JWT (localStorage)            |
| Stéganographie  | Canvas API (LSB)              |
| Chiffrement     | XOR + AES-256 (CryptoJS)      |
| Images chats    | cataas.com API                |

---

## 🔐 Fonctionnalités

### 🐱 Stéganographie LSB

- Choisir un chat depuis **cataas.com** ou importer depuis la galerie
- Cacher un message avec **XOR** ou **AES-256**
- Indicateur de force de clé (4 niveaux)
- Easter egg : entrez la clé `meow` 🐱
- Télécharger ou envoyer directement à un contact
- Délimiteur `###END###` pour marquer la fin du message
- Format PNG obligatoire pour préserver les LSBs

### 💬 Chat en temps réel

- Conversations privées Socket.IO
- Envoi d'images CatStego directement dans le chat
- Bouton "Décoder" sur les images reçues (clé jamais envoyée sur le réseau)
- Indicateur "En train d'écrire..."
- Horodatage des messages
- Statut en ligne / hors ligne

### 👥 Contacts

- Recherche par username ou email
- Ajout / suppression de contacts
- Statut en ligne en temps réel

### 🔑 Authentification

- Inscription avec validation client + serveur
- Mots de passe hashés avec bcrypt
- JWT stocké en localStorage (7 jours)

---

## 📁 Structure du projet

```txt
catstego-v2/
├── backend/
│   ├── server.js          # Express + Socket.IO
│   ├── db.js              # SQLite init
│   ├── routes/
│   │   ├── auth.js        # /register, /login
│   │   ├── contacts.js    # CRUD contacts
│   │   └── messages.js    # Historique messages
│   └── middleware/
│       └── auth.js        # Vérification JWT
└── frontend/
    └── src/
        ├── App.jsx
        ├── pages/
        │   ├── Login.jsx, Register.jsx
        │   ├── Home.jsx, Encode.jsx, Decode.jsx
        │   ├── Chat.jsx, Contacts.jsx
        ├── components/
        │   ├── PhoneFrame.jsx, Navbar.jsx
        │   ├── CatGallery.jsx, KeyStrength.jsx
        ├── utils/
        │   ├── steganography.js  # LSB encode/decode
        │   └── crypto.js         # XOR + AES-256
        └── context/
            ├── AuthContext.jsx
            └── SocketContext.jsx
```

---

## 🗃️ Base de données SQLite

```sql
users     — id, username, email, password_hash, avatar_color, created_at, last_seen
contacts  — id, user_id, contact_id, created_at
messages  — id, sender_id, receiver_id, content, type, is_read, created_at
```

---

## 🎨 Design

- Thème sombre avec **phone frame** mobile-first
- Primary : `#FF6B35` (orange chat)
- Accent : `#E94560` (rouge-rose)
- Background : `#0D0D0D / #1A1A2E`
- Police : **Poppins**
- Icônes : **lucide-react**

---

## 🔒 Sécurité

- Les clés de déchiffrement ne transitent **jamais** sur le réseau
- Décodage 100% côté client (Canvas API)
- Mots de passe hashés avec **bcrypt** (coût 12)
- JWT signé avec secret dédié
