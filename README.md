# 🐱 CatStego — Messages Secrets dans des Chats

Application de **stéganographie** et de messagerie sécurisée : cachez des messages chiffrés dans des photos de chats et partagez-les via un chat en temps réel.

---

## 🚀 Fonctionnalités Clés

### 🐱 Stéganographie Avancée (LSB)
- **Cacher du texte** dans les pixels d'une image de chat sans altération visible.
- **Support PNG obligatoire** pour garantir l'intégrité des données (format sans perte).
- **Calcul de capacité** en temps réel selon la résolution de l'image.
- **Galerie intégrée** : récupérez des images de chats aléatoires via l'API [CATAAS](https://cataas.com).

### 🔐 Chiffrement Client-Side
- Les messages sont chiffrés **avant** d'être injectés dans l'image.
- **Algorithmes** : XOR (rapide) ou AES-256 (ultra-sécurisé via CryptoJS).
- **Indicateur de force** : Analyse de la robustesse de votre clé de chiffrement.
- **Confidentialité Totale** : Les clés de chiffrement ne transitent **jamais** sur le réseau.

### 💬 Chat Temps Réel & Social
- **Conversations privées** via Socket.IO.
- **Indicateurs d'état** : Utilisateurs en ligne, "En train d'écrire...", statuts de lecture.
- **Partage fluide** : Envoyez vos images "CatStego" directement dans la conversation.
- **Décodage Rapide** : Bouton "Décoder" intégré aux messages reçus pour extraire le secret instantanément.

### 🔔 Notifications & Alertes
- **Push Notifications** : Recevez des alertes même quand l'application est fermée (Web Push / VAPID).
- **Système de Toast** : Notifications in-app pour les succès, erreurs et nouveaux messages.

### 🛡️ Sécurité & Authentification
- **Inscription vérifiée** : Validation par code OTP envoyé par email (via Brevo).
- **Mode Simulation** : Si aucune clé API email n'est configurée, le code OTP s'affiche dans les logs serveurs pour le développement.
- **Protection** : Mots de passe hashés avec **bcrypt**, authentification par **JWT**, et **Rate Limiting** sur les routes sensibles.

---

## 🧱 Stack Technique

| Composant | Technologie |
| :--- | :--- |
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **Backend** | Node.js, Express |
| **Base de données** | PostgreSQL |
| **Temps réel** | Socket.IO |
| **Chiffrement** | CryptoJS (AES-256) |
| **Notifications** | Web-Push (VAPID) |
| **Emails** | Brevo API (ex-Sendinblue) |

---

## ⚙️ Installation & Configuration

### Prérequis
- Node.js v18+
- Une instance PostgreSQL

### 1. Configuration du Backend
```bash
cd backend
npm install
```
Créez un fichier `.env` dans le dossier `backend` en vous basant sur `.env.example` :
```env
PORT=3001
JWT_SECRET=votre_secret_jwt
DATABASE_URL=postgres://user:password@localhost:5432/catstego
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
BREVO_API_KEY=...
EMAIL_FROM=...
```
*Note : Si `BREVO_API_KEY` n'est pas renseignée, les codes de vérification s'afficheront dans la console du serveur.*

### 2. Lancement du projet
**Démarrer le serveur :**
```bash
cd backend
node server.js
```

**Démarrer le frontend :**
```bash
cd frontend
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

---

## 📁 Structure du Projet

```txt
.
├── backend/
│   ├── routes/           # Auth, Contacts, Messages, Push
│   ├── middleware/       # Protection JWT, Rate Limiter
│   ├── utils/            # Emailing, Push logic
│   ├── db.js             # Client PostgreSQL & Initialisation
│   └── server.js         # Entrée Express + Socket.IO
└── frontend/
    └── src/
        ├── components/   # UI: CatGallery, Navbar, PhoneFrame...
        ├── context/      # Auth, Socket, Notifications
        ├── pages/        # Login, Chat, Encode, Decode...
        ├── utils/        # Steganography.js, Crypto.js
        └── main.jsx
```

---

## 🎨 Design
L'application utilise une esthétique **Dark Mode** inspirée du gaming :
- **Couleurs** : Orange Chat (`#FF6B35`), Rouge-Rose (`#E94560`), Fond Sombre (`#0D0D0D`).
- **Mobile First** : L'interface est encapsulée dans une "Phone Frame" pour une expérience utilisateur centrée sur le mobile.

---

## ⚠️ Avertissement
Cette application est un projet de démonstration technique. Bien que le chiffrement AES-256 soit robuste, la stéganographie LSB est détectable par des outils d'analyse statistique de pixels. N'utilisez pas cet outil pour des communications critiques sans comprendre les limites de la stéganographie.
