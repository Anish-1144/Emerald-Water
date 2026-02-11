#!/bin/bash

echo "🚀 Building and pushing Docker images..."

# Backend
echo "🔹 Building Backend..."
docker buildx build \
  --platform linux/amd64 \
  --no-cache \
  -t anish1144/emerald-water-backend:latest \
  --push ./backend

# Frontend
echo "🔹 Building Frontend..."
docker buildx build \
  --platform linux/amd64 \
  --no-cache \
  --build-arg NEXT_PUBLIC_API_URL=http://35.183.183.144:5000/api \
  -t anish1144/bottle:latest \
  --push ./frontend

echo "✅ Build & Push Completed Successfully!"
