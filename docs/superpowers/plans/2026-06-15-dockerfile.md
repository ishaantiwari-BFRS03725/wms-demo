# Dockerfile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Containerize the WMS Demo as a production Node.js SSR image using a multi-stage Docker build.

**Architecture:** A `build:server` npm script builds the app with Nitro's `node-server` preset (producing `.output/`). A two-stage Dockerfile installs deps and compiles in stage 1, then copies only `.output/` into a clean runtime image in stage 2. Cloudflare build path (`npm run build`) is untouched.

**Tech Stack:** Node 22 Alpine, Nitro `node-server` preset, TanStack Start, Vite, npm

---

### Task 1: Add `build:server` script to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the script**

In `package.json`, add `"build:server"` to the `scripts` block (after `"build"`):

```json
"scripts": {
  "dev": "vite dev",
  "build": "vite build",
  "build:dev": "vite build --mode development",
  "build:server": "NITRO_PRESET=node-server vite build",
  "preview": "vite preview",
  "lint": "eslint .",
  "format": "prettier --write ."
},
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "feat: add build:server script for Node.js/Docker deployment"
```

---

### Task 2: Create .dockerignore

**Files:**
- Create: `.dockerignore`

- [ ] **Step 1: Create the file**

```
node_modules
.output
.nitro
.git
.gitignore
docs
artefacts
*.html
dist
*.local
.env*
```

- [ ] **Step 2: Commit**

```bash
git add .dockerignore
git commit -m "feat: add .dockerignore for Docker build context"
```

---

### Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Create the file**

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:server

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Node.js SSR deployment"
```

---

### Task 4: Test the build

**Files:** none (verification only)

- [ ] **Step 1: Build the image**

```bash
docker build -t wms-demo .
```

Expected output ends with:
```
Successfully built <image-id>
Successfully tagged wms-demo:latest
```
Exit code must be `0`. If it fails, check the error output — common causes are missing `package-lock.json` (needed for `npm ci`) or Nitro failing to resolve the `node-server` preset.

- [ ] **Step 2: Verify the image exists**

```bash
docker images wms-demo
```

Expected: one row with repository `wms-demo`, tag `latest`, and a non-zero size.

- [ ] **Step 3: Smoke-test the container starts**

```bash
docker run --rm -p 3000:3000 wms-demo &
sleep 3
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: HTTP status `200`. Kill the container after:

```bash
docker stop $(docker ps -q --filter ancestor=wms-demo)
```

- [ ] **Step 4: Commit verification note**

No code change needed — build success is sufficient. The image is ready for use.
