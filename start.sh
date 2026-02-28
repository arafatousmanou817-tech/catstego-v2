#!/bin/bash
# Script de démarrage CatStego

echo "🐱 Démarrage de CatStego..."
echo ""

# Backend
echo "📦 Installation des dépendances backend..."
cd backend && npm install --silent

echo "🚀 Démarrage du serveur backend sur :3001..."
node server.js &
BACKEND_PID=$!

cd ..

# Frontend
echo "📦 Installation des dépendances frontend..."
cd frontend && npm install --silent

echo "🎨 Démarrage du frontend sur :5173..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ CatStego est prêt !"
echo "   Frontend : http://localhost:5173"
echo "   Backend  : http://localhost:3001"
echo ""
echo "Appuyez sur CTRL+C pour arrêter"

wait
