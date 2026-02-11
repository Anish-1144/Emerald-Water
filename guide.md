Let’s make this clean and professional 👌
I’ll give you:

* ✅ **Build & Push script (Local Machine)**
* ✅ **Pull & Run script (EC2)**
* 🚀 Production-ready and reusable

---

# 🖥️ 1️⃣ LOCAL MACHINE — Build & Push Script

Create a file:

```
build-and-push.sh
```

```bash
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
```

---

## 🔧 Make It Executable (Mac/Linux / Git Bash)

```bash
chmod +x build-and-push.sh
```

Run:

```bash
./build-and-push.sh
```

---

# 🖥️ 2️⃣ EC2 — Pull & Run Script

Create file on EC2:

```
deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Pulling latest images..."

docker pull anish1144/emerald-water-backend:latest
docker pull anish1144/bottle:latest

echo "🛑 Stopping old containers..."

docker rm -f emerald-backend 2>/dev/null
docker rm -f emerald-frontend 2>/dev/null

echo "▶ Starting Backend..."

docker run -d \
  --name emerald-backend \
  --env-file /home/ubuntu/Emerald-Water/backend/.env \
  -p 5000:5000 \
  anish1144/emerald-water-backend:latest

echo "▶ Starting Frontend..."

docker run -d \
  --name emerald-frontend \
  -p 3000:3000 \
  anish1144/bottle:latest

echo "✅ Deployment Completed!"
docker ps
```

---

## 🔧 Make Executable on EC2

```bash
chmod +x deploy.sh
```

Run anytime you update:

```bash
./deploy.sh
```

---

# 🏆 Now Your Deployment Flow Is

### 🖥️ Local:

```bash
./build-and-push.sh
```

### 🌍 EC2:

```bash
./deploy.sh
```

---

# 🔥 Pro Tip (Next Level)

Later we can:

* Use docker-compose
* Add Nginx reverse proxy
* Add domain
* Add HTTPS (free SSL)
* Set up CI/CD (auto deploy on push)

If you want production-level architecture for Emerald Water, tell me 🚀
