#!/bin/bash

echo "íº€ Pulling latest images..."

docker pull anish1144/emerald-water-backend:latest
docker pull anish1144/bottle:latest

echo "í»‘ Stopping old containers..."

docker rm -f emerald-backend 2>/dev/null
docker rm -f emerald-frontend 2>/dev/null

echo "â–¶ Starting Backend..."

docker run -d \
  --name emerald-backend \
  --env-file /home/ubuntu/Emerald-Water/backend/.env \
  -p 5000:5000 \
  anish1144/emerald-water-backend:latest

echo "â–¶ Starting Frontend..."

docker run -d \
  --name emerald-frontend \
  -p 3000:3000 \
  anish1144/bottle:latest

echo "âœ… Deployment Completed!"
docker ps

