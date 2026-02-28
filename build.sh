#!/bin/bash
set -e

echo "📦 Installing frontend dependencies (including devDeps)..."
cd /app/frontend
NODE_ENV=development npm install

echo "🔨 Building frontend..."
npm run build

echo "📁 Copying dist to backend..."
cp -r dist /app/backend/dist

echo "📦 Installing backend dependencies..."
cd /app/backend
npm install

echo "✅ Build complete!"
